import React, { useState } from 'react';
import { Box, Paper, TextField, Button, Typography, Alert } from '@mui/material';

const API_BASE = (process.env.REACT_APP_API_BASE || 'http://localhost:8000') + '/api';

export default function AdminPatientRegistration() {
  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const body = new FormData();
      body.append('email', form.email);
      body.append('password', form.password);
      body.append('name', form.name);
      if (form.phone) body.append('phone', form.phone);

      const res = await fetch(`${API_BASE}/admin/register/patient`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Registration failed');
      }
      await res.json();
      setSuccess('Patient registered successfully');
      setForm({ email: '', password: '', name: '', phone: '' });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>Admin: Register Patient</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <Box component="form" onSubmit={submit}>
          <TextField fullWidth label="Patient Email" type="email" value={form.email} onChange={e=>setForm(f=>({...f, email:e.target.value}))} sx={{ mb: 2 }} required />
          <TextField fullWidth label="Password" type="password" value={form.password} onChange={e=>setForm(f=>({...f, password:e.target.value}))} sx={{ mb: 2 }} required />
          <TextField fullWidth label="Full Name" value={form.name} onChange={e=>setForm(f=>({...f, name:e.target.value}))} sx={{ mb: 2 }} required />
          <TextField fullWidth label="Phone (optional)" value={form.phone} onChange={e=>setForm(f=>({...f, phone:e.target.value}))} sx={{ mb: 2 }} />
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Registering...' : 'Register Patient'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

