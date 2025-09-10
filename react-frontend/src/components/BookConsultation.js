import React, { useState } from 'react';
import { Box, Paper, TextField, Button, Typography, Grid, Alert, Chip } from '@mui/material';
import MatchSpecialist from './MatchSpecialist';
import { queueConsultation } from '../offlineQueue';
import { getToken } from '../authToken';

const API_BASE = (process.env.REACT_APP_API_BASE || 'http://localhost:8000') + '/api';

export default function BookConsultation() {
  const [form, setForm] = useState({ 
    date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // Tomorrow at current time
    symptoms: '' 
  });
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [queued, setQueued] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setQueued(false);
    setSuccess('');
    setError('');
    
    // Validate required fields
    if (!form.date) {
      setError('Date/Time is required');
      return;
    }
    if (!form.symptoms.trim()) {
      setError('Symptoms are required');
      return;
    }
    if (!selectedDoctor) {
      setError('Please select a doctor');
      return;
    }
    
    const payload = {
      doctorId: selectedDoctor.id,
      date: new Date(form.date).toISOString(),
      symptoms: form.symptoms
    };
    if (!navigator.onLine) {
      queueConsultation({ ...payload, specialization: selectedDoctor?.specialization });
      setQueued(true);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/consultations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error((await res.text()) || 'Booking failed');
      const data = await res.json();
      setSuccess(`Consultation booked (id: ${data.id})`);
    } catch (e) {
      // Fallback to offline queue
      queueConsultation({ ...payload, specialization: selectedDoctor?.specialization });
      setQueued(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 2 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>Book Consultation (Offline-capable)</Typography>
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        {queued && <Alert severity="info" sx={{ mb: 2 }}>No network detected. Consultation queued and will sync automatically when online.</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={submit}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField 
                fullWidth 
                label="Consultation Date & Time" 
                type="datetime-local"
                value={form.date} 
                onChange={e=>setForm(f=>({...f, date:e.target.value}))}
                required
                error={!form.date}
                helperText={!form.date ? 'Date/Time is required' : 'Select your preferred consultation time'}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField 
                fullWidth 
                label="Symptoms" 
                placeholder="fever, cough" 
                value={form.symptoms} 
                onChange={e=>setForm(f=>({...f, symptoms:e.target.value}))}
                required
                error={!form.symptoms.trim()}
                helperText={!form.symptoms.trim() ? 'Symptoms are required' : ''}
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Matched Specialist</Typography>
            {selectedDoctor ? (
              <Chip label={`${selectedDoctor.name} — ${selectedDoctor.specialization}`} onDelete={() => setSelectedDoctor(null)} />
            ) : (
              <Typography variant="body2" color="text.secondary">No doctor selected</Typography>
            )}
          </Box>
          <Box sx={{ mt: 2 }}>
            <MatchSpecialist onSelect={setSelectedDoctor} />
          </Box>
          <Button 
            type="submit" 
            variant="contained" 
            sx={{ mt: 2 }} 
            disabled={loading}
          >
            {loading ? 'Booking...' : 'Book Consultation'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
