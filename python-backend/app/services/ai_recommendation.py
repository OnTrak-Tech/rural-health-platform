from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from ..database_enhanced import DoctorProfile, User, Patient, MedicalFile

class AIRecommendationService:
    
    CONDITION_SPECIALTY_MAP = {
        'heart': ['cardiology'], 'chest pain': ['cardiology'], 'diabetes': ['endocrinology'],
        'skin': ['dermatology'], 'rash': ['dermatology'], 'depression': ['psychiatry'],
        'anxiety': ['psychiatry'], 'bone': ['orthopedics'], 'joint': ['orthopedics'],
        'pregnancy': ['obstetrics'], 'eye': ['ophthalmology'], 'ear': ['otolaryngology'],
        'kidney': ['nephrology'], 'stomach': ['gastroenterology'], 'lung': ['pulmonology'],
        'cancer': ['oncology'], 'headache': ['neurology'], 'child': ['pediatrics']
    }
    
    @staticmethod
    def recommend_doctors(
        db: Session, patient_symptoms: str, patient_medical_history: List[str],
        patient_id: Optional[int] = None, limit: int = 5
    ) -> List[Dict]:
        
        # Extract specialties from symptoms and history
        relevant_specialties = []
        combined_text = (patient_symptoms + " " + " ".join(patient_medical_history or [])).lower()
        
        for condition, specs in AIRecommendationService.CONDITION_SPECIALTY_MAP.items():
            if condition in combined_text:
                relevant_specialties.extend(specs)
        
        # Get OCR context from patient files
        if patient_id:
            files = db.query(MedicalFile).filter(
                MedicalFile.patient_id == patient_id,
                MedicalFile.ocr_text.isnot(None)
            ).limit(3).all()
            ocr_text = " ".join([f.ocr_text for f in files if f.ocr_text]).lower()
            
            for condition, specs in AIRecommendationService.CONDITION_SPECIALTY_MAP.items():
                if condition in ocr_text:
                    relevant_specialties.extend(specs)
        
        relevant_specialties = list(set(relevant_specialties))
        
        # Query doctors
        query = db.query(DoctorProfile, User).join(User, DoctorProfile.user_id == User.id)
        query = query.filter(User.role == "doctor", DoctorProfile.verification_status == "verified")
        
        if relevant_specialties:
            filters = [DoctorProfile.primary_specialization.ilike(f"%{spec}%") for spec in relevant_specialties]
            from sqlalchemy import or_
            query = query.filter(or_(*filters))
        
        doctors = query.all()
        
        # Score doctors
        scored_doctors = []
        for profile, user in doctors:
            score = 10.0  # Base score
            
            # Specialty match
            primary_spec = (profile.primary_specialization or "").lower()
            for spec in relevant_specialties:
                if spec in primary_spec:
                    score += 20
                    break
            
            # Experience score
            years = profile.years_of_practice or 0
            if years >= 15: score += 15
            elif years >= 10: score += 12
            elif years >= 5: score += 8
            else: score += 5
            
            # Certifications
            score += min(len(profile.board_certifications or []) * 3, 9)
            
            scored_doctors.append({
                "id": user.id, "name": user.name, "email": user.email,
                "specialization": profile.primary_specialization,
                "yearsOfPractice": years, "telemedicineStates": profile.telemedicine_states or [],
                "boardCertifications": profile.board_certifications or [],
                "score": score, "isAiRecommended": True,
                "matchReason": f"{primary_spec.title()} specialist with {years} years experience"
            })
        
        scored_doctors.sort(key=lambda x: x["score"], reverse=True)
        return scored_doctors[:limit]