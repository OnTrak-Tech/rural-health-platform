from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from typing import List, Optional
import os
from datetime import datetime

from ..database_enhanced import get_db, MedicalFile, MedicalFileAccess, Consultation, Patient, User
from ..middleware.auth_middleware import get_current_user, audit_log

router = APIRouter()

@router.get("/consultations/{consultation_id}/medical-files")
async def get_consultation_medical_files(
    consultation_id: int,
    request: Request,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get medical files for a specific consultation - HIPAA compliant access"""
    
    if current_user["role"] != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can access medical files")
    
    # Verify doctor is assigned to this consultation
    consultation = db.query(Consultation).filter(
        Consultation.id == consultation_id,
        Consultation.doctor_id == current_user["id"]
    ).first()
    
    if not consultation:
        audit_log("UNAUTHORIZED_MEDICAL_FILE_ACCESS", current_user["id"], {
            "consultation_id": consultation_id,
            "reason": "not_assigned_doctor"
        })
        raise HTTPException(status_code=403, detail="Access denied: Not assigned to this consultation")
    
    # Get medical files for the patient
    medical_files = db.query(MedicalFile).filter(
        MedicalFile.patient_id == consultation.patient_id
    ).order_by(MedicalFile.created_at.desc()).all()
    
    # Log access for HIPAA compliance
    audit_log("MEDICAL_FILES_VIEWED", current_user["id"], {
        "consultation_id": consultation_id,
        "patient_id": consultation.patient_id,
        "files_count": len(medical_files)
    })
    
    return {
        "consultation_id": consultation_id,
        "patient_name": consultation.patient.user.name,
        "files": [
            {
                "id": file.id,
                "original_name": file.original_name,
                "file_type": file.file_type,
                "file_size": file.file_size,
                "category": file.category,
                "description": file.description,
                "uploaded_at": file.created_at.isoformat(),
                "uploaded_by": file.uploader.name
            }
            for file in medical_files
        ]
    }

@router.get("/patients/{patient_id}/medical-history")
async def get_patient_medical_history(
    patient_id: int,
    request: Request,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get medical history for a patient - only for doctors who have consulted with them"""
    
    if current_user["role"] != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can access medical history")
    
    # Verify doctor has consulted with this patient
    consultation_exists = db.query(Consultation).filter(
        Consultation.patient_id == patient_id,
        Consultation.doctor_id == current_user["id"]
    ).first()
    
    if not consultation_exists:
        audit_log("UNAUTHORIZED_MEDICAL_HISTORY_ACCESS", current_user["id"], {
            "patient_id": patient_id,
            "reason": "no_consultation_history"
        })
        raise HTTPException(status_code=403, detail="Access denied: No consultation history with this patient")
    
    # Get patient info
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Get all consultations with this patient
    consultations = db.query(Consultation).filter(
        Consultation.patient_id == patient_id,
        Consultation.doctor_id == current_user["id"]
    ).order_by(Consultation.date.desc()).all()
    
    # Get medical files
    medical_files = db.query(MedicalFile).filter(
        MedicalFile.patient_id == patient_id
    ).order_by(MedicalFile.created_at.desc()).all()
    
    # Log access
    audit_log("PATIENT_MEDICAL_HISTORY_VIEWED", current_user["id"], {
        "patient_id": patient_id,
        "consultations_count": len(consultations),
        "files_count": len(medical_files)
    })
    
    return {
        "patient": {
            "id": patient.id,
            "name": patient.user.name,
            "age": patient.age,
            "medical_history": patient.medical_history,
            "allergies": patient.allergies
        },
        "consultations": [
            {
                "id": consultation.id,
                "date": consultation.date.isoformat(),
                "symptoms": consultation.symptoms,
                "diagnosis": consultation.diagnosis,
                "status": consultation.status
            }
            for consultation in consultations
        ],
        "medical_files": [
            {
                "id": file.id,
                "original_name": file.original_name,
                "file_type": file.file_type,
                "category": file.category,
                "description": file.description,
                "uploaded_at": file.created_at.isoformat(),
                "consultation_id": file.consultation_id
            }
            for file in medical_files
        ]
    }

@router.post("/medical-files/{file_id}/access")
async def access_medical_file(
    file_id: int,
    access_type: str,  # "view" or "download"
    request: Request,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Log and authorize access to a specific medical file"""
    
    if current_user["role"] != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can access medical files")
    
    if access_type not in ["view", "download"]:
        raise HTTPException(status_code=400, detail="Invalid access type")
    
    # Get medical file
    medical_file = db.query(MedicalFile).filter(MedicalFile.id == file_id).first()
    if not medical_file:
        raise HTTPException(status_code=404, detail="Medical file not found")
    
    # Verify doctor has consulted with this patient
    consultation_exists = db.query(Consultation).filter(
        Consultation.patient_id == medical_file.patient_id,
        Consultation.doctor_id == current_user["id"]
    ).first()
    
    if not consultation_exists:
        audit_log("UNAUTHORIZED_FILE_ACCESS", current_user["id"], {
            "file_id": file_id,
            "patient_id": medical_file.patient_id,
            "reason": "no_consultation_history"
        })
        raise HTTPException(status_code=403, detail="Access denied: No consultation history with this patient")
    
    # Log the access for HIPAA compliance
    file_access = MedicalFileAccess(
        medical_file_id=file_id,
        doctor_id=current_user["id"],
        consultation_id=consultation_exists.id,
        access_type=access_type,
        ip_address=request.client.host
    )
    db.add(file_access)
    db.commit()
    
    audit_log(f"MEDICAL_FILE_{access_type.upper()}", current_user["id"], {
        "file_id": file_id,
        "file_name": medical_file.original_name,
        "patient_id": medical_file.patient_id,
        "consultation_id": consultation_exists.id
    })
    
    # Return file info for frontend to handle
    return {
        "file_id": file_id,
        "filename": medical_file.filename,
        "original_name": medical_file.original_name,
        "file_type": medical_file.file_type,
        "access_granted": True,
        "access_logged": True
    }

@router.get("/my-patients")
async def get_my_patients(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of patients this doctor has consulted with"""
    
    if current_user["role"] != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can access patient list")
    
    # Get unique patients from consultations
    patients = db.query(Patient, User).join(User).join(Consultation).filter(
        Consultation.doctor_id == current_user["id"]
    ).distinct().all()
    
    return {
        "patients": [
            {
                "id": patient.Patient.id,
                "name": patient.User.name,
                "last_consultation": db.query(Consultation).filter(
                    Consultation.patient_id == patient.Patient.id,
                    Consultation.doctor_id == current_user["id"]
                ).order_by(Consultation.date.desc()).first().date.isoformat()
            }
            for patient in patients
        ]
    }