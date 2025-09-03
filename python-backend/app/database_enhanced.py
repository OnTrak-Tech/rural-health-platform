from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from sqlalchemy.dialects.postgresql import ARRAY
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Enhanced Database Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True)
    password_hash = Column(String(255))
    role = Column(String(50))  # patient, doctor, admin
    name = Column(String(255))
    phone = Column(String(20))
    mfa_secret = Column(String(255))
    is_active = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=False)
    phone_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Admin(Base):
    __tablename__ = "admins"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    permissions = Column(ARRAY(String))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User")

class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Professional Identity (Encrypted)
    medical_license_encrypted = Column(Text)
    dea_number_encrypted = Column(Text)
    npi_number_encrypted = Column(Text)
    state_license_encrypted = Column(Text)
    
    # Professional Details
    primary_specialization = Column(String(255))
    sub_specializations = Column(ARRAY(String))
    medical_school = Column(String(255))
    graduation_year = Column(Integer)
    years_of_practice = Column(Integer)
    board_certifications = Column(ARRAY(String))
    
    # Practice Information
    hospital_affiliations = Column(ARRAY(String))
    practice_address = Column(Text)
    telemedicine_states = Column(ARRAY(String))
    
    # Verification Status
    verification_status = Column(String(50), default="pending")  # pending, verified, rejected
    approved_by = Column(Integer, ForeignKey("admins.id"))
    approved_at = Column(DateTime)
    rejection_reason = Column(Text)
    
    # Document Storage
    license_document_path = Column(String(500))
    certification_documents = Column(ARRAY(String))
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User")
    approved_by_admin = relationship("Admin", foreign_keys=[approved_by])

class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    age = Column(Integer)
    medical_history = Column(ARRAY(String))
    allergies = Column(ARRAY(String))
    consent_signed_at = Column(DateTime)
    
    user = relationship("User")
    consultations = relationship("Consultation", back_populates="patient")

class Consultation(Base):
    __tablename__ = "consultations"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    doctor_id = Column(Integer, ForeignKey("users.id"))
    date = Column(DateTime)
    symptoms = Column(Text)
    diagnosis = Column(Text)
    prescription = Column(Text)
    notes = Column(Text)
    status = Column(String(50), default="scheduled")
    client_id = Column(String(64), unique=True, nullable=True)  # idempotency for offline sync
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    patient = relationship("Patient", back_populates="consultations")
    doctor = relationship("User")

class MedicalFile(Base):
    __tablename__ = "medical_files"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    filename = Column(String(255))
    original_name = Column(String(255))
    file_type = Column(String(10))
    file_size = Column(Integer)
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    ocr_text = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class VerificationDocument(Base):
    __tablename__ = "verification_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    doctor_profile_id = Column(Integer, ForeignKey("doctor_profiles.id"))
    document_type = Column(String(100))  # license, certification, dea, etc.
    file_path = Column(String(500))
    verification_status = Column(String(50), default="pending")
    verified_by = Column(Integer, ForeignKey("admins.id"))
    verified_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    doctor_profile = relationship("DoctorProfile")
    verified_by_admin = relationship("Admin", foreign_keys=[verified_by])

class Invite(Base):
    __tablename__ = "invites"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(64), unique=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    role = Column(String(50))
    expires_at = Column(DateTime)
    used = Column(Boolean, default=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String(100))
    resource = Column(String(100))
    details = Column(Text)
    ip_address = Column(String(45))
    user_agent = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User")

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create tables
def create_tables():
    Base.metadata.create_all(bind=engine)