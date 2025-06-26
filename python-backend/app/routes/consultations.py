from fastapi import APIRouter, Depends
from pydantic import BaseModel
from datetime import datetime

from ..middleware.auth_middleware import get_current_user

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
    current_user: dict = Depends(get_current_user)
):
    consultation = {
        "id": int(datetime.now().timestamp()),
        "patientId": current_user["id"],
        "doctorId": consultation_data.doctorId,
        "date": consultation_data.date,
        "symptoms": consultation_data.symptoms,
        "status": "scheduled"
    }
    return consultation

@router.get("/{consultation_id}")
async def get_consultation(
    consultation_id: int,
    current_user: dict = Depends(get_current_user)
):
    consultation = {
        "id": consultation_id,
        "patientName": "John Doe",
        "doctorName": "Dr. Smith",
        "date": "2024-01-15",
        "symptoms": "Fever, cough",
        "status": "in-progress",
        "videoRoomId": f"room_{consultation_id}"
    }
    return consultation

@router.put("/{consultation_id}")
async def update_consultation(
    consultation_id: int,
    update_data: ConsultationUpdate,
    current_user: dict = Depends(get_current_user)
):
    return {
        "message": "Consultation updated",
        "diagnosis": update_data.diagnosis,
        "prescription": update_data.prescription
    }