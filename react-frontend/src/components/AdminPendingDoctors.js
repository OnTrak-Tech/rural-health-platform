import React, { useEffect, useState } from 'react';
import { 
  Box, Paper, Typography, List, ListItem, ListItemText, Button, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, Alert, Card, CardContent, Grid, Chip,
  IconButton, Collapse
} from '@mui/material';
import { ExpandMore, ExpandLess, Download, Visibility } from '@mui/icons-material';
import api from '../api';

export default function AdminPendingDoctors() {
  const [list, setList] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const fetchPending = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/doctors/pending');
      setList(res.data);
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
      await api.post(`/admin/doctors/${id}/approve`);
      setSuccess('Doctor approved successfully');
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
      const form = new FormData();
      form.append('reason', rejectReason);
      await api.post(`/admin/doctors/${rejectId}/reject`, form);
      setSuccess('Doctor application rejected');
      closeReject();
      fetchPending();
    } catch (e) {
      setError(e.message);
    }
  };

  const toggleExpanded = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const downloadDocument = (docPath, filename) => {
    const link = document.createElement('a');
    link.href = `${process.env.REACT_APP_API_BASE || 'http://localhost:8000'}/api/files/download/${docPath}`;
    link.download = filename;
    link.click();
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>Pending Doctor Verifications</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Review medical credentials and approve or reject doctor applications
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        
        {loading ? (
          <Typography>Loading pending applications...</Typography>
        ) : list.length === 0 ? (
          <Alert severity="info">No pending doctor applications</Alert>
        ) : (
          <List>
            {list.map((doctor) => (
              <ListItem key={doctor.id} sx={{ flexDirection: 'column', alignItems: 'stretch', mb: 2 }}>
                <Card sx={{ width: '100%' }}>
                  <CardContent>
                    {/* Basic Info */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box>
                        <Typography variant="h6">{doctor.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {doctor.email} • {doctor.specialization}
                        </Typography>
                        <Chip 
                          label={`${doctor.years_of_practice || 0} years experience`} 
                          size="small" 
                          sx={{ mt: 1 }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <IconButton onClick={() => toggleExpanded(doctor.id)}>
                          {expandedId === doctor.id ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                        <Button 
                          size="small" 
                          variant="contained" 
                          color="success"
                          onClick={() => approve(doctor.id)}
                        >
                          Approve
                        </Button>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          color="error" 
                          onClick={() => openReject(doctor.id)}
                        >
                          Reject
                        </Button>
                      </Box>
                    </Box>

                    {/* Expanded Details */}
                    <Collapse in={expandedId === doctor.id}>
                      <Grid container spacing={3} sx={{ mt: 1 }}>
                        {/* Professional Details */}
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" gutterBottom>Professional Information</Typography>
                          <Box sx={{ pl: 2 }}>
                            <Typography variant="body2"><strong>Medical School:</strong> {doctor.medical_school || 'Not provided'}</Typography>
                            <Typography variant="body2"><strong>Graduation Year:</strong> {doctor.graduation_year || 'Not provided'}</Typography>
                            <Typography variant="body2"><strong>License Number:</strong> {doctor.medical_license || 'Not provided'}</Typography>
                            <Typography variant="body2"><strong>DEA Number:</strong> {doctor.dea_number || 'Not provided'}</Typography>
                            <Typography variant="body2"><strong>NPI Number:</strong> {doctor.npi_number || 'Not provided'}</Typography>
                            <Typography variant="body2"><strong>State License:</strong> {doctor.state_license || 'Not provided'}</Typography>
                          </Box>
                        </Grid>

                        {/* Practice Information */}
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" gutterBottom>Practice Information</Typography>
                          <Box sx={{ pl: 2 }}>
                            <Typography variant="body2"><strong>Hospital Affiliations:</strong></Typography>
                            {doctor.hospital_affiliations && doctor.hospital_affiliations.length > 0 ? (
                              doctor.hospital_affiliations.map((hospital, idx) => (
                                <Typography key={idx} variant="body2" sx={{ pl: 2 }}>• {hospital}</Typography>
                              ))
                            ) : (
                              <Typography variant="body2" sx={{ pl: 2 }}>None provided</Typography>
                            )}
                            
                            <Typography variant="body2" sx={{ mt: 1 }}><strong>Board Certifications:</strong></Typography>
                            {doctor.board_certifications && doctor.board_certifications.length > 0 ? (
                              doctor.board_certifications.map((cert, idx) => (
                                <Typography key={idx} variant="body2" sx={{ pl: 2 }}>• {cert}</Typography>
                              ))
                            ) : (
                              <Typography variant="body2" sx={{ pl: 2 }}>None provided</Typography>
                            )}
                          </Box>
                        </Grid>

                        {/* Uploaded Documents */}
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" gutterBottom>Uploaded Documents</Typography>
                          <Box sx={{ pl: 2 }}>
                            {doctor.license_document_path ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Typography variant="body2">Medical License Document:</Typography>
                                <Button
                                  size="small"
                                  startIcon={<Download />}
                                  onClick={() => downloadDocument(doctor.license_document_path, 'medical_license.pdf')}
                                >
                                  Download
                                </Button>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="error">No license document uploaded</Typography>
                            )}
                            
                            {doctor.certification_documents && doctor.certification_documents.length > 0 ? (
                              <Box>
                                <Typography variant="body2">Certification Documents:</Typography>
                                {doctor.certification_documents.map((doc, idx) => (
                                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                                    <Typography variant="body2">Document {idx + 1}:</Typography>
                                    <Button
                                      size="small"
                                      startIcon={<Download />}
                                      onClick={() => downloadDocument(doc, `certification_${idx + 1}.pdf`)}
                                    >
                                      Download
                                    </Button>
                                  </Box>
                                ))}
                              </Box>
                            ) : (
                              <Typography variant="body2">No certification documents uploaded</Typography>
                            )}
                          </Box>
                        </Grid>

                        {/* Application Date */}
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Application submitted:</strong> {new Date(doctor.submitted_at).toLocaleString()}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Collapse>
                  </CardContent>
                </Card>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {/* Rejection Dialog */}
      <Dialog open={!!rejectId} onClose={closeReject} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Doctor Application</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please provide a reason for rejecting this application. This will be sent to the doctor.
          </Typography>
          <TextField 
            autoFocus 
            fullWidth 
            multiline
            rows={3}
            label="Rejection Reason" 
            value={rejectReason} 
            onChange={e => setRejectReason(e.target.value)}
            placeholder="e.g., Invalid license number, missing required documents..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeReject}>Cancel</Button>
          <Button 
            onClick={doReject} 
            variant="contained" 
            color="error" 
            disabled={!rejectReason.trim()}
          >
            Reject Application
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}