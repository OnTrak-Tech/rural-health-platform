from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

from ..middleware.auth_middleware import get_current_user, audit_log
from ..services.triage_engine import TriageEngine

router = APIRouter()
engine = TriageEngine()

class Vitals(BaseModel):
    heartRate: Optional[int] = None
    spo2: Optional[int] = None
    systolic: Optional[int] = None
    diastolic: Optional[int] = None
    temperature: Optional[float] = None
    respRate: Optional[int] = None
    age: Optional[int] = None
    chestPain: Optional[bool] = None
    consciousnessAltered: Optional[bool] = None
    pregnancy: Optional[bool] = None

class TriageRequest(BaseModel):
    symptoms: List[str] = Field(default_factory=list)
    vitals: Optional[Vitals] = None

@router.post("/assess")
async def assess_triage(payload: TriageRequest, current_user: dict = Depends(get_current_user)):
    result = engine.assess(payload.symptoms, payload.vitals.model_dump() if payload.vitals else None)
    audit_log("TRIAGE_ASSESS", current_user["id"], {"symptoms": payload.symptoms, "result": result})
    return result

@router.get("/decision-tree")
async def decision_tree(current_user: dict = Depends(get_current_user)):
    """Expose a minimal decision tree structure for offline use."""
    tree = {
        "question": "Is patient conscious?",
        "yes": {
            "question": "Is there chest pain or severe shortness of breath?",
            "yes": {"urgency": "emergency", "recommend": "cardiology/pulmonology"},
            "no": {
                "question": "Is fever >= 39.5C or SBP >= 180?",
                "yes": {"urgency": "urgent", "recommend": "general medicine"},
                "no": {"urgency": "routine", "recommend": "general medicine"}
            }
        },
        "no": {"urgency": "emergency", "recommend": "emergency medicine"}
    }
    return tree

