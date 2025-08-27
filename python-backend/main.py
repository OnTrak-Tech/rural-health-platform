from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from slowapi import _rate_limit_exceeded_handler
from app.limits import limiter
from slowapi.errors import RateLimitExceeded
import socketio
import uvicorn
import os
import logging
from dotenv import load_dotenv

from app.routes import auth, patients, doctors, consultations, files, knowledge
from app.routes import admin  # New admin routes
from app.routes import triage, sync  # New features
from app.middleware.auth_middleware import get_current_user
from app.database_enhanced import create_tables  # Enhanced database

load_dotenv()

# Fail fast on critical secrets
if not os.getenv("JWT_SECRET"):
    raise RuntimeError("JWT_SECRET environment variable is not set")
if not os.getenv("ENCRYPTION_KEY"):
    raise RuntimeError("ENCRYPTION_KEY environment variable is not set")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('audit.log'),
        logging.StreamHandler()
    ]
)

# Warn if missing super admin setup key
if not os.getenv("SUPER_ADMIN_SETUP_KEY"):
    logging.warning("SUPER_ADMIN_SETUP_KEY is not set; /api/auth/setup/super-admin will return 403. Set this env var to enable one-time super admin creation.")

# Create enhanced database tables
create_tables()

# Create secure documents directory
os.makedirs('secure_documents', exist_ok=True)

# Rate limiting with stricter limits for admin endpoints
app = FastAPI(
    title="Healthcare Platform API - Enhanced Security",
    description="HIPAA-compliant healthcare platform with secure doctor registration",
    version="2.0.0"
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS - More restrictive for production
origins_env = os.getenv("ALLOW_ORIGINS", "http://localhost:3000")
allowed_origins = [o.strip() for o in origins_env.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Socket.IO
sio = socketio.AsyncServer(cors_allowed_origins=allowed_origins)
socket_app = socketio.ASGIApp(sio, app)

@app.get("/")
async def root():
    return {
        "message": "Healthcare Platform API - Enhanced Security", 
        "docs": "/docs",
        "version": "2.0.0",
        "features": [
            "Secure doctor registration",
            "Document encryption",
            "Admin verification workflow",
            "Enhanced audit logging"
        ]
    }

# Routes
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])  # New admin routes
app.include_router(patients.router, prefix="/api/patients", tags=["patients"])
app.include_router(doctors.router, prefix="/api/doctors", tags=["doctors"])
app.include_router(consultations.router, prefix="/api/consultations", tags=["consultations"])
app.include_router(files.router, prefix="/api/files", tags=["files"])
app.include_router(knowledge.router, prefix="/api/knowledge", tags=["knowledge"])
app.include_router(triage.router, prefix="/api/triage", tags=["triage"])  # AI-assisted triage
app.include_router(sync.router, prefix="/api/sync", tags=["sync"])  # Offline-first sync

# Enhanced Socket.IO events with security
@sio.event
async def connect(sid, environ):
    # Log connection with IP for security
    client_ip = environ.get('REMOTE_ADDR', 'unknown')
    logging.getLogger("healthcare_audit").info(f"WebSocket connection: {sid} from {client_ip}")

@sio.event
async def join_consultation(sid, data):
    # Add authentication check for consultation rooms
    consultation_id = data.get('consultationId')
    if consultation_id:
        await sio.enter_room(sid, consultation_id)
        logging.getLogger("healthcare_audit").info(f"User {sid} joined consultation {consultation_id}")

@sio.event
async def video_signal(sid, data):
    consultation_id = data.get('consultationId')
    if consultation_id:
        await sio.emit('video-signal', data, room=consultation_id, skip_sid=sid)

@sio.event
async def chat_message(sid, data):
    consultation_id = data.get('consultationId')
    if consultation_id:
        # Log chat messages for audit
        logging.getLogger("healthcare_audit").info(f"Chat message in consultation {consultation_id}")
        await sio.emit('chat-message', data, room=consultation_id)

@sio.event
async def disconnect(sid):
    logging.getLogger("healthcare_audit").info(f"WebSocket disconnection: {sid}")

if __name__ == "__main__":
    uvicorn.run(
        socket_app, 
        host="0.0.0.0", 
        port=int(os.getenv("PORT", 8000)),
        ssl_keyfile=os.getenv("SSL_KEYFILE"),  # Optional SSL
        ssl_certfile=os.getenv("SSL_CERTFILE")
    )