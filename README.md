# Healthcare Platform

Remote medical consultation platform connecting rural patients with specialists.

## Tech Stack
- **API**: Python FastAPI (high-performance async)
- **Real-time**: Socket.IO + WebRTC
- **Auth**: JWT with MFA (OAuth 2.0 ready)
- **Containers**: Docker + Kubernetes
- **Notifications**: FCM integration
- **EHR**: FHIR R4 integration

## Quick Start

```bash
# Python Backend
cd python-backend
pip install -r requirements.txt
python main.py

# Server runs on: http://localhost:8000
# API docs: http://localhost:8000/docs

# Docker deployment
cd docker && docker-compose up

# Kubernetes
kubectl apply -f k8s/
```

## API Endpoints
**Authentication & Session Management:**
- `POST /api/auth/login` - Multi-factor authentication
- `POST /api/auth/setup-mfa` - Setup 2FA
- `POST /api/auth/register/patient` - Patient registration
- `POST /api/auth/register/doctor` - Doctor registration

**Patient Data Repository:**
- `GET /api/patients/profile` - Structured health records
- `PUT /api/patients/profile` - Update patient data
- `GET /api/patients/consultations` - Consultation history

**Communication System:**
- `POST /api/consultations` - Book video consultation
- `GET /api/consultations/:id` - Live consultation room
- `PUT /api/consultations/:id` - Add diagnosis/prescription

**File Management:**
- `POST /api/files/upload` - Secure file transfer (scans, reports)
- `GET /api/files/patient/:id` - Patient file access

**Clinical Knowledge Base:**
- `GET /api/knowledge/drugs/:name` - Drug information
- `GET /api/knowledge/guidelines/:condition` - Medical guidelines
- `POST /api/knowledge/analyze-symptoms` - Symptom checker

## Features Implemented
✅ **User & Session Management**
- Multi-factor authentication (TOTP)
- Role-based access control (patient/doctor)
- Secure session handling with JWT
- Comprehensive audit logging

✅ **Communication System**
- Real-time messaging via Socket.IO
- WebRTC video consultations
- Secure file upload & sharing
- Push notifications (FCM ready)

✅ **Data Handling & Integration**
- Structured patient data repository
- Clinical knowledge base (drugs, guidelines)
- EHR integration (FHIR R4 compatible)
- Complete audit trail system

✅ **Security & Compliance**
- HIPAA-compliant architecture
- Rate limiting & security headers
- Encrypted data transmission
- Audit logs for all clinical interactions

## Testing
Use `PYTHON_POSTMAN_TESTS.md` for API testing with Postman.

## What This Platform Does
Enables remote medical consultations between rural patients and specialists through:
- Video consultations with real-time chat
- Secure medical file sharing (X-rays, reports)
- Patient health record management
- Clinical decision support tools
- Complete audit trail for compliance