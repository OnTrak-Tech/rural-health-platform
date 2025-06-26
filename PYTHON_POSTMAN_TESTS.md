# Python FastAPI Testing Guide

## Setup
1. Start server: `cd python-backend && pip install -r requirements.txt && python main.py`
2. Server runs on: `http://localhost:8000`
3. API docs: `http://localhost:8000/docs`

## Authentication APIs

### 1. Setup MFA
```
POST http://localhost:8000/api/auth/setup-mfa
Headers: Content-Type: application/json
Body: {}
```

### 2. Login (with MFA)
```
POST http://localhost:8000/api/auth/login
Headers: Content-Type: application/json
Body:
{
  "email": "doctor@example.com",
  "password": "password123",
  "role": "doctor",
  "mfaToken": "123456"
}
```

### 3. Register Patient
```
POST http://localhost:8000/api/auth/register/patient
Headers: Content-Type: application/json
Body:
{
  "email": "patient@example.com",
  "password": "password123",
  "name": "John Doe",
  "phone": "+1234567890"
}
```

## Patient Management APIs

### 4. Get Patient Profile
```
GET http://localhost:8000/api/patients/profile
Headers: 
  Authorization: Bearer YOUR_JWT_TOKEN
```

### 5. Update Patient Profile
```
PUT http://localhost:8000/api/patients/profile
Headers: 
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json
Body:
{
  "name": "John Updated",
  "age": 46,
  "medicalHistory": ["Diabetes", "Hypertension"],
  "allergies": ["Penicillin", "Shellfish"]
}
```

## Consultation APIs

### 6. Book Consultation
```
POST http://localhost:8000/api/consultations
Headers: 
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json
Body:
{
  "doctorId": 123,
  "date": "2024-02-15T10:00:00Z",
  "symptoms": "Fever, cough, fatigue"
}
```

### 7. Get Consultation Details
```
GET http://localhost:8000/api/consultations/1
Headers: 
  Authorization: Bearer YOUR_JWT_TOKEN
```

## File Management APIs

### 8. Upload Medical File
```
POST http://localhost:8000/api/files/upload
Headers: 
  Authorization: Bearer YOUR_JWT_TOKEN
Body: form-data
  file: [Select file - JPG/PNG/PDF/DCM]
  patientId: 123
  type: xray
```

### 9. Get Patient Files
```
GET http://localhost:8000/api/files/patient/123
Headers: 
  Authorization: Bearer YOUR_JWT_TOKEN
```

## Knowledge Base APIs

### 10. Drug Information Lookup
```
GET http://localhost:8000/api/knowledge/drugs/paracetamol
Headers: 
  Authorization: Bearer YOUR_JWT_TOKEN
```

### 11. Clinical Guidelines
```
GET http://localhost:8000/api/knowledge/guidelines/hypertension
Headers: 
  Authorization: Bearer YOUR_JWT_TOKEN
```

### 12. Symptom Analysis
```
POST http://localhost:8000/api/knowledge/analyze-symptoms
Headers: 
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json
Body:
{
  "symptoms": ["fever", "cough", "fatigue"]
}
```

## Key Features
- **FastAPI**: High-performance async API
- **Automatic API docs**: Available at `/docs`
- **Same functionality**: All Node.js features preserved
- **Better performance**: Python async/await
- **Type validation**: Pydantic models
- **Socket.IO**: Real-time communication maintained