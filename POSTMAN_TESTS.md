# Postman API Testing Guide

## Setup
1. Start server: `cd backend && npm install && npm start`
2. Server runs on: `http://localhost:3000`

## Authentication APIs

### 1. Setup MFA
```
POST http://localhost:3000/api/auth/setup-mfa
Headers: Content-Type: application/json
Body: {}
```

### 2. Login (without MFA)
```
POST http://localhost:3000/api/auth/login
Headers: Content-Type: application/json
Body:
{
  "email": "doctor@example.com",
  "password": "password123",
  "role": "doctor"
}
```

### 3. Login (with MFA)
```
POST http://localhost:3000/api/auth/login
Headers: Content-Type: application/json
Body:
{
  "email": "doctor@example.com",
  "password": "password123",
  "role": "doctor",
  "mfaToken": "123456"
}
```

### 4. Register Patient
```
POST http://localhost:3000/api/auth/register/patient
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
**Note: Add Authorization header with JWT token from login**

### 5. Get Patient Profile
```
GET http://localhost:3000/api/patients/profile
Headers: 
  Authorization: Bearer YOUR_JWT_TOKEN
```

### 6. Update Patient Profile
```
PUT http://localhost:3000/api/patients/profile
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

### 7. Book Consultation
```
POST http://localhost:3000/api/consultations
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

### 8. Get Consultation Details
```
GET http://localhost:3000/api/consultations/1
Headers: 
  Authorization: Bearer YOUR_JWT_TOKEN
```

### 9. Update Consultation (Add Diagnosis)
```
PUT http://localhost:3000/api/consultations/1
Headers: 
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json
Body:
{
  "diagnosis": "Common cold",
  "prescription": "Paracetamol 500mg twice daily",
  "notes": "Rest and fluids recommended"
}
```

## File Management APIs

### 10. Upload Medical File
```
POST http://localhost:3000/api/files/upload
Headers: 
  Authorization: Bearer YOUR_JWT_TOKEN
Body: form-data
  file: [Select file - JPG/PNG/PDF/DCM]
  patientId: 123
  type: xray
```

### 11. Get Patient Files
```
GET http://localhost:3000/api/files/patient/123
Headers: 
  Authorization: Bearer YOUR_JWT_TOKEN
```

## Knowledge Base APIs

### 12. Drug Information Lookup
```
GET http://localhost:3000/api/knowledge/drugs/paracetamol
Headers: 
  Authorization: Bearer YOUR_JWT_TOKEN
```

### 13. Clinical Guidelines
```
GET http://localhost:3000/api/knowledge/guidelines/hypertension
Headers: 
  Authorization: Bearer YOUR_JWT_TOKEN
```

### 14. Symptom Analysis
```
POST http://localhost:3000/api/knowledge/analyze-symptoms
Headers: 
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json
Body:
{
  "symptoms": ["fever", "cough", "fatigue"]
}
```

## Expected Responses

### Login Success:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "doctor@example.com",
    "role": "doctor"
  },
  "requiresMFA": false
}
```

### Drug Lookup Success:
```json
{
  "name": "Paracetamol",
  "dosage": "500mg-1g every 4-6 hours",
  "maxDaily": "4g",
  "contraindications": ["Liver disease"],
  "interactions": ["Warfarin"]
}
```

## Testing Notes
- All protected routes require `Authorization: Bearer TOKEN`
- File uploads use multipart/form-data
- Audit logs appear in server console
- MFA tokens are 6-digit TOTP codes