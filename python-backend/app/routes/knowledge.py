from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List

from ..middleware.auth_middleware import get_current_user, audit_log
from ..services.knowledge_base import KnowledgeBase

router = APIRouter()
kb = KnowledgeBase()

class SymptomAnalysis(BaseModel):
    symptoms: List[str]

@router.get("/drugs/{drug_name}")
async def get_drug_info(
    drug_name: str,
    current_user: dict = Depends(get_current_user)
):
    audit_log("DRUG_LOOKUP", current_user["id"], {"drug": drug_name})
    
    drug_info = kb.get_drug_info(drug_name)
    if not drug_info:
        return {"error": "Drug not found"}
    
    return drug_info

@router.get("/guidelines/{condition}")
async def get_guidelines(
    condition: str,
    current_user: dict = Depends(get_current_user)
):
    audit_log("GUIDELINE_ACCESS", current_user["id"], {"condition": condition})
    
    guidelines = kb.get_guidelines(condition)
    if not guidelines:
        return {"error": "Guidelines not found"}
    
    return guidelines

@router.post("/analyze-symptoms")
async def analyze_symptoms(
    analysis_request: SymptomAnalysis,
    current_user: dict = Depends(get_current_user)
):
    audit_log("SYMPTOM_ANALYSIS", current_user["id"], {"symptoms": analysis_request.symptoms})
    
    analysis = kb.analyze_symptoms(analysis_request.symptoms)
    return {"possibleConditions": analysis}