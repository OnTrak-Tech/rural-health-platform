class KnowledgeBase:
    def __init__(self):
        self.drug_database = {
            'paracetamol': {
                "name": "Paracetamol",
                "dosage": "500mg-1g every 4-6 hours",
                "maxDaily": "4g",
                "contraindications": ["Liver disease"],
                "interactions": ["Warfarin"]
            },
            'amoxicillin': {
                "name": "Amoxicillin",
                "dosage": "250-500mg every 8 hours",
                "duration": "7-10 days",
                "contraindications": ["Penicillin allergy"],
                "sideEffects": ["Nausea", "Diarrhea"]
            }
        }
        
        self.guidelines = {
            'hypertension': {
                "condition": "Hypertension",
                "criteria": "BP ≥140/90 mmHg",
                "treatment": "Lifestyle + ACE inhibitors",
                "monitoring": "Monthly BP checks"
            },
            'diabetes': {
                "condition": "Type 2 Diabetes",
                "criteria": "HbA1c ≥6.5%",
                "treatment": "Metformin + lifestyle",
                "monitoring": "HbA1c every 3 months"
            }
        }
        
        self.symptom_map = {
            frozenset(['fever', 'cough', 'fatigue']): ['Common cold', 'Flu', 'COVID-19'],
            frozenset(['chest pain', 'shortness of breath']): ['Angina', 'Heart attack', 'Pneumonia'],
            frozenset(['headache', 'nausea', 'vomiting']): ['Migraine', 'Hypertension', 'Meningitis']
        }
    
    def get_drug_info(self, drug_name: str):
        return self.drug_database.get(drug_name.lower())
    
    def get_guidelines(self, condition: str):
        return self.guidelines.get(condition.lower())
    
    def analyze_symptoms(self, symptoms: list):
        symptom_set = frozenset([s.lower() for s in symptoms])
        
        for key, conditions in self.symptom_map.items():
            if symptom_set == key:
                return conditions
        
        return ['Consult specialist']