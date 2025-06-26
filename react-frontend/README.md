# Healthcare Platform - React Frontend

Material-UI based frontend for the rural healthcare platform.

## Features
- ✅ **Login/Authentication** with role selection
- ✅ **Patient Dashboard** with profile and consultations
- ✅ **Video Consultation** with WebRTC and real-time chat
- ✅ **Material-UI Design** - Professional healthcare interface
- ✅ **Responsive Layout** - Works on desktop, tablet, mobile

## Setup

```bash
cd react-frontend
npm install
npm start
```

Frontend runs on: `http://localhost:3000`
Backend API: `http://localhost:8000`

## Components

### Login.js
- Email/password authentication
- Role selection (Patient/Doctor)
- MFA token support
- Error handling

### Dashboard.js
- Patient profile display
- Medical history and allergies
- Quick actions (book consultation, upload files)
- Recent consultations list

### VideoConsultation.js
- WebRTC video calling
- Real-time chat via Socket.IO
- Video/audio controls
- Professional consultation interface

## Usage
1. Start Python backend: `cd python-backend && python main.py`
2. Start React frontend: `cd react-frontend && npm start`
3. Login with any email/password
4. Navigate between Dashboard and Consultation
5. Test video calling and chat features

## Healthcare-Specific Features
- Medical terminology and icons
- Patient-friendly interface
- Accessibility compliant
- Professional color scheme
- HIPAA-ready design patterns