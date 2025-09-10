import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Button,
  Box
} from '@mui/material';
import { LocalHospital } from '@mui/icons-material';

import Login from './components/Login';
import HealthPractitionerDashboard from './components/HealthPractitionerDashboard';
import AdminDashboard from './components/AdminDashboard';
import AdminDoctorRegistration from './components/AdminDoctorRegistration';
import AdminPatientRegistration from './components/AdminPatientRegistration';
import AdminPendingDoctors from './components/AdminPendingDoctors';
import DoctorDashboard from './components/DoctorDashboard';
import PendingDoctorDashboard from './components/PendingDoctorDashboard';
import DoctorRegistration from './components/DoctorRegistration';
import VideoConsultation from './components/VideoConsultation';
import MyConsultations from './components/MyConsultations';
import SuperAdminSetup from './components/SuperAdminSetup';
import TriageForm from './components/TriageForm';
import BookConsultation from './components/BookConsultation';
import OfflineBanner from './components/OfflineBanner';
import { getToken, setToken as setAuthToken, clearToken, getUser as getStoredUser, setUser as setStoredUser } from './authToken';

function App() {
  const [user, setUser] = useState(null);
  const [adminPerms, setAdminPerms] = useState([]);

  useEffect(() => {
    const token = getToken();
    const u = getStoredUser();
    if (token && u) {
      setUser(u);
      if (u.role === 'admin') {
        fetchAdminPerms(token);
      }
    }
  }, []);

  const fetchAdminPerms = async (token) => {
    try {
      const base = process.env.REACT_APP_API_BASE || 'http://localhost:8000';
      const res = await fetch(`${base}/api/admin/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const data = await res.json();
      setAdminPerms(Array.isArray(data.permissions) ? data.permissions : []);
    } catch (_) {}
  };

  const handleLogin = (userData, token) => {
    setUser(userData);
    setStoredUser(userData);
    setAuthToken(token);
  };

  const handleLogout = () => {
    setUser(null);
    clearToken();
    setStoredUser(null);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
            <LocalHospital sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Rural Healthcare Platform
            </Typography>

            {user && (
              <>
                {user.role === 'admin' && (
                  <>
                    <Button color="inherit" component={Link} to="/admin/register-patient">
                      Register Health Practitioner
                    </Button>
                    {adminPerms.includes('system_admin') && (
                      <>
                        <Button color="inherit" component={Link} to="/admin/register-doctor">
                          Register Doctor
                        </Button>
                        <Button color="inherit" component={Link} to="/admin/pending-doctors">
                          Pending Doctors
                        </Button>
                      </>
                    )}
                  </>
                )}

                <Button color="inherit" component={Link} to="/dashboard">
                  Dashboard
                </Button>
                {user.role !== 'admin' && (
                  <>
                    <Button color="inherit" component={Link} to="/consultations">
                      My Consultations
                    </Button>
                    <Button color="inherit" component={Link} to="/triage">
                      Triage
                    </Button>
                    <Button color="inherit" component={Link} to="/book">
                      Book
                    </Button>
                  </>
                )}
                <Button color="inherit" onClick={handleLogout}>
                  Logout ({user.email})
                </Button>
              </>
            )}
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ mt: 4 }}>
          <OfflineBanner />
          <Routes>
            <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" />} />
            <Route path="/register/doctor" element={!user ? <DoctorRegistration /> : <Navigate to="/dashboard" />} />
            <Route path="/setup-super-admin" element={<SuperAdminSetup />} />

            {user ? (
              <>
                <Route path="/dashboard" element={
                  user.role === 'doctor' ? (
                    user.verification_status === 'pending' ? 
                      <PendingDoctorDashboard user={user} /> : 
                      <DoctorDashboard user={user} />
                  ) :
                  user.role === 'admin' ? <AdminDashboard user={user} /> :
                  <HealthPractitionerDashboard user={user} />
                } />
                <Route path="/consultations" element={<MyConsultations user={user} />} />
                <Route path="/consultation/:consultationId" element={<VideoConsultation user={user} />} />
                {user.role === 'admin' && (
                  <>
                    <Route path="/admin/register-patient" element={<AdminPatientRegistration />} />
                    <Route path="/admin/register-doctor" element={<AdminDoctorRegistration user={user} />} />
                    <Route path="/admin/pending-doctors" element={<AdminPendingDoctors />} />
                  </>
                )}
                <Route path="/triage" element={<TriageForm />} />
                <Route path="/book" element={<BookConsultation />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </>
            ) : (
              <Route path="*" element={<Navigate to="/login" />} />
            )}
          </Routes>
        </Container>
      </Box>
  );
}

export default App;
