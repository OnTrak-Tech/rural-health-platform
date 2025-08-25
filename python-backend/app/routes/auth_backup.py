from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel, Field
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import os
import pyotp
from typing import Optional

from ..middleware.auth_middleware import verify_mfa, generate_mfa_secret, audit_log
from ..database import get_db, User, Patient

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class LoginRequest(BaseModel):
    email: str
    password: str
    role: str
    mfaToken: Optional[str] = None

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    phone: Optional[str] = None
    specialization: Optional[str] = None
    license: Optional[str] = None

@router.post("/login")
async def login(request: LoginRequest, req: Request, db: Session = Depends(get_db)):
    # Log only non-sensitive data
    audit_log("LOGIN_ATTEMPT", None, {"email": request.email, "role": request.role})
    
    # Find user in database
    user = db.query(User).filter(User.email == request.email).first()
    
    # User must exist - no auto-creation in production
    if not user:
        audit_log("LOGIN_FAILED", None, {"email": request.email, "reason": "user_not_found"})
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    if not pwd_context.verify(request.password, user.password_hash):
        audit_log("LOGIN_FAILED", None, {"email": request.email})
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token_data = {"id": user.id, "email": user.email, "role": user.role}
    token = jwt.encode(token_data, os.getenv("JWT_SECRET", "fallback-secret"), algorithm="HS256")
    
    audit_log("LOGIN_SUCCESS", user.id, {"email": request.email})
    
    return {
        "token": token,
        "user": {"id": user.id, "email": user.email, "role": user.role, "name": user.name},
        "requiresMFA": False
    }

@router.post("/setup-mfa")
async def setup_mfa():
    secret = generate_mfa_secret()
    qr_url = pyotp.totp.TOTP(secret).provisioning_uri(
        name="user@healthcare.com",
        issuer_name="Healthcare Platform"
    )
    return {"secret": secret, "qrCode": qr_url}

@router.post("/register/patient")
async def register_patient(request: RegisterRequest, db: Session = Depends(get_db)):
    # Check if user exists
    if db.query(User).filter(User.email == request.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_password = pwd_context.hash(request.password)
    user = User(
        email=request.email,
        password_hash=hashed_password,
        role="patient",
        name=request.name,
        phone=request.phone
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create patient profile
    patient = Patient(user_id=user.id, age=0, medical_history=[], allergies=[])
    db.add(patient)
    db.commit()
    
    audit_log("PATIENT_REGISTERED", user.id, {"email": request.email})
    return {"message": "Patient registered", "user": {"id": user.id, "email": user.email, "name": user.name}}

@router.post("/register/doctor")
async def register_doctor(request: RegisterRequest, db: Session = Depends(get_db)):
    # Check if user exists
    if db.query(User).filter(User.email == request.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create doctor
    hashed_password = pwd_context.hash(request.password)
    user = User(
        email=request.email,
        password_hash=hashed_password,
        role="doctor",
        name=request.name,
        specialization=request.specialization,
        license=request.license
    )
    db.add(user)
    db.commit()
    
    audit_log("DOCTOR_REGISTERED", user.id, {"email": request.email})
    return {"message": "Doctor registered", "user": {"id": user.id, "email": user.email, "name": user.name}}