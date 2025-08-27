from typing import List, Optional

class TriageEngine:
    """Rule-based triage engine for initial assessment.
    Returns urgency and recommended specialty based on symptoms and vitals.
    """

    CONDITION_SPECIALTY_MAP = {
        "chest pain": "cardiology",
        "shortness of breath": "pulmonology",
        "asthma": "pulmonology",
        "pregnancy": "obstetrics",
        "headache": "neurology",
        "seizure": "neurology",
        "stroke": "neurology",
        "abdominal pain": "gastroenterology",
        "fever": "infectious disease",
        "rash": "dermatology",
        "diabetes": "endocrinology",
        "hypertension": "cardiology",
        "fracture": "orthopedics",
    }

    def assess(self, symptoms: List[str], vitals: Optional[dict] = None) -> dict:
        symptoms_l = [s.lower().strip() for s in symptoms]
        vitals = vitals or {}
        hr = vitals.get("heartRate")
        spo2 = vitals.get("spo2")
        sys = vitals.get("systolic")
        dia = vitals.get("diastolic")
        temp = vitals.get("temperature")
        rr = vitals.get("respRate")
        age = vitals.get("age")
        chest_pain = bool(vitals.get("chestPain")) or ("chest pain" in symptoms_l)
        altered = bool(vitals.get("consciousnessAltered"))
        pregnancy = bool(vitals.get("pregnancy")) or ("pregnancy" in symptoms_l)

        reasons = []
        urgency = "routine"

        # Red flags → emergency
        if altered:
            urgency = "emergency"
            reasons.append("Altered level of consciousness")
        if chest_pain:
            urgency = "emergency"
            reasons.append("Chest pain")
        if spo2 is not None and spo2 < 90:
            urgency = "emergency"
            reasons.append(f"Low SpO2 ({spo2}%)")
        if sys is not None and sys < 80:
            urgency = "emergency"
            reasons.append(f"Hypotension (SBP {sys})")
        if rr is not None and (rr < 8 or rr > 30):
            urgency = "emergency"
            reasons.append(f"Abnormal respiratory rate ({rr})")

        # Urgent flags
        if urgency != "emergency":
            if temp is not None and temp >= 39.5:
                urgency = "urgent"
                reasons.append(f"High fever ({temp}°C)")
            if sys is not None and sys >= 180:
                urgency = "urgent"
                reasons.append(f"Hypertensive (SBP {sys})")
            if hr is not None and (hr < 40 or hr > 130):
                urgency = "urgent"
                reasons.append(f"Abnormal heart rate ({hr})")

        # Pregnancy consideration
        if pregnancy and urgency != "emergency":
            urgency = "urgent"
            reasons.append("Pregnancy consideration")

        # Determine recommended specialty by most severe complaint
        recommended = None
        for s in symptoms_l:
            if s in self.CONDITION_SPECIALTY_MAP:
                recommended = self.CONDITION_SPECIALTY_MAP[s]
                break
        if chest_pain and not recommended:
            recommended = "cardiology"
        if pregnancy and not recommended:
            recommended = "obstetrics"

        return {
            "urgency": urgency,
            "reasons": reasons,
            "recommendedSpecialty": recommended or "general medicine",
        }

