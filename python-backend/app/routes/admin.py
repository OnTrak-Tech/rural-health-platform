from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session
from typing import List, Optional
import re
from fastapi import Request
from cryptography.fernet import Fernet
import os
import shutil
from datetime import datetime

from ..middleware.auth_middleware import get_current_user, audit_log
from ..middleware.admin_middleware import require_admin_permission
from ..database_enhanced import get_db, User, DoctorProfile, VerificationDocument, Admin, Patient
from app.limits import limiter
from passlib.context import CryptContext
import secrets
from datetime import timedelta

router = APIRouter()

@router.get("/me")
async def get_admin_me(current_admin: dict = Depends(require_admin_permission("user_management")), db: Session = Depends(get_db)):
    admin_row = db.query(Admin).join(User).filter(User.id == current_admin["id"]).first()
    return {
        "id": current_admin["id"],
        "email": current_admin.get("email"),
        "role": current_admin.get("role"),
        "permissions": admin_row.permissions if admin_row else []
    }
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Encryption for sensitive data

def get_cipher_suite():
    key = os.getenv("ENCRYPTION_KEY")
    if not key:
        raise RuntimeError("ENCRYPTION_KEY not set")
    if isinstance(key, str):
        key_bytes = key.encode()
    else:
        key_bytes = key
    return Fernet(key_bytes)

class SecureDoctorRegistrationRequest(BaseModel):
    # Personal Information
    email: str = Field(..., pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2, max_length=255)
    phone: str = Field(..., pattern=r"^\+?1?[0-9]{10,15}$")
    
    # Professional Identity
    medical_license: str = Field(..., min_length=8, max_length=50)
    dea_number: Optional[str] = Field(None, pattern=r"^[A-Z]{2}\d{7}$")
    npi_number: str = Field(..., pattern=r"^\d{10}$")
    state_license: str = Field(..., min_length=5, max_length=50)
    
    # Professional Details
    primary_specialization: str = Field(..., max_length=255)
    sub_specializations: Optional[List[str]] = []
    medical_school: str = Field(..., max_length=255)
    graduation_year: int = Field(..., ge=1950, le=datetime.now().year)
    years_of_practice: int = Field(..., ge=0, le=60)
    board_certifications: Optional[List[str]] = []
    
    # Practice Information
    hospital_affiliations: Optional[List[str]] = []
    practice_address: str = Field(..., max_length=500)
    telemedicine_states: List[str] = Field(..., min_length=1)
    
    @field_validator('email')
    @classmethod
    def validate_professional_email(cls, v):
        # Prefer professional domains
        professional_domains = ['.edu', '.org', '.gov', 'hospital', 'clinic', 'medical']
        if not any(domain in v.lower() for domain in professional_domains):
            # Allow but flag for additional verification
            pass
        return v.lower()
    
    @field_validator('telemedicine_states')
    @classmethod
    def validate_states(cls, v):
        valid_states = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 
                       'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
                       'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
                       'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
                       'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY']
        for state in v:
            if state.upper() not in valid_states:
                raise ValueError(f'Invalid state code: {state}')
        return [s.upper() for s in v]


def encrypt_sensitive_data(data: str) -> str:
    """Encrypt sensitive information"""
    return get_cipher_suite().encrypt(data.encode()).decode()

def decrypt_sensitive_data(encrypted_data: str) -> str:
    """Decrypt sensitive information"""
    return get_cipher_suite().decrypt(encrypted_data.encode()).decode()

@router.post("/register/patient")
@limiter.limit("10/minute")
async def admin_register_patient(
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
    name: str = Form(...),
    phone: str = Form(None),
    current_admin: dict = Depends(require_admin_permission("user_management")),
    db: Session = Depends(get_db)
):
    """Admin-only patient registration"""
    try:
        if db.query(User).filter(User.email == email).first():
            raise HTTPException(status_code=400, detail="Email already registered")
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        user = User(email=email, password_hash=pwd_context.hash(password), role="patient", name=name, phone=phone)
        db.add(user)
        db.commit()
        db.refresh(user)
        patient = Patient(user_id=user.id, age=0, medical_history=[], allergies=[])
        db.add(patient)
        db.commit()
        audit_log("PATIENT_REGISTERED_ADMIN", current_admin["id"], {"email": email, "patient_user_id": user.id})
        return {"message": "Patient registered", "user": {"id": user.id, "email": user.email, "name": user.name}}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@router.post("/invite/patient")
@limiter.limit("20/minute")
async def send_patient_invite(
    request: Request,
    email: str = Form(...),
    name: str = Form(...),
    phone: str = Form(None),
    expires_in_days: int = Form(7),
    current_admin: dict = Depends(require_admin_permission("user_management")),
    db: Session = Depends(get_db)
):
    """Create or reuse a patient record and send an invite token for password setup."""
    try:
        # Create or reuse user
        user = db.query(User).filter(User.email == email.lower()).first()
        if not user:
            user = User(email=email.lower(), password_hash=None, role="patient", name=name, phone=phone, is_active=False)
            db.add(user)
            db.commit()
            db.refresh(user)
            patient = Patient(user_id=user.id, age=0, medical_history=[], allergies=[])
            db.add(patient)
            db.commit()
        else:
            if user.role != "patient":
                raise HTTPException(status_code=400, detail="User exists with a different role")
        # Create invite
        from ..database_enhanced import Invite
        token = secrets.token_urlsafe(32)
        invite = Invite(
            token=token,
            user_id=user.id,
            role="patient",
            expires_at=datetime.utcnow() + timedelta(days=expires_in_days),
            used=False,
            created_by=current_admin["id"]
        )
        db.add(invite)
        db.commit()
        audit_log("PATIENT_INVITE_CREATED", current_admin["id"], {"email": email})
        # TODO: Integrate email provider to send the invite link
        return {
            "message": "Invite created",
            "inviteToken": token,  # Return for dev/testing; DO NOT expose in production responses
            "inviteLink": f"https://your-frontend-domain.com/accept-invite?token={token}"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create invite: {str(e)}")

@router.post("/register/doctor")
@limiter.limit("5/minute")
async def secure_doctor_registration(
    request: Request,
    # Form data
    email: str = Form(...),
    password: str = Form(...),
    full_name: str = Form(...),
    phone: str = Form(...),
    medical_license: str = Form(...),
    dea_number: Optional[str] = Form(None),
    npi_number: str = Form(...),
    state_license: str = Form(...),
    primary_specialization: str = Form(...),
    medical_school: str = Form(...),
    graduation_year: int = Form(...),
    years_of_practice: int = Form(...),
    practice_address: str = Form(...),
    telemedicine_states: str = Form(...),  # Comma-separated
    
    # Required documents
    license_document: UploadFile = File(...),
    certification_documents: List[UploadFile] = File(...),
    
    # Admin authorization
    current_admin: dict = Depends(require_admin_permission("system_admin")),
    db: Session = Depends(get_db)
):
    """Secure doctor registration with document verification"""
    
    try:
        # Validate request data
        states_list = [s.strip().upper() for s in telemedicine_states.split(',')]
        
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email.lower()).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Validate file types
        allowed_extensions = {'.pdf', '.jpg', '.jpeg', '.png'}
        if not any(license_document.filename.lower().endswith(ext) for ext in allowed_extensions):
            raise HTTPException(status_code=400, detail="Invalid license document format")
        
        # Create user account (inactive until verified)
        hashed_password = pwd_context.hash(password)
        user = User(
            email=email.lower(),
            password_hash=hashed_password,
            role="doctor",
            name=full_name,
            phone=phone,
            is_active=False,  # Inactive until verified
            email_verified=False,
            phone_verified=False
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Save documents securely
        doc_dir = f"secure_documents/doctor_{user.id}"
        os.makedirs(doc_dir, exist_ok=True)
        
        # Save license document
        license_filename = f"license_{int(datetime.now().timestamp())}_{license_document.filename}"
        license_path = os.path.join(doc_dir, license_filename)
        with open(license_path, "wb") as buffer:
            shutil.copyfileobj(license_document.file, buffer)
        
        # Save certification documents
        cert_paths = []
        for i, cert_doc in enumerate(certification_documents):
            cert_filename = f"cert_{i}_{int(datetime.now().timestamp())}_{cert_doc.filename}"
            cert_path = os.path.join(doc_dir, cert_filename)
            with open(cert_path, "wb") as buffer:
                shutil.copyfileobj(cert_doc.file, buffer)
            cert_paths.append(cert_path)
        
        # Create encrypted doctor profile
        doctor_profile = DoctorProfile(
            user_id=user.id,
            medical_license_encrypted=encrypt_sensitive_data(medical_license),
            dea_number_encrypted=encrypt_sensitive_data(dea_number) if dea_number else None,
            npi_number_encrypted=encrypt_sensitive_data(npi_number),
            state_license_encrypted=encrypt_sensitive_data(state_license),
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
        db.refresh(doctor_profile)
        
        # Create verification documents records
        verification_docs = [
            VerificationDocument(
                doctor_profile_id=doctor_profile.id,
                document_type="medical_license",
                file_path=license_path
            )
        ]
        
        for cert_path in cert_paths:
            verification_docs.append(
                VerificationDocument(
                    doctor_profile_id=doctor_profile.id,
                    document_type="certification",
                    file_path=cert_path
                )
            )
        
        db.add_all(verification_docs)
        db.commit()
        
        # Audit log
        audit_log(
            "DOCTOR_REGISTRATION_SUBMITTED", 
            current_admin["id"], 
            {
                "doctor_id": user.id,
                "email": email,
                "specialization": primary_specialization,
                "submitted_by_admin": current_admin["email"]
            }
        )
        
        return {
            "message": "Doctor registration submitted for verification",
            "doctor_id": user.id,
            "verification_status": "pending",
            "next_steps": [
                "Email verification required",
                "Phone verification required", 
                "Document verification in progress",
                "Admin approval pending"
            ]
        }
        
    except Exception as e:
        db.rollback()
        audit_log(
            "DOCTOR_REGISTRATION_FAILED",
            current_admin["id"],
            {"error": str(e), "email": email}
        )
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@router.get("/doctors/pending")
@limiter.limit("60/minute")
async def get_pending_doctors(
    request: Request,
    current_admin: dict = Depends(require_admin_permission("system_admin")),
    db: Session = Depends(get_db)
):
    """Get all doctors pending verification"""
    
    pending_doctors = db.query(DoctorProfile, User).join(
        User, DoctorProfile.user_id == User.id
    ).filter(DoctorProfile.verification_status == "pending").all()
    
    result = []
    for profile, user in pending_doctors:
        result.append({
            "id": profile.id,
            "name": user.name,
            "email": user.email,
            "specialization": profile.primary_specialization,
            "medical_school": profile.medical_school,
            "years_of_practice": profile.years_of_practice,
            "submitted_at": profile.created_at.isoformat(),
            "documents_count": len(profile.certification_documents) + 1
        })
    
    return result

@router.post("/doctors/{doctor_id}/approve")
@limiter.limit("30/minute")
async def approve_doctor(
    doctor_id: int,
    request: Request,
    current_admin: dict = Depends(require_admin_permission("system_admin")),
    db: Session = Depends(get_db)
):
    """Approve doctor registration"""
    
    doctor_profile = db.query(DoctorProfile).filter(DoctorProfile.id == doctor_id).first()
    if not doctor_profile:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    # Update verification status
    doctor_profile.verification_status = "verified"
    admin_row = db.query(Admin).join(User).filter(User.id == current_admin["id"]).first()
    doctor_profile.approved_by = admin_row.id if admin_row else None
    doctor_profile.approved_at = datetime.utcnow()
    
    # Activate user account
    user = db.query(User).filter(User.id == doctor_profile.user_id).first()
    user.is_active = True
    
    db.commit()
    
    audit_log(
        "DOCTOR_APPROVED",
        current_admin["id"],
        {"doctor_id": doctor_id, "approved_by": current_admin["email"]}
    )
    
    return {"message": "Doctor approved and activated", "status": "verified"}

@router.post("/doctors/{doctor_id}/reject")
@limiter.limit("30/minute")
async def reject_doctor(
    doctor_id: int,
    request: Request,
    reason: str = Form(...),
    current_admin: dict = Depends(require_admin_permission("system_admin")),
    db: Session = Depends(get_db)
):
    """Reject doctor registration"""
    
    doctor_profile = db.query(DoctorProfile).filter(DoctorProfile.id == doctor_id).first()
    if not doctor_profile:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    doctor_profile.verification_status = "rejected"
    doctor_profile.rejection_reason = reason
    
    db.commit()
    
    audit_log(
        "DOCTOR_REJECTED",
        current_admin["id"],
        {"doctor_id": doctor_id, "reason": reason}
    )
    
    return {"message": "Doctor registration rejected", "reason": reason}