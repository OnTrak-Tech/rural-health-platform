from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import socketio
import uvicorn
import os
from dotenv import load_dotenv

from app.routes import auth, patients, doctors, consultations, files, knowledge
from app.middleware.auth_middleware import get_current_user
from app.database import create_tables

load_dotenv()

# Create database tables
create_tables()

# Rate limiting
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="Healthcare Platform API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Socket.IO
sio = socketio.AsyncServer(cors_allowed_origins="*")
socket_app = socketio.ASGIApp(sio, app)

@app.get("/")
async def root():
    return {"message": "Healthcare Platform API", "docs": "/docs"}

# Routes
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(patients.router, prefix="/api/patients", tags=["patients"])
app.include_router(doctors.router, prefix="/api/doctors", tags=["doctors"])
app.include_router(consultations.router, prefix="/api/consultations", tags=["consultations"])
app.include_router(files.router, prefix="/api/files", tags=["files"])
app.include_router(knowledge.router, prefix="/api/knowledge", tags=["knowledge"])

# Socket.IO events
@sio.event
async def connect(sid, environ):
    print(f"Client {sid} connected")

@sio.event
async def join_consultation(sid, data):
    await sio.enter_room(sid, data['consultationId'])

@sio.event
async def video_signal(sid, data):
    await sio.emit('video-signal', data, room=data['consultationId'], skip_sid=sid)

@sio.event
async def chat_message(sid, data):
    await sio.emit('chat-message', data, room=data['consultationId'])

if __name__ == "__main__":
    uvicorn.run(socket_app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))