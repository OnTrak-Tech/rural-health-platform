import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, List, ListItem, ListItemText, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert } from '@mui/material';

const API_BASE = (process.env.REACT_APP_API_BASE || 'http://localhost:8000') + '/api';

export default function AdminPendingDoctors() {
  const [list, setList] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchPending = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/admin/doctors/pending`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error((await res.text()) || 'Failed to load');
      setList(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const approve = async (id) => {
    setError(''); setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/admin/doctors/${id}/approve`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error((await res.text()) || 'Approve failed');
      setSuccess('Doctor approved');
      fetchPending();
    } catch (e) {
      setError(e.message);
    }
  };

  const openReject = (id) => { setRejectId(id); setRejectReason(''); };
  const closeReject = () => { setRejectId(null); setRejectReason(''); };

  const doReject = async () => {
    setError(''); setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const form = new FormData();
      form.append('reason', rejectReason);
      const res = await fetch(`${API_BASE}/admin/doctors/${rejectId}/reject`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
      if (!res.ok) throw new Error((await res.text()) || 'Reject failed');
      setSuccess('Doctor rejected');
      closeReject();
      fetchPending();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 2 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>Pending Doctors</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <List>
          {list.map((d) => (
            <ListItem key={d.id} divider secondaryAction={
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" variant="contained" onClick={() => approve(d.id)}>Approve</Button>
                <Button size="small" variant="outlined" color="error" onClick={() => openReject(d.id)}>Reject</Button>
              </Box>
            }>
              <ListItemText
                primary={`${d.name} — ${d.specialization}`}
                secondary={`Email: ${d.email} · Years: ${d.years_of_practice || 0} · Submitted: ${d.submitted_at}`}
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      <Dialog open={!!rejectId} onClose={closeReject}>
        <DialogTitle>Reject Doctor</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth label="Reason" value={rejectReason} onChange={e=>setRejectReason(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeReject}>Cancel</Button>
          <Button onClick={doReject} variant="contained" color="error" disabled={!rejectReason}>Reject</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

