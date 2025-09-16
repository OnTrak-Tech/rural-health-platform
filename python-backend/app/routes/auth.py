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
from ..database_enhanced import User, Patient, DoctorProfile, VerificationDocument
from passlib.context import CryptContext
from cryptography.fernet import Fernet
import os
import shutil
from datetime import datetime
from fastapi import UploadFile, File, Form
from typing import List

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def encrypt_sensitive_data(data: str) -> str:
    key = os.getenv("ENCRYPTION_KEY")
    if not key:
        raise RuntimeError("ENCRYPTION_KEY not set")
    cipher_suite = Fernet(key.encode())
    return cipher_suite.encrypt(data.encode()).decode()
from app.limits import limiter
from ..database_enhanced import get_db, User, Patient, Admin

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class LoginRequest(BaseModel):
    email: str
    password: str
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
                "system_admin",
                "user_management",
                "doctor_registration",
                "audit_access"
            ]
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
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
    audit_log("LOGIN_ATTEMPT", None, {"email": payload.email})
    
    # Find user in database
    user = db.query(User).filter(User.email == payload.email).first()
    
    # User must exist - no auto-creation in production
    if not user:
        audit_log("LOGIN_FAILED", None, {"email": payload.email, "reason": "user_not_found"})
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    if not pwd_context.verify(payload.password, user.password_hash):
        audit_log("LOGIN_FAILED", None, {"email": payload.email, "reason": "invalid_password"})
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check if account is active
    if not user.is_active:
        audit_log("LOGIN_FAILED", user.id, {"email": payload.email, "reason": "account_inactive"})
        raise HTTPException(status_code=401, detail="Account is inactive")
    
    # Enforce MFA if enabled
    if user.mfa_secret:
        if not payload.mfaToken or not verify_mfa(payload.mfaToken, user.mfa_secret):
            audit_log("LOGIN_MFA_REQUIRED", user.id, {"email": payload.email})
            raise HTTPException(status_code=401, detail="MFA required or invalid code")
    
    # Create JWT token with user's actual role from database
    token_data = {"id": user.id, "email": user.email, "role": user.role}
    jwt_secret = os.getenv("JWT_SECRET")
    if not jwt_secret:
        raise HTTPException(status_code=500, detail="JWT secret not configured")
    token = jwt.encode(token_data, jwt_secret, algorithm="HS256")
    
    audit_log("LOGIN_SUCCESS", user.id, {"email": payload.email, "role": user.role})
    
    # Get verification status for doctors
    verification_status = None
    if user.role == "doctor":
        doctor_profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == user.id).first()
        verification_status = doctor_profile.verification_status if doctor_profile else "pending"
    
    user_data = {"id": user.id, "email": user.email, "role": user.role, "name": user.name}
    if verification_status:
        user_data["verification_status"] = verification_status
    
    return {
        "token": token,
        "user": user_data,
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
@limiter.limit("3/minute")
async def register_doctor(
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
    full_name: str = Form(...),
    phone: str = Form(...),
    medical_license: str = Form(...),
    npi_number: str = Form(...),
    primary_specialization: str = Form(...),
    medical_school: str = Form(...),
    graduation_year: int = Form(...),
    years_of_practice: int = Form(...),
    practice_address: str = Form(...),
    telemedicine_states: str = Form(...),
    license_document: UploadFile = File(...),
    certification_documents: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    """Public doctor self-registration (creates pending account)"""
    
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email.lower()).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Validate file types
        allowed_extensions = {'.pdf', '.jpg', '.jpeg', '.png'}
        if not any(license_document.filename.lower().endswith(ext) for ext in allowed_extensions):
            raise HTTPException(status_code=400, detail="Invalid license document format")
        
        # Create user account (inactive, pending verification)
        hashed_password = pwd_context.hash(password)
        user = User(
            email=email.lower(),
            password_hash=hashed_password,
            role="doctor",
            name=full_name,
            phone=phone,
            is_active=True,  # Allow login but restrict access
            email_verified=False,
            phone_verified=False
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Save documents
        doc_dir = f"secure_documents/doctor_{user.id}"
        os.makedirs(doc_dir, exist_ok=True)
        
        license_filename = f"license_{int(datetime.now().timestamp())}_{license_document.filename}"
        license_path = os.path.join(doc_dir, license_filename)
        with open(license_path, "wb") as buffer:
            shutil.copyfileobj(license_document.file, buffer)
        
        cert_paths = []
        for i, cert_doc in enumerate(certification_documents):
            cert_filename = f"cert_{i}_{int(datetime.now().timestamp())}_{cert_doc.filename}"
            cert_path = os.path.join(doc_dir, cert_filename)
            with open(cert_path, "wb") as buffer:
                shutil.copyfileobj(cert_doc.file, buffer)
            cert_paths.append(cert_path)
        
        # Create doctor profile (pending status)
        states_list = [s.strip().upper() for s in telemedicine_states.split(',')]
        doctor_profile = DoctorProfile(
            user_id=user.id,
            medical_license_encrypted=encrypt_sensitive_data(medical_license),
            npi_number_encrypted=encrypt_sensitive_data(npi_number),
            primary_specialization=primary_specialization,
            medical_school=medical_school,
            graduation_year=graduation_year,
            years_of_practice=years_of_practice,
            practice_address=practice_address,
            telemedicine_states=states_list,
            license_document_path=license_path,
            certification_documents=cert_paths,
            verification_status="pending"
        )
        db.add(doctor_profile)
        db.commit()
        
        audit_log("DOCTOR_SELF_REGISTRATION", user.id, {"email": email, "specialization": primary_specialization})
        
        return {
            "message": "Registration successful! Your account is pending verification.",
            "doctor_id": user.id,
            "verification_status": "pending",
            "next_steps": [
                "You can now login to your account",
                "Your application is under review",
                "You'll receive an email once approved",
                "Estimated review time: 2-3 business days"
            ]
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")