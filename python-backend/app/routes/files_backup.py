from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from typing import List
import os
import shutil
from datetime import datetime

from ..middleware.auth_middleware import get_current_user, audit_log

router = APIRouter()

UPLOAD_DIR = "uploads"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf", ".dcm"}

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    patientId: int = Form(...),
    type: str = Form("general"),
    current_user: dict = Depends(get_current_user)
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
    
    file_data = {
        "id": timestamp,
        "filename": filename,
        "originalName": file.filename,
        "size": file.size,
        "uploadedBy": current_user["id"],
        "patientId": patientId,
        "type": type
    }
    
    audit_log("FILE_UPLOAD", current_user["id"], {"filename": file.filename, "patientId": patientId})
    
    return file_data

@router.get("/patient/{patient_id}")
async def get_patient_files(
    patient_id: int,
    current_user: dict = Depends(get_current_user)
):
    audit_log("FILE_ACCESS", current_user["id"], {"patientId": patient_id})
    
    files = [
        {
            "id": 1,
            "filename": "xray-chest.jpg",
            "type": "xray",
            "uploadDate": "2024-01-15",
            "uploadedBy": "Dr. Smith"
        }
    ]
    return files