from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from sqlalchemy.orm import Session

from app.middleware.auth_middleware import get_current_user
from app.database_enhanced import get_db, User, DoctorProfile, Patient, Consultation
from ..services.ai_recommendation import AIRecommendationService

router = APIRouter()

@router.get("/consultations")
async def get_doctor_consultations(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get consultations assigned to the current doctor"""
    consultations = db.query(Consultation, Patient, User).join(
        Patient, Consultation.patient_id == Patient.id
    ).join(
        User, Patient.user_id == User.id
    ).filter(
        Consultation.doctor_id == current_user["id"]
    ).order_by(Consultation.date.desc()).all()
    
    results = []
    for consultation, patient, user in consultations:
        results.append({
            "id": consultation.id,
            "patientName": user.name,
            "date": consultation.date.isoformat() if consultation.date else None,
            "symptoms": consultation.symptoms,
            "status": consultation.status,
            "diagnosis": consultation.diagnosis,
            "prescription": consultation.prescription
        })
    
    return results

@router.get("/profile")
async def get_doctor_profile(current_user: dict = Depends(get_current_user)):
    return {
        "name": "John Smith",
        "specialization": "General Medicine",
        "licenseNumber": "MD123456",
        "experience": 10
    }

@router.get("/appointments")
async def get_doctor_appointments(current_user: dict = Depends(get_current_user)):
    return [
        {
            "id": 1,
            "patientName": "Jane Doe",
            "time": "09:00 AM",
            "symptoms": "Fever and headache",
            "status": "scheduled"
        },
        {
            "id": 2,
            "patientName": "Bob Wilson",
            "time": "10:30 AM", 
            "symptoms": "Chest pain",
            "status": "completed"
        }
    ]

@router.get("/patients")
async def get_doctor_patients(current_user: dict = Depends(get_current_user)):
    return [
        {
            "id": 1,
            "name": "Jane Doe",
            "lastVisit": "2024-01-15",
            "status": "active"
        },
        {
            "id": 2,
            "name": "Bob Wilson",
            "lastVisit": "2024-01-10",
            "status": "inactive"
        }
    ]

@router.get("/stats")
async def get_doctor_stats(current_user: dict = Depends(get_current_user)):
    return {
        "totalPatients": 45,
        "todayAppointments": 8,
        "pendingConsultations": 3
    }

@router.get("/match")
async def match_specialist(
    specialization: Optional[str] = Query(None, description="Desired specialty, e.g., cardiology"),
    state: Optional[str] = Query(None, description="Two-letter state code for telemedicine"),
    limit: int = Query(5, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> List[dict]:
    """Match verified doctors by specialization and optional state.
    Returns basic doctor info suitable for selection.
    """
    q = db.query(DoctorProfile, User).join(User, DoctorProfile.user_id == User.id)
    # Only active/verified doctors
    q = q.filter(User.role == "doctor")
    q = q.filter(DoctorProfile.verification_status == "verified")

    if specialization:
        q = q.filter(DoctorProfile.primary_specialization.ilike(f"%{specialization}%"))
    if state:
        state_u = state.upper()
        q = q.filter(DoctorProfile.telemedicine_states.any(state_u))

    q = q.limit(limit)
    rows = q.all()
    results = []
    for profile, user in rows:
        results.append({
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "specialization": profile.primary_specialization,
            "yearsOfPractice": profile.years_of_practice,
            "telemedicineStates": profile.telemedicine_states,
        })
    return results

@router.get("/ai-recommend")
async def ai_recommend_doctors(
    symptoms: Optional[str] = Query(None, description="Patient symptoms"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> List[dict]:
    """AI-powered doctor recommendations based on patient profile and symptoms"""
    
    # Get patient data
    patient = db.query(Patient).filter(Patient.user_id == current_user["id"]).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    
    # Use AI service to recommend doctors
    recommendations = AIRecommendationService.recommend_doctors(
        db=db,
        patient_symptoms=symptoms or "",
        patient_medical_history=patient.medical_history or [],
        patient_id=patient.id,
        limit=5
    )
    
    return recommendations