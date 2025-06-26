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
  Box
} from '@mui/material';
import { Person, VideoCall, FileUpload, LocalHospital } from '@mui/icons-material';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

function PatientDashboard({ user }) {
  const [profile, setProfile] = useState(null);
  const [consultations, setConsultations] = useState([]);

  useEffect(() => {
    fetchProfile();
    fetchConsultations();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/patients/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const fetchConsultations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/patients/consultations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConsultations(response.data);
    } catch (error) {
      console.error('Failed to fetch consultations:', error);
    }
  };

  const bookConsultation = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE}/consultations`, {
        doctorId: 123,
        date: new Date().toISOString(),
        symptoms: "General checkup"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchConsultations();
    } catch (error) {
      console.error('Failed to book consultation:', error);
    }
  };

  return (
    <Grid container spacing={3}>
      {/* Profile Card */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Person sx={{ mr: 1 }} />
              <Typography variant="h6">Patient Profile</Typography>
            </Box>
            {profile && (
              <>
                <Typography><strong>Name:</strong> {profile.name}</Typography>
                <Typography><strong>Age:</strong> {profile.age}</Typography>
                <Typography><strong>Medical History:</strong></Typography>
                <Box sx={{ mt: 1 }}>
                  {profile.medicalHistory?.map((condition, index) => (
                    <Chip key={index} label={condition} sx={{ mr: 1, mb: 1 }} />
                  ))}
                </Box>
                <Typography><strong>Allergies:</strong></Typography>
                <Box sx={{ mt: 1 }}>
                  {profile.allergies?.map((allergy, index) => (
                    <Chip key={index} label={allergy} color="error" sx={{ mr: 1, mb: 1 }} />
                  ))}
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Quick Actions */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <LocalHospital sx={{ mr: 1 }} />
              <Typography variant="h6">Quick Actions</Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<VideoCall />}
              fullWidth
              sx={{ mb: 2 }}
              onClick={bookConsultation}
            >
              Book Video Consultation
            </Button>
            <Button
              variant="outlined"
              startIcon={<FileUpload />}
              fullWidth
            >
              Upload Medical Files
            </Button>
          </CardContent>
        </Card>
      </Grid>

      {/* Recent Consultations */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>My Consultations</Typography>
          <List>
            {consultations.map((consultation) => (
              <ListItem key={consultation.id} divider>
                <ListItemText
                  primary={`Dr. ${consultation.doctorName}`}
                  secondary={`${consultation.date} - ${consultation.diagnosis || 'Pending'}`}
                />
                <Chip 
                  label={consultation.status} 
                  color={consultation.status === 'completed' ? 'success' : 'primary'}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Grid>
    </Grid>
  );
}

export default PatientDashboard;