import React, { useState, useEffect, useRef } from 'react';
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
  Alert
} from '@mui/material';
import { Person, VideoCall, FileUpload, LocalHospital } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function HealthPractitionerDashboard({ user }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
    fetchConsultations();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/patients/profile');
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const fetchConsultations = async () => {
    try {
      const response = await api.get('/patients/consultations');
      setConsultations(response.data);
    } catch (error) {
      console.error('Failed to fetch consultations:', error);
    }
  };

  const bookConsultation = () => {
    navigate('/book');
  };

  const handleUploadClick = () => {
    setUploadError('');
    setUploadSuccess('');
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!profile?.patientId) {
      setUploadError('Cannot determine patient ID. Please refresh and try again.');
      return;
    }
    setUploading(true);
    setUploadError('');
    setUploadSuccess('');
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('patientId', String(profile.patientId));
      if (profile.hospitalId) {
        form.append('hospitalId', String(profile.hospitalId));
      }
      form.append('type', 'general');
      const res = await api.post('/files/upload', form);
      if (res?.data?.id) {
        const ocrInfo = res.data.hasOcr ? ' (Text extracted)' : '';
        setUploadSuccess(`Uploaded ${file.name} successfully${ocrInfo}`);
        if (res.data.ocrText) {
          console.log('OCR Text:', res.data.ocrText.substring(0, 200) + '...');
        }
      } else {
        setUploadSuccess('File uploaded');
      }
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message || 'Upload failed';
      setUploadError(msg);
    } finally {
      setUploading(false);
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
              <Typography variant="h6">Health Practitioner Profile</Typography>
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
            {uploadSuccess && <Alert severity="success" sx={{ mb: 2 }}>{uploadSuccess}</Alert>}
            {uploadError && <Alert severity="error" sx={{ mb: 2 }}>{uploadError}</Alert>}
            <Button
              variant="contained"
              startIcon={<VideoCall />}
              fullWidth
              sx={{ mb: 2 }}
              onClick={bookConsultation}
            >
              Book Video Consultation
            </Button>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf,.dcm"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <Button
              variant="outlined"
              startIcon={<FileUpload />}
              fullWidth
              onClick={handleUploadClick}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload Medical Files'}
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

export default HealthPractitionerDashboard;