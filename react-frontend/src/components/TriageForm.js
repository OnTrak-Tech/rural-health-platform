import React, { useState } from 'react';
import { Box, Paper, TextField, Button, Typography, Grid, Alert, FormControlLabel, Checkbox } from '@mui/material';

const API_BASE = (process.env.REACT_APP_API_BASE || 'http://localhost:8000') + '/api';

export default function TriageForm() {
  const [symptoms, setSymptoms] = useState('');
  const [vitals, setVitals] = useState({ heartRate: '', spo2: '', systolic: '', diastolic: '', temperature: '', respRate: '', age: '' });
  const [flags, setFlags] = useState({ chestPain: false, consciousnessAltered: false, pregnancy: false });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    const token = localStorage.getItem('token');
    const vitalsPayload = Object.fromEntries(
      Object.entries({ ...vitals, ...flags })
        .filter(([_, v]) => v !== '' && v !== null && v !== undefined)
        .map(([k, v]) => [k, typeof v === 'string' ? (isNaN(Number(v)) ? v : Number(v)) : v])
    );

    try {
      const res = await fetch(`${API_BASE}/triage/assess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          symptoms: symptoms.split(',').map(s => s.trim()).filter(Boolean),
          vitals: Object.keys(vitalsPayload).length ? vitalsPayload : undefined
        })
      });
      if (!res.ok) throw new Error((await res.text()) || 'Assessment failed');
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 2 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>AI-assisted Triage</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={submit}>
          <TextField
            fullWidth
            label="Symptoms (comma-separated)"
            placeholder="chest pain, shortness of breath"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}><TextField fullWidth label="Heart Rate" value={vitals.heartRate} onChange={e=>setVitals(v=>({...v, heartRate:e.target.value}))}/></Grid>
            <Grid item xs={6} md={3}><TextField fullWidth label="SpO2 %" value={vitals.spo2} onChange={e=>setVitals(v=>({...v, spo2:e.target.value}))}/></Grid>
            <Grid item xs={6} md={3}><TextField fullWidth label="Systolic" value={vitals.systolic} onChange={e=>setVitals(v=>({...v, systolic:e.target.value}))}/></Grid>
            <Grid item xs={6} md={3}><TextField fullWidth label="Diastolic" value={vitals.diastolic} onChange={e=>setVitals(v=>({...v, diastolic:e.target.value}))}/></Grid>
            <Grid item xs={6} md={3}><TextField fullWidth label="Temperature °C" value={vitals.temperature} onChange={e=>setVitals(v=>({...v, temperature:e.target.value}))}/></Grid>
            <Grid item xs={6} md={3}><TextField fullWidth label="Resp Rate" value={vitals.respRate} onChange={e=>setVitals(v=>({...v, respRate:e.target.value}))}/></Grid>
            <Grid item xs={6} md={3}><TextField fullWidth label="Age" value={vitals.age} onChange={e=>setVitals(v=>({...v, age:e.target.value}))}/></Grid>
          </Grid>
          <Box sx={{ mt: 2 }}>
            <FormControlLabel control={<Checkbox checked={flags.chestPain} onChange={e=>setFlags(f=>({...f, chestPain:e.target.checked}))}/>} label="Chest Pain" />
            <FormControlLabel control={<Checkbox checked={flags.consciousnessAltered} onChange={e=>setFlags(f=>({...f, consciousnessAltered:e.target.checked}))}/>} label="Altered Consciousness" />
            <FormControlLabel control={<Checkbox checked={flags.pregnancy} onChange={e=>setFlags(f=>({...f, pregnancy:e.target.checked}))}/>} label="Pregnancy" />
          </Box>
          <Button type="submit" variant="contained" sx={{ mt: 2 }} disabled={loading}>
            {loading ? 'Assessing...' : 'Assess'}
          </Button>
        </Box>
        {result && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1">Urgency: <strong>{result.urgency}</strong></Typography>
            <Typography variant="subtitle1">Recommended specialty: <strong>{result.recommendedSpecialty}</strong></Typography>
            {!!(result.reasons||[]).length && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2">Reasons:</Typography>
                <ul>
                  {result.reasons.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
}

