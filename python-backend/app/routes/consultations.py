from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy.orm import Session

from ..middleware.auth_middleware import get_current_user
from ..database_enhanced import get_db, Consultation, Patient, User

router = APIRouter()

class ConsultationCreate(BaseModel):
    doctorId: int
    date: str
    symptoms: str

class ConsultationUpdate(BaseModel):
    diagnosis: str = None
    prescription: str = None
    notes: str = None

@router.post("/")
async def book_consultation(
    consultation_data: ConsultationCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    print(f"Booking consultation: patient_user_id={current_user['id']}, doctor_id={consultation_data.doctorId}")
    
    # Get or create patient record
    patient = db.query(Patient).filter(Patient.user_id == current_user["id"]).first()
    if not patient:
        patient = Patient(user_id=current_user["id"], age=0, medical_history=[], allergies=[])
        db.add(patient)
        db.commit()
        db.refresh(patient)
    
    print(f"Patient record: id={patient.id}, user_id={patient.user_id}")
    
    # Parse date
    try:
        consultation_date = datetime.fromisoformat(consultation_data.date.replace("Z", "+00:00"))
    except:
        consultation_date = datetime.now()
    
    # Create consultation
    consultation = Consultation(
        patient_id=patient.id,
        doctor_id=consultation_data.doctorId,
        date=consultation_date,
        symptoms=consultation_data.symptoms,
        status="scheduled"
    )
    
    db.add(consultation)
    db.commit()
    db.refresh(consultation)
    
    print(f"Consultation created: id={consultation.id}, patient_id={consultation.patient_id}, doctor_id={consultation.doctor_id}")
    
    return {
        "id": consultation.id,
        "patientId": patient.id,
        "doctorId": consultation_data.doctorId,
        "date": consultation_data.date,
        "symptoms": consultation_data.symptoms,
        "status": "scheduled"
    }

@router.get("/{consultation_id}")
async def get_consultation(
    consultation_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    consultation = db.query(Consultation, Patient, User).join(
        Patient, Consultation.patient_id == Patient.id
    ).join(
        User, Patient.user_id == User.id
    ).filter(Consultation.id == consultation_id).first()
    
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    
    consult, patient, user = consultation
    
    # Get doctor info
    doctor = db.query(User).filter(User.id == consult.doctor_id).first()
    
    return {
        "id": consult.id,
        "patientName": user.name,
        "doctorName": doctor.name if doctor else "Dr. Unknown",
        "date": consult.date.isoformat() if consult.date else None,
        "symptoms": consult.symptoms,
        "status": consult.status,
        "videoRoomId": f"room_{consult.id}"
    }

@router.put("/{consultation_id}")
async def update_consultation(
    consultation_id: int,
    update_data: ConsultationUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    consultation = db.query(Consultation).filter(Consultation.id == consultation_id).first()
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    
    if update_data.diagnosis:
        consultation.diagnosis = update_data.diagnosis
    if update_data.prescription:
        consultation.prescription = update_data.prescription
    
    db.commit()
    
    return {
        "message": "Consultation updated",
        "diagnosis": consultation.diagnosis,
        "prescription": consultation.prescription
    }