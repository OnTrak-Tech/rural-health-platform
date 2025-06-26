from fastapi import APIRouter, Depends, HTTPException
from app.middleware.auth_middleware import get_current_user

router = APIRouter()

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