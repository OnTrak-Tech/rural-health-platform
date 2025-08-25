from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from typing import List
import os
import shutil
from datetime import datetime
from sqlalchemy.orm import Session

from ..middleware.auth_middleware import get_current_user, audit_log
from ..database import get_db, MedicalFile, User

router = APIRouter()

UPLOAD_DIR = "uploads"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf", ".dcm"}

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    patientId: int = Form(...),
    type: str = Form("general"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    # Save file
    timestamp = int(datetime.now().timestamp())
    filename = f"{timestamp}-{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Save to database
    medical_file = MedicalFile(
        patient_id=patientId,
        filename=filename,
        original_name=file.filename,
        file_type=file_ext,
        file_size=file.size,
        uploaded_by=current_user["id"]
    )
    db.add(medical_file)
    db.commit()
    db.refresh(medical_file)
    
    audit_log("FILE_UPLOAD", current_user["id"], {"filename": file.filename, "patientId": patientId})
    
    return {
        "id": medical_file.id,
        "filename": medical_file.filename,
        "originalName": medical_file.original_name,
        "size": medical_file.file_size,
        "uploadedBy": current_user["id"],
        "patientId": patientId,
        "type": type
    }

@router.get("/patient/{patient_id}")
async def get_patient_files(
    patient_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    audit_log("FILE_ACCESS", current_user["id"], {"patientId": patient_id})
    
    # Query actual files from database
    files = db.query(MedicalFile).filter(MedicalFile.patient_id == patient_id).all()
    
    result = []
    for file in files:
        uploader = db.query(User).filter(User.id == file.uploaded_by).first()
        result.append({
            "id": file.id,
            "filename": file.original_name,
            "type": file.file_type,
            "uploadDate": file.created_at.isoformat(),
            "uploadedBy": uploader.name if uploader else "Unknown"
        })
    
    return result