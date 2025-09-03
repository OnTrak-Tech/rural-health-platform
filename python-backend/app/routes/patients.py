from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session

from ..middleware.auth_middleware import get_current_user
from ..database_enhanced import get_db, Patient, User, Consultation
from datetime import datetime

router = APIRouter()

class PatientUpdate(BaseModel):
    name: str = None
    age: int = None
    medicalHistory: List[str] = None
    allergies: List[str] = None

@router.get("/profile")
async def get_patient_profile(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get user and patient data
    user = db.query(User).filter(User.id == current_user["id"]).first()
    patient = db.query(Patient).filter(Patient.user_id == current_user["id"]).first()
    
    if not patient:
        # Create patient profile if doesn't exist
        patient = Patient(user_id=current_user["id"], age=0, medical_history=[], allergies=[])
        db.add(patient)
        db.commit()
        db.refresh(patient)
    
    return {
        "id": user.id,
        "patientId": patient.id,
        "hospitalId": patient.hospital_id,
        "name": user.name,
        "age": patient.age,
        "medicalHistory": patient.medical_history or [],
        "allergies": patient.allergies or []
    }

@router.put("/profile")
async def update_patient_profile(
    update_data: PatientUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Update user data
    user = db.query(User).filter(User.id == current_user["id"]).first()
    if update_data.name:
        user.name = update_data.name
    
    # Update patient data
    patient = db.query(Patient).filter(Patient.user_id == current_user["id"]).first()
    if not patient:
        patient = Patient(user_id=current_user["id"])
        db.add(patient)
    
    if update_data.age is not None:
        patient.age = update_data.age
    if update_data.medicalHistory is not None:
        patient.medical_history = update_data.medicalHistory
    if update_data.allergies is not None:
        patient.allergies = update_data.allergies
    
    db.commit()
    return {"message": "Profile updated"}

@router.get("/consultations")
async def get_patient_consultations(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.user_id == current_user["id"]).first()
    if not patient:
        return []
    
    consultations = db.query(Consultation).filter(Consultation.patient_id == patient.id).all()
    
    result = []
    for consultation in consultations:
        doctor = db.query(User).filter(User.id == consultation.doctor_id).first()
        result.append({
            "id": consultation.id,
            "doctorName": doctor.name if doctor else "Unknown",
            "date": consultation.date.isoformat() if consultation.date else None,
            "status": consultation.status,
            "diagnosis": consultation.diagnosis
        })
    
    return result

@router.post("/consent/accept")
async def accept_consent(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.user_id == current_user["id"]).first()
    if not patient:
        patient = Patient(user_id=current_user["id"], age=0, medical_history=[], allergies=[])
        db.add(patient)
    patient.consent_signed_at = datetime.utcnow()
    db.commit()
    return {"message": "Consent accepted", "timestamp": patient.consent_signed_at.isoformat()}
