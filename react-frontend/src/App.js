import React, { useState, useEffect } from 'react';
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
import PatientDashboard from './components/PatientDashboard';
import AdminDoctorRegistration from './components/AdminDoctorRegistration';
import DoctorDashboard from './components/DoctorDashboard';
import VideoConsultation from './components/VideoConsultation';
import SuperAdminSetup from './components/SuperAdminSetup';

function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }

    // Check URL path for admin routes
    if (window.location.pathname === '/admin/register/doctor') {
      setCurrentView('admin-register-doctor');
    } else if (window.location.pathname === '/setup-super-admin') {
      setCurrentView('setup-super-admin');
    }
  }, []);

  const handleLogin = (userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentView('dashboard');
  };

  if (!user && currentView !== 'setup-super-admin') {
    return <Login onLogin={handleLogin} />;
  }

  if (currentView === 'setup-super-admin') {
    return <SuperAdminSetup />;
  }

  if (currentView === 'admin-register-doctor' && user.role === 'admin') {
    return <AdminDoctorRegistration user={user} />;
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <LocalHospital sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Rural Healthcare Platform
          </Typography>

          {user.role === 'admin' && (
            <Button
              color="inherit"
              onClick={() => setCurrentView('admin-register-doctor')}
            >
              Register Doctor
            </Button>
          )}

          <Button color="inherit" onClick={() => setCurrentView('dashboard')}>
            Dashboard
          </Button>
          <Button color="inherit" onClick={() => setCurrentView('consultation')}>
            Consultation
          </Button>
          <Button color="inherit" onClick={handleLogout}>
            Logout ({user.email})
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        {currentView === 'dashboard' &&
          (user.role === 'doctor' ? (
            <DoctorDashboard user={user} />
          ) : (
            <PatientDashboard user={user} />
          ))}

        {currentView === 'consultation' && (
          <VideoConsultation user={user} />
        )}
      </Container>
    </Box>
  );
}

export default App;
