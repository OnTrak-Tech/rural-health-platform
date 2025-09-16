import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, List, ListItem, ListItemText, Button, Chip, Alert } from '@mui/material';
import { VideoCall } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../authToken';

const API_BASE = (process.env.REACT_APP_API_BASE || 'http://localhost:8000') + '/api';

export default function MyConsultations({ user }) {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/patients/consultations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch consultations');
      const data = await res.json();
      setConsultations(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'primary';
      case 'accepted': return 'success';
      case 'in-progress': return 'success';
      case 'completed': return 'default';
      case 'cancelled': return 'error';
      case 'declined': return 'error';
      default: return 'default';
    }
  };

  const joinConsultation = (consultationId) => {
    navigate(`/consultation/${consultationId}`);
  };

  if (loading) return <Typography>Loading consultations...</Typography>;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Typography variant="h4" gutterBottom>My Consultations</Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {consultations.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">No consultations scheduled</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Book your first consultation using the "Book" button in the navigation.
          </Typography>
          <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/book')}>
            Book Consultation
          </Button>
        </Paper>
      ) : (
        <Paper sx={{ p: 2 }}>
          <List>
            {consultations.map((consultation) => (
              <ListItem key={consultation.id} sx={{ border: '1px solid #e0e0e0', mb: 1, borderRadius: 1 }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6">
                        Dr. {consultation.doctorName || 'TBD'}
                      </Typography>
                      <Chip 
                        label={consultation.status} 
                        color={getStatusColor(consultation.status)}
                        size="small"
                      />
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2">
                        <strong>Date:</strong> {new Date(consultation.date).toLocaleString()}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Symptoms:</strong> {consultation.symptoms}
                      </Typography>
                      {consultation.diagnosis && (
                        <Typography variant="body2">
                          <strong>Diagnosis:</strong> {consultation.diagnosis}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                <Box sx={{ ml: 2 }}>
                  {consultation.status === 'accepted' ? (
                    <Button 
                      variant="contained" 
                      color="success"
                      startIcon={<VideoCall />}
                      onClick={() => joinConsultation(consultation.id)}
                    >
                      Join Video Call
                    </Button>
                  ) : consultation.status === 'in-progress' ? (
                    <Button 
                      variant="contained" 
                      color="primary"
                      startIcon={<VideoCall />}
                      onClick={() => joinConsultation(consultation.id)}
                    >
                      Rejoin Call
                    </Button>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      {consultation.status === 'completed' ? 'Completed' : 
                       consultation.status === 'cancelled' ? 'Cancelled' : 
                       consultation.status === 'declined' ? 'Declined by Doctor' :
                       consultation.status === 'scheduled' ? 'Waiting for Doctor Approval' :
                       'Not available'}
                    </Typography>
                  )}
                </Box>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
}