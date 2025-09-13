# Rural Healthcare Platform

Remote medical consultation platform connecting rural health practitioners with medical specialists.

## Tech Stack
- **Backend**: Python FastAPI (high-performance async)
- **Frontend**: React 18 with Material-UI
- **Real-time**: Socket.IO + WebRTC for video consultations
- **Auth**: JWT with MFA (TOTP) + role-based access control
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Containers**: Docker + Kubernetes ready
- **AI**: Doctor recommendation engine
- **Offline**: IndexedDB sync for rural connectivity
- **Security**: HIPAA-compliant with audit logging

## Quick Start

### Local Development
```bash
# Backend (Terminal 1)
cd python-backend
pip install -r requirements.txt
cp .env.example .env  # Edit with your values
python main.py
# Server: http://localhost:8000 | Docs: http://localhost:8000/docs

# Frontend (Terminal 2)
cd react-frontend
npm install
npm start
# App: http://localhost:3000
```

### Docker Deployment
```bash
# Full stack with Docker Compose
cd python-backend
cp .env.example .env  # Edit with your values
docker-compose up -d
# Backend: http://localhost:8000 | Frontend: http://localhost:3000
```

### Super Admin Setup

To enable one-time super admin creation, set a setup key in the backend environment and restart the backend:
- Local: add SUPER_ADMIN_SETUP_KEY to python-backend/.env
- Docker Compose: add SUPER_ADMIN_SETUP_KEY to python-backend/.env used by docker-compose
- Kubernetes: add SUPER_ADMIN_SETUP_KEY to your healthcare-secrets and reference it in the Deployment

Then create the super admin from the web UI at /setup-super-admin, or via curl:

```bash path=null start=null
curl --fail-with-body -sS -X POST 'http://localhost:8000/api/auth/setup/super-admin' \
  -F email='admin@example.com' \
  -F password="$SUPER_ADMIN_PASSWORD" \
  -F name='Super Admin' \
  -F setup_key="$SUPER_ADMIN_SETUP_KEY"
```

Notes:
- The endpoint is rate-limited to 1 request per minute; wait a minute between retries during development.
- The request will return 403 if SUPER_ADMIN_SETUP_KEY is not set on the server or does not match your submitted setup_key.

## User Roles & Workflows

### **Health Practitioners** (Rural healthcare workers)
1. **Registration**: Admin-created accounts with secure credentials
2. **Book Consultations**: Schedule appointments with specialists using:
   - AI-powered doctor recommendations based on symptoms
   - Manual specialist search by specialization/location
   - User-friendly date/time picker
3. **My Consultations**: View scheduled appointments and join video calls
4. **Video Consultations**: WebRTC video calls with real-time chat
5. **Offline Support**: Queue consultations when offline, auto-sync when online

### **Doctors** (Medical specialists)
1. **Self-Registration**: Public registration with document verification
2. **Pending Verification**: Dashboard while awaiting admin approval
3. **Doctor Dashboard**: Manage appointments and patient consultations
4. **Video Consultations**: Join scheduled consultations with patients

### **Administrators**
1. **Super Admin Setup**: One-time creation with setup key
2. **User Management**: Register health practitioners and verify doctors
3. **Pending Doctors**: Review and approve doctor registrations
4. **System Monitoring**: Audit logs and activity tracking

## Key API Endpoints
**Authentication:**
- `POST /api/auth/login` - Multi-factor authentication
- `POST /api/auth/setup/super-admin` - One-time admin creation
- `POST /api/auth/register/doctor` - Public doctor self-registration

**Admin Management:**
- `POST /api/admin/register/patient` - Admin creates health practitioner
- `POST /api/admin/register/doctor` - Admin creates verified doctor
- `GET /api/admin/pending-doctors` - List doctors awaiting verification

**Consultations:**
- `POST /api/consultations` - Book video consultation
- `GET /api/patients/consultations` - List user's consultations
- `GET /api/consultations/:id` - Join specific consultation room
- `POST /api/sync/consultations` - Offline consultation sync

**Doctor Matching:**
- `GET /api/doctors/match` - Search doctors by specialization
- `GET /api/doctors/ai-recommend` - AI-powered doctor recommendations

## Features Implemented

✅ **Enhanced User Management**
- Multi-factor authentication (TOTP) with QR codes
- Role-based access control (health practitioner/doctor/admin)
- Auto-generated secure passwords for doctor registration
- Email notifications for new accounts
- Pending verification workflow for doctors

✅ **Smart Consultation Booking**
- AI-powered doctor recommendations based on symptoms
- Manual specialist search with filters
- User-friendly datetime picker (no more ISO strings!)
- Form validation preventing empty submissions
- Offline consultation queuing with auto-sync

✅ **Integrated Video Consultations**
- Dynamic consultation rooms tied to specific appointments
- WebRTC video calls with audio/video controls
- Real-time chat during consultations
- Consultation history and status tracking
- Join consultations 15 minutes before scheduled time

✅ **Offline-First Architecture**
- IndexedDB storage for rural connectivity
- Automatic sync when connection restored
- Offline consultation booking and queuing
- Network status indicators

✅ **Security & Compliance**
- HIPAA-compliant architecture with encryption
- Rate limiting on sensitive endpoints
- Comprehensive audit logging
- Secure document upload and storage
- JWT token management with proper storage

✅ **Admin Portal**
- Dual-purpose super admin setup page
- Doctor verification dashboard
- Health practitioner registration
- System activity monitoring
- Permission-based access control

## Testing
Use `PYTHON_POSTMAN_TESTS.md` for API testing with Postman.

## Platform Capabilities

**For Rural Health Practitioners:**
- Schedule consultations with medical specialists using AI recommendations
- Join video calls with doctors for real-time medical guidance
- Access consultation history and medical records
- Work offline in areas with poor connectivity

**For Medical Specialists:**
- Self-register and await verification
- Manage consultation appointments
- Provide remote medical expertise via video calls
- Document diagnoses and treatment recommendations

**For Healthcare Administrators:**
- Manage user accounts and doctor verifications
- Monitor system usage and audit trails
- Ensure compliance with healthcare regulations
- Oversee platform security and access controls

## CI/CD Pipeline
Automated deployment with GitHub Actions:
- Separate testing for Python backend and React frontend
- Docker image building and container registry
- Multiple deployment options (AWS ECS, EC2, Kubernetes)
- Environment-specific configuration management

## Development & Testing
- Backend: pytest with coverage reporting
- Frontend: Jest/React Testing Library
- API Documentation: FastAPI automatic OpenAPI docs
- Postman collection available for API testing