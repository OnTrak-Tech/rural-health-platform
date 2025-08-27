from fastapi import APIRouter, HTTPException, Request, Depends, Form
from pydantic import BaseModel, Field
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import os
import pyotp
from typing import Optional

from ..middleware.auth_middleware import verify_mfa, generate_mfa_secret, audit_log, get_current_user
from app.limits import limiter
from ..database_enhanced import get_db, User, Patient, Admin

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

@router.post("/setup/super-admin")
@limiter.limit("1/minute")
async def create_super_admin(
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
    name: str = Form(...),
    setup_key: str = Form(...),
    db: Session = Depends(get_db)
):
    """One-time super admin creation with setup key"""
    
    # Verify setup key
    if setup_key != os.getenv("SUPER_ADMIN_SETUP_KEY"):
        audit_log("SUPER_ADMIN_SETUP_FAILED", None, {"email": email, "reason": "invalid_key"})
        raise HTTPException(status_code=403, detail="Invalid setup key")
    
    # Check if any admin already exists
    existing_admin = db.query(User).filter(User.role == "admin").first()
    if existing_admin:
        raise HTTPException(status_code=400, detail="Super admin already exists")
    
    # Check if user email exists
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    try:
        # Create super admin user
        hashed_password = pwd_context.hash(password)
        user = User(
            email=email,
            password_hash=hashed_password,
            role="admin",
            name=name,
            is_active=True,
            email_verified=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create admin profile with full permissions
        admin = Admin(
            user_id=user.id,
            permissions=[
                "doctor_registration",
                "user_management", 
                "system_admin",
                "audit_access"
            ]
        )
        db.add(admin)
        db.commit()
        
        audit_log("SUPER_ADMIN_CREATED", user.id, {"email": email})
        
        return {
            "message": "Super admin created successfully",
            "admin_id": user.id,
            "email": email,
            "next_steps": [
                "Login with admin credentials",
                "Access /admin/register/doctor to register doctors"
            ]
        }
        
    except Exception as e:
        db.rollback()
        audit_log("SUPER_ADMIN_CREATION_FAILED", None, {"email": email, "error": str(e)})
        raise HTTPException(status_code=500, detail=f"Failed to create super admin: {str(e)}")

@router.post("/login")
@limiter.limit("5/minute")
async def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    # Log only non-sensitive data
    audit_log("LOGIN_ATTEMPT", None, {"email": payload.email, "role": payload.role})
    
    # Find user in database
    user = db.query(User).filter(User.email == payload.email).first()
    
    # User must exist - no auto-creation in production
    if not user:
        audit_log("LOGIN_FAILED", None, {"email": payload.email, "reason": "user_not_found"})
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    if not pwd_context.verify(payload.password, user.password_hash):
        audit_log("LOGIN_FAILED", None, {"email": payload.email})
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Enforce MFA if enabled
    if user.mfa_secret:
        if not payload.mfaToken or not verify_mfa(payload.mfaToken, user.mfa_secret):
            audit_log("LOGIN_MFA_REQUIRED", user.id, {"email": payload.email})
            raise HTTPException(status_code=401, detail="MFA required or invalid code")
    
    token_data = {"id": user.id, "email": user.email, "role": user.role}
    jwt_secret = os.getenv("JWT_SECRET")
    if not jwt_secret:
        raise HTTPException(status_code=500, detail="JWT secret not configured")
    token = jwt.encode(token_data, jwt_secret, algorithm="HS256")
    
    audit_log("LOGIN_SUCCESS", user.id, {"email": payload.email})
    
    return {
        "token": token,
        "user": {"id": user.id, "email": user.email, "role": user.role, "name": user.name},
        "requiresMFA": False
    }

@router.post("/setup-mfa")
async def setup_mfa(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    secret = generate_mfa_secret()
    # Persist secret to current user
    user = db.query(User).filter(User.id == current_user["id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.mfa_secret = secret
    db.commit()
    qr_url = pyotp.totp.TOTP(secret).provisioning_uri(
        name=user.email,
        issuer_name="Healthcare Platform"
    )
    audit_log("MFA_SETUP", user.id, {"email": user.email})
    return {"secret": secret, "qrCode": qr_url}

@router.post("/accept-invite")
@limiter.limit("10/minute")
async def accept_invite(request: Request, token: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    """Accept a patient invite token and set password"""
    from ..database_enhanced import Invite
    invite = db.query(Invite).filter(Invite.token == token).first()
    if not invite or invite.used:
        raise HTTPException(status_code=400, detail="Invalid or used invite token")
    if invite.expires_at and invite.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invite token expired")
    user = db.query(User).filter(User.id == invite.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    hashed_password = pwd_context.hash(password)
    user.password_hash = hashed_password
    user.is_active = True
    user.email_verified = True
    db.commit()
    invite.used = True
    db.commit()
    audit_log("INVITE_ACCEPTED", user.id, {"invite_id": invite.id})
    return {"message": "Password set. You can now log in."}

@router.post("/register/patient")
async def register_patient(request: RegisterRequest):
    # Patient self-registration disabled: must be performed by an admin
    raise HTTPException(status_code=403, detail="Patient registration must be performed by an admin via /api/admin/register/patient")

@router.post("/register/doctor")
async def register_doctor(request: RegisterRequest):
    # Doctor registration must be performed via admin workflow
    raise HTTPException(status_code=403, detail="Doctor registration must be performed by an admin via /api/admin/register/doctor")
