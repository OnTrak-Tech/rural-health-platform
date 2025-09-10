import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, List, ListItem, ListItemText, Button, Chip, Alert } from '@mui/material';
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
      case 'in-progress': return 'success';
      case 'completed': return 'default';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const canJoin = (consultation) => {
    const now = new Date();
    const consultDate = new Date(consultation.date);
    const timeDiff = consultDate.getTime() - now.getTime();
    const minutesDiff = timeDiff / (1000 * 60);
    
    // Can join 15 minutes before scheduled time
    return consultation.status === 'scheduled' && minutesDiff <= 15 && minutesDiff >= -60;
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
                  {canJoin(consultation) ? (
                    <Button 
                      variant="contained" 
                      color="success"
                      onClick={() => joinConsultation(consultation.id)}
                    >
                      Join Now
                    </Button>
                  ) : consultation.status === 'in-progress' ? (
                    <Button 
                      variant="contained" 
                      color="primary"
                      onClick={() => joinConsultation(consultation.id)}
                    >
                      Rejoin
                    </Button>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      {consultation.status === 'completed' ? 'Completed' : 
                       consultation.status === 'cancelled' ? 'Cancelled' : 
                       'Not yet available'}
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