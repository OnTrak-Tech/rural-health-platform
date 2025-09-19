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
from app.routes import ocr  # OCR functionality
from app.routes import medical_history  # Medical history access
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

# CORS origins
origins_env = os.getenv("ALLOW_ORIGINS", "http://localhost:3000")
allowed_origins = [o.strip() for o in origins_env.split(",") if o.strip()]

# Socket.IO server
sio = socketio.AsyncServer(
    cors_allowed_origins=allowed_origins,
    async_mode='asgi'
)

# FastAPI app
app = FastAPI(
    title="Healthcare Platform API - Enhanced Security",
    description="HIPAA-compliant healthcare platform with secure doctor registration",
    version="2.0.0"
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

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
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(patients.router, prefix="/api/patients", tags=["patients"])
app.include_router(doctors.router, prefix="/api/doctors", tags=["doctors"])
app.include_router(consultations.router, prefix="/api/consultations", tags=["consultations"])
app.include_router(files.router, prefix="/api/files", tags=["files"])
app.include_router(knowledge.router, prefix="/api/knowledge", tags=["knowledge"])
app.include_router(triage.router, prefix="/api/triage", tags=["triage"])
app.include_router(sync.router, prefix="/api/sync", tags=["sync"])
app.include_router(ocr.router, prefix="/api/ocr", tags=["ocr"])
app.include_router(medical_history.router, prefix="/api/medical-history", tags=["medical-history"])

# Socket.IO events
@sio.event
async def connect(sid, environ):
    print(f"Socket.IO client connected: {sid}")

@sio.event
async def join_consultation(sid, data):
    consultation_id = data.get('consultationId')
    if consultation_id:
        await sio.enter_room(sid, str(consultation_id))
        print(f"User {sid} joined consultation room {consultation_id}")
        await sio.emit('user_joined', {'message': f'User joined consultation {consultation_id}'}, room=str(consultation_id))

@sio.event
async def chat_message(sid, data):
    consultation_id = data.get('consultationId')
    if consultation_id:
        print(f"Chat message in consultation {consultation_id}: {data}")
        # Broadcast to all users in the consultation room
        await sio.emit('chat-message', data, room=str(consultation_id))

@sio.event
async def video_signal(sid, data):
    consultation_id = data.get('consultationId')
    if consultation_id:
        await sio.emit('video-signal', data, room=str(consultation_id), skip_sid=sid)

@sio.event
async def disconnect(sid):
    print(f"Socket.IO client disconnected: {sid}")

# Combine FastAPI and Socket.IO
socket_app = socketio.ASGIApp(sio, app)

if __name__ == "__main__":
    uvicorn.run(
        socket_app, 
        host="0.0.0.0", 
        port=int(os.getenv("PORT", 8000))
    )