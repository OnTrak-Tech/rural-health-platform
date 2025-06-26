import React, { useState, useEffect } from 'react';
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
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

function DoctorDashboard({ user }) {
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    pendingConsultations: 0
  });

  useEffect(() => {
    fetchProfile();
    fetchAppointments();
    fetchPatients();
    fetchStats();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/doctors/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/doctors/appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(response.data);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    }
  };

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/doctors/patients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPatients(response.data);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/doctors/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
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
            {profile && (
              <>
                <Typography><strong>Name:</strong> Dr. {profile.name}</Typography>
                <Typography><strong>Specialization:</strong> {profile.specialization}</Typography>
                <Typography><strong>License:</strong> {profile.licenseNumber}</Typography>
                <Typography><strong>Experience:</strong> {profile.experience} years</Typography>
              </>
            )}
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
                <Typography color="textSecondary">Total Patients</Typography>
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
                <Typography color="textSecondary">Pending Reviews</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Grid>

      {/* Today's Appointments */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Today's Appointments</Typography>
          <List>
            {appointments.slice(0, 5).map((appointment) => (
              <ListItem key={appointment.id} divider>
                <ListItemText
                  primary={appointment.patientName}
                  secondary={`${appointment.time} - ${appointment.symptoms}`}
                />
                <Box>
                  <Button
                    size="small"
                    startIcon={<VideoCall />}
                    variant="contained"
                    sx={{ mr: 1 }}
                  >
                    Start
                  </Button>
                  <Chip 
                    label={appointment.status} 
                    color={appointment.status === 'scheduled' ? 'primary' : 'success'}
                    size="small"
                  />
                </Box>
              </ListItem>
            ))}
          </List>
        </Paper>
      </Grid>

      {/* Recent Patients */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Recent Patients</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Patient</TableCell>
                  <TableCell>Last Visit</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {patients.slice(0, 5).map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>{patient.name}</TableCell>
                    <TableCell>{patient.lastVisit}</TableCell>
                    <TableCell>
                      <Chip 
                        label={patient.status} 
                        size="small"
                        color={patient.status === 'active' ? 'success' : 'default'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>

      {/* Quick Actions */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Quick Actions</Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<Schedule />}
              >
                View Schedule
              </Button>
              <Button
                variant="outlined"
                startIcon={<Assignment />}
              >
                Patient Records
              </Button>
              <Button
                variant="outlined"
                startIcon={<VideoCall />}
              >
                Start Consultation
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default DoctorDashboard;