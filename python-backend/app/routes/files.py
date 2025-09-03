from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from typing import List
import os
import shutil
from datetime import datetime
from sqlalchemy.orm import Session
import pathlib
import secrets
try:
    import magic  # python-magic for MIME type validation
except Exception:
    magic = None

from ..middleware.auth_middleware import get_current_user, audit_log
from ..database_enhanced import get_db, MedicalFile, User, Patient
from ..services.ocr_service import OCRService

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf", ".dcm"}

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    patientId: int = Form(...),
    type: str = Form("general"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Authorization: patients can only upload to their own profile
    if current_user.get("role") == "patient":
        patient = db.query(Patient).filter(Patient.user_id == current_user["id"]).first()
        if not patient or patient.id != patientId:
            raise HTTPException(status_code=403, detail="Not authorized to upload files for this patient")

    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    original_name = pathlib.Path(file.filename).name
    file_ext = os.path.splitext(original_name)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    # Save file
    timestamp = int(datetime.now().timestamp())
    unique_token = secrets.token_hex(8)
    filename = f"{timestamp}-{unique_token}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Compute file size and validate MIME if possible
    try:
        file_size = os.path.getsize(file_path)
    except Exception:
        file_size = None

    if magic is not None:
        try:
            detected_mime = magic.from_file(file_path, mime=True)
            # Basic allowlist by MIME prefix for images/pdf and DICOM
            allowed_mimes = {"image/jpeg", "image/png", "application/pdf", "application/dicom", "application/dicom+json"}
            if detected_mime not in allowed_mimes:
                os.remove(file_path)
                raise HTTPException(status_code=400, detail="Unsupported file content type")
        except Exception:
            # If MIME detection fails, proceed but prefer conservative handling
            pass
    
    # Extract text using OCR
    ocr_text = None
    if file_ext in [".jpg", ".jpeg", ".png", ".pdf"]:
        ocr_text = OCRService.extract_text_from_file(file_path)
    
    # Save to database
    medical_file = MedicalFile(
        patient_id=patientId,
        filename=filename,
        original_name=original_name,
        file_type=file_ext,
        file_size=file_size if file_size is not None else 0,
        uploaded_by=current_user["id"],
        ocr_text=ocr_text
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
        "type": type,
        "ocrText": ocr_text,
        "hasOcr": bool(ocr_text)
    }

@router.get("/patient/{patient_id}")
async def get_patient_files(
    patient_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Authorization: patients can only access their own files
    if current_user.get("role") == "patient":
        patient = db.query(Patient).filter(Patient.user_id == current_user["id"]).first()
        if not patient or patient.id != patient_id:
            raise HTTPException(status_code=403, detail="Not authorized to access these files")

    audit_log("FILE_ACCESS", current_user["id"], {"patientId": patient_id})
    
    # Single query with JOIN - eliminates N+1 problem
    files_with_uploaders = db.query(MedicalFile, User).join(
        User, MedicalFile.uploaded_by == User.id
    ).filter(MedicalFile.patient_id == patient_id).all()
    
    result = []
    for file, uploader in files_with_uploaders:
        result.append({
            "id": file.id,
            "filename": file.original_name,
            "type": file.file_type,
            "uploadDate": file.created_at.isoformat(),
            "uploadedBy": uploader.name
        })
    
    return result