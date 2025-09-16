import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { 
  Person, 
  Schedule, 
  Assignment, 
  VideoCall,
  TrendingUp,
  People
} from '@mui/icons-material';
import { getToken } from '../authToken';

const API_BASE = (process.env.REACT_APP_API_BASE || 'http://localhost:8000') + '/api';

function DoctorDashboard({ user }) {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    pendingConsultations: 0
  });

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const token = getToken();
      console.log('Fetching consultations for doctor ID:', user.id);
      
      const response = await fetch(`${API_BASE}/doctors/consultations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('API Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Consultations received:', data);
        setAppointments(data);
        setStats({
          totalPatients: data.length,
          todayAppointments: data.filter(apt => 
            new Date(apt.date).toDateString() === new Date().toDateString()
          ).length,
          pendingConsultations: data.filter(apt => apt.status === 'scheduled').length
        });
      } else {
        const errorText = await response.text();
        console.error('API Error:', errorText);
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    }
  };

  const joinConsultation = (consultationId) => {
    navigate(`/consultation/${consultationId}`);
  };

  const updateConsultationStatus = async (consultationId, status) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/consultations/${consultationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        fetchAppointments(); // Refresh the list
      } else {
        console.error('Failed to update consultation status');
      }
    } catch (error) {
      console.error('Error updating consultation status:', error);
    }
  };

  return (
    <Grid container spacing={3}>
      {/* Doctor Profile */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Person sx={{ mr: 1 }} />
              <Typography variant="h6">Doctor Profile</Typography>
            </Box>
            <Typography><strong>Name:</strong> {user.name}</Typography>
            <Typography><strong>Email:</strong> {user.email}</Typography>
            <Typography><strong>Doctor ID:</strong> {user.id}</Typography>
            <Typography><strong>Role:</strong> Medical Specialist</Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Statistics Cards */}
      <Grid item xs={12} md={8}>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <People sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4">{stats.totalPatients}</Typography>
                <Typography color="textSecondary">Total Consultations</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Schedule sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                <Typography variant="h4">{stats.todayAppointments}</Typography>
                <Typography color="textSecondary">Today's Appointments</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingUp sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h4">{stats.pendingConsultations}</Typography>
                <Typography color="textSecondary">Pending Consultations</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Grid>

      {/* Scheduled Consultations */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>My Consultations</Typography>
          {appointments.length === 0 ? (
            <Typography color="textSecondary">
              No consultations assigned to Doctor ID: {user.id}. 
              Check browser console for API details.
            </Typography>
          ) : (
            <List>
              {appointments.map((appointment) => (
                <ListItem key={appointment.id} divider>
                  <ListItemText
                    primary={`Patient: ${appointment.patientName || 'Health Practitioner'}`}
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          <strong>Date:</strong> {new Date(appointment.date).toLocaleString()}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Symptoms:</strong> {appointment.symptoms}
                        </Typography>
                      </Box>
                    }
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Chip 
                      label={appointment.status} 
                      color={
                        appointment.status === 'scheduled' ? 'primary' :
                        appointment.status === 'accepted' ? 'success' :
                        appointment.status === 'declined' ? 'error' : 'default'
                      }
                      size="small"
                    />
                    {appointment.status === 'scheduled' && (
                      <>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => updateConsultationStatus(appointment.id, 'accepted')}
                        >
                          Accept
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => updateConsultationStatus(appointment.id, 'declined')}
                        >
                          Decline
                        </Button>
                      </>
                    )}
                    {appointment.status === 'accepted' && (
                      <Button
                        size="small"
                        startIcon={<VideoCall />}
                        variant="contained"
                        onClick={() => joinConsultation(appointment.id)}
                      >
                        Join
                      </Button>
                    )}
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
}

export default DoctorDashboard;