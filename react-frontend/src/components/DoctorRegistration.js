import React, { useState } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Grid, FormControl, InputLabel, Select, MenuItem,
  Alert, CircularProgress, Stepper, Step, StepLabel, Divider
} from '@mui/material';
import { CloudUpload, LocalHospital, VerifiedUser } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const SPECIALIZATIONS = [
  'Cardiology', 'Dermatology', 'Emergency Medicine', 'Family Medicine',
  'Internal Medicine', 'Neurology', 'Oncology', 'Pediatrics', 'Psychiatry',
  'Radiology', 'Surgery', 'Telemedicine', 'Other'
];

function DoctorRegistration() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    email: '', password: '', full_name: '', phone: '',
    medical_license: '', npi_number: '', primary_specialization: '',
    medical_school: '', graduation_year: new Date().getFullYear() - 5,
    years_of_practice: 0, practice_address: '', telemedicine_states: ''
  });

  const [documents, setDocuments] = useState({
    license_document: null,
    certification_documents: []
  });

  const steps = ['Personal Info', 'Credentials', 'Practice Details', 'Documents', 'Submit'];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (field, files) => {
    if (field === 'certification_documents') {
      setDocuments(prev => ({ ...prev, [field]: Array.from(files) }));
    } else {
      setDocuments(prev => ({ ...prev, [field]: files[0] }));
    }
  };

  const validateStep = (step) => {
    switch (step) {
      case 0: return formData.email && formData.password && formData.full_name && formData.phone;
      case 1: return formData.medical_license && formData.npi_number;
      case 2: return formData.primary_specialization && formData.medical_school && formData.practice_address && formData.telemedicine_states;
      case 3: return documents.license_document && documents.certification_documents.length > 0;
      default: return true;
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
      setError('');
    } else {
      setError('Please fill in all required fields');
    }
  };

  const handleBack = () => setActiveStep(prev => prev - 1);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });

      if (documents.license_document) {
        submitData.append('license_document', documents.license_document);
      }
      
      documents.certification_documents.forEach(doc => {
        submitData.append('certification_documents', doc);
      });

      const response = await api.post('/auth/register/doctor', submitData);
      
      setSuccess('Registration successful! You can now login to your account.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Professional Email" type="email" value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)} required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Password" type="password" value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)} required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Full Name" value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)} required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Phone Number" value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)} required />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Medical License Number" value={formData.medical_license}
                onChange={(e) => handleInputChange('medical_license', e.target.value)} required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="NPI Number" value={formData.npi_number}
                onChange={(e) => handleInputChange('npi_number', e.target.value)} required />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Primary Specialization</InputLabel>
                <Select value={formData.primary_specialization}
                  onChange={(e) => handleInputChange('primary_specialization', e.target.value)}>
                  {SPECIALIZATIONS.map(spec => (
                    <MenuItem key={spec} value={spec}>{spec}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Medical School" value={formData.medical_school}
                onChange={(e) => handleInputChange('medical_school', e.target.value)} required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Graduation Year" type="number" value={formData.graduation_year}
                onChange={(e) => handleInputChange('graduation_year', parseInt(e.target.value))} required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Years of Practice" type="number" value={formData.years_of_practice}
                onChange={(e) => handleInputChange('years_of_practice', parseInt(e.target.value))} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Practice Address" multiline rows={2} value={formData.practice_address}
                onChange={(e) => handleInputChange('practice_address', e.target.value)} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Telemedicine Licensed States" value={formData.telemedicine_states}
                onChange={(e) => handleInputChange('telemedicine_states', e.target.value)} required
                helperText="Enter state codes separated by commas (e.g., CA, NY, TX)" />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, border: '2px dashed #ccc' }}>
                <Typography variant="h6" gutterBottom>Medical License Document *</Typography>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileUpload('license_document', e.target.files)}
                  style={{ display: 'none' }} id="license-upload" />
                <label htmlFor="license-upload">
                  <Button variant="outlined" component="span" startIcon={<CloudUpload />} fullWidth>
                    Upload License Document
                  </Button>
                </label>
                {documents.license_document && (
                  <Typography variant="body2" sx={{ mt: 1, color: 'success.main' }}>
                    ✓ {documents.license_document.name}
                  </Typography>
                )}
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, border: '2px dashed #ccc' }}>
                <Typography variant="h6" gutterBottom>Board Certifications *</Typography>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" multiple onChange={(e) => handleFileUpload('certification_documents', e.target.files)}
                  style={{ display: 'none' }} id="cert-upload" />
                <label htmlFor="cert-upload">
                  <Button variant="outlined" component="span" startIcon={<CloudUpload />} fullWidth>
                    Upload Certifications
                  </Button>
                </label>
                {documents.certification_documents.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    {documents.certification_documents.map((doc, index) => (
                      <Typography key={index} variant="body2" sx={{ color: 'success.main' }}>
                        ✓ {doc.name}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        );

      case 4:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Review Your Application</Typography>
            <Divider sx={{ my: 2 }} />
            <Alert severity="info" sx={{ mb: 2 }}>
              Your application will be reviewed by our medical team. You'll receive an email notification once approved.
              Estimated review time: 2-3 business days.
            </Alert>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Personal Information</Typography>
                <Typography variant="body2">Name: {formData.full_name}</Typography>
                <Typography variant="body2">Email: {formData.email}</Typography>
                <Typography variant="body2">Phone: {formData.phone}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Professional Details</Typography>
                <Typography variant="body2">License: {formData.medical_license}</Typography>
                <Typography variant="body2">NPI: {formData.npi_number}</Typography>
                <Typography variant="body2">Specialization: {formData.primary_specialization}</Typography>
              </Grid>
            </Grid>
          </Box>
        );

      default: return null;
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          <LocalHospital sx={{ mr: 2, verticalAlign: 'middle' }} />
          Join as a Doctor
        </Typography>
        
        <Typography variant="body1" align="center" sx={{ mb: 4, color: 'text.secondary' }}>
          Register to provide telemedicine services to rural communities
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box sx={{ mb: 4 }}>
          {renderStepContent(activeStep)}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button disabled={activeStep === 0} onClick={handleBack}>Back</Button>
          
          {activeStep === steps.length - 1 ? (
            <Button variant="contained" onClick={handleSubmit} disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <VerifiedUser />}>
              {loading ? 'Submitting...' : 'Submit Application'}
            </Button>
          ) : (
            <Button variant="contained" onClick={handleNext} disabled={!validateStep(activeStep)}>
              Next
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

export default DoctorRegistration;