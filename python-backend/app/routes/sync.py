from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime

from ..middleware.auth_middleware import get_current_user, audit_log
from ..database_enhanced import get_db, Consultation, User, DoctorProfile, Patient

router = APIRouter()

class ConsultationSyncItem(BaseModel):
    clientId: Optional[str] = Field(None, description="Client-side temporary ID for dedup/mapping")
    serverId: Optional[int] = Field(None, description="Existing server ID if updating")
    updatedAt: Optional[str] = Field(None, description="Client-side last-updated ISO timestamp for conflict resolution")
    date: Optional[str] = Field(None, description="ISO datetime or date")
    symptoms: Optional[str] = None
    doctorId: Optional[int] = None
    specialization: Optional[str] = None

class ConsultationSyncRequest(BaseModel):
    items: List[ConsultationSyncItem]

@router.post("/consultations")
async def sync_consultations(
    payload: ConsultationSyncRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Accept a batch of offline-created or -updated consultations and persist them.
    Conflict policy: if client provides serverId and updatedAt newer than server's updated_at, apply update; otherwise skip.
    If only clientId is provided and not yet known, create new and store client_id for idempotency.
    Returns per-item status.
    """
    results = []

    # Ensure patient exists for current user
    patient = db.query(Patient).filter(Patient.user_id == current_user["id"]).first()
    if not patient:
        patient = Patient(user_id=current_user["id"], age=0, medical_history=[], allergies=[])
        db.add(patient)
        db.commit()
        db.refresh(patient)

    for item in payload.items:
        try:
            # Determine target doctor
            doctor_id = item.doctorId
            if doctor_id is None and item.specialization:
                # Find first verified doctor by specialization
                doc = (
                    db.query(DoctorProfile, User)
                    .join(User, DoctorProfile.user_id == User.id)
                    .filter(User.role == "doctor")
                    .filter(DoctorProfile.verification_status == "verified")
                    .filter(DoctorProfile.primary_specialization.ilike(f"%{item.specialization}%"))
                    .first()
                )
                if doc:
                    _, user = doc
                    doctor_id = user.id

            # Parse date
            c_date = None
            if item.date:
                try:
                    c_date = datetime.fromisoformat(item.date.replace("Z", "+00:00"))
                except Exception:
                    c_date = None

            # Parse client updatedAt
            client_updated = None
            if item.updatedAt:
                try:
                    client_updated = datetime.fromisoformat(item.updatedAt.replace("Z", "+00:00"))
                except Exception:
                    client_updated = None

            if item.serverId:
                # Update existing record if belongs to this patient
                consult = db.query(Consultation).filter(Consultation.id == item.serverId).first()
                if not consult or consult.patient_id != patient.id:
                    results.append({"clientId": item.clientId, "serverId": item.serverId, "status": "error", "reason": "not_found_or_forbidden"})
                    continue
                # Conflict resolution
                if client_updated and consult.updated_at and client_updated <= consult.updated_at:
                    results.append({"clientId": item.clientId, "serverId": consult.id, "status": "skipped_newer_server"})
                    continue
                # Apply updates (do not overwrite clinical fields like diagnosis unless provided)
                if doctor_id is not None:
                    consult.doctor_id = doctor_id
                if c_date is not None:
                    consult.date = c_date
                if item.symptoms is not None:
                    consult.symptoms = item.symptoms
                db.commit()
                results.append({"clientId": item.clientId, "serverId": consult.id, "status": "updated"})
                continue

            # If clientId provided, check idempotency
            if item.clientId:
                existing = db.query(Consultation).filter(Consultation.client_id == item.clientId).first()
                if existing:
                    results.append({"clientId": item.clientId, "serverId": existing.id, "status": "duplicate"})
                    continue

            # Create new consultation
            consultation = Consultation(
                patient_id=patient.id,
                doctor_id=doctor_id,
                date=c_date,
                symptoms=item.symptoms or "",
                status="scheduled",
                client_id=item.clientId
            )
            db.add(consultation)
            db.commit()
            db.refresh(consultation)

            audit_log("SYNC_CONSULTATION_CREATED", current_user["id"], {"consultation_id": consultation.id})
            results.append({"clientId": item.clientId, "serverId": consultation.id, "status": "created"})
        except Exception as e:
            db.rollback()
            results.append({"clientId": item.clientId, "status": "error", "reason": str(e)})

    return {"results": results}

