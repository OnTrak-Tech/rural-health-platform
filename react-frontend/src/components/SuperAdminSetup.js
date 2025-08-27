import React, { useState } from 'react';
import { Container, Paper, TextField, Button, Typography, Alert } from '@mui/material';
import api from '../api';

const SuperAdminSetup = () => {
  const [formData, setFormData] = useState({
    setup_key: '',
    email: '',
    password: '',
    name: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const fd = new FormData();
      fd.set('setup_key', formData.setup_key);
      fd.set('email', formData.email);
      fd.set('password', formData.password);
      fd.set('name', formData.name);

      await api.post('/auth/setup/super-admin', fd);
      setMessage('Super admin created successfully! You can now login.');
    } catch (err) {
      const detail = err?.response?.data?.detail || err.message || 'Setup failed';
      setError(detail);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>Super Admin Setup</Typography>
        
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Setup Key"
            type="password"
            value={formData.setup_key}
            onChange={(e) => setFormData({...formData, setup_key: e.target.value})}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            margin="normal"
            required
          />
          <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
            Create Super Admin
          </Button>
        </form>
      </Paper>
    </Container>
  );
};

export default SuperAdminSetup;
