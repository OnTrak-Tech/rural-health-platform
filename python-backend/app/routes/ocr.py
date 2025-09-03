from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..middleware.auth_middleware import get_current_user, audit_log
from ..database_enhanced import get_db, MedicalFile, Patient

router = APIRouter()

@router.get("/files/{file_id}/text")
async def get_file_ocr_text(
    file_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get OCR extracted text from a medical file"""
    
    # Get the file
    medical_file = db.query(MedicalFile).filter(MedicalFile.id == file_id).first()
    if not medical_file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Authorization: patients can only access their own files
    if current_user.get("role") == "patient":
        patient = db.query(Patient).filter(Patient.user_id == current_user["id"]).first()
        if not patient or patient.id != medical_file.patient_id:
            raise HTTPException(status_code=403, detail="Not authorized to access this file")
    
    audit_log("OCR_TEXT_ACCESS", current_user["id"], {"file_id": file_id})
    
    return {
        "fileId": medical_file.id,
        "originalName": medical_file.original_name,
        "ocrText": medical_file.ocr_text,
        "hasText": bool(medical_file.ocr_text)
    }

@router.get("/patient/{patient_id}/searchable-files")
async def get_searchable_files(
    patient_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all files with OCR text for a patient"""
    
    # Authorization: patients can only access their own files
    if current_user.get("role") == "patient":
        patient = db.query(Patient).filter(Patient.user_id == current_user["id"]).first()
        if not patient or patient.id != patient_id:
            raise HTTPException(status_code=403, detail="Not authorized to access these files")
    
    files = db.query(MedicalFile).filter(
        MedicalFile.patient_id == patient_id,
        MedicalFile.ocr_text.isnot(None)
    ).all()
    
    result = []
    for file in files:
        result.append({
            "id": file.id,
            "originalName": file.original_name,
            "fileType": file.file_type,
            "uploadDate": file.created_at.isoformat(),
            "textPreview": file.ocr_text[:200] + "..." if len(file.ocr_text or "") > 200 else file.ocr_text
        })
    
    return result