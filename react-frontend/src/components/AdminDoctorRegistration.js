import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Divider
} from '@mui/material';
import { CloudUpload, Security, VerifiedUser } from '@mui/icons-material';
import api from '../api';

const SPECIALIZATIONS = [
  'Cardiology', 'Dermatology', 'Emergency Medicine', 'Family Medicine',
  'Internal Medicine', 'Neurology', 'Oncology', 'Pediatrics', 'Psychiatry',
  'Radiology', 'Surgery', 'Telemedicine', 'Other'
];

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

function AdminDoctorRegistration({ user }) {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    // Personal Information
    email: '',
    password: '',
    full_name: '',
    phone: '',
    
    // Professional Identity
    medical_license: '',
    dea_number: '',
    npi_number: '',
    state_license: '',
    
    // Professional Details
    primary_specialization: '',
    sub_specializations: [],
    medical_school: '',
    graduation_year: new Date().getFullYear() - 5,
    years_of_practice: 0,
    board_certifications: [],
    
    // Practice Information
    hospital_affiliations: [],
    practice_address: '',
    telemedicine_states: []
  });

  const [documents, setDocuments] = useState({
    license_document: null,
    certification_documents: []
  });

  const steps = [
    'Personal Information',
    'Professional Credentials', 
    'Practice Details',
    'Document Upload',
    'Review & Submit'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };


  const handleFileUpload = (field, files) => {
    if (field === 'certification_documents') {
      setDocuments(prev => ({
        ...prev,
        [field]: Array.from(files)
      }));
    } else {
      setDocuments(prev => ({
        ...prev,
        [field]: files[0]
      }));
    }
  };

  const validateStep = (step) => {
    switch (step) {
      case 0:
        return formData.email && formData.password && formData.full_name && formData.phone;
      case 1:
        return formData.medical_license && formData.npi_number && formData.state_license;
      case 2:
        return formData.primary_specialization && formData.medical_school && 
               formData.practice_address && formData.telemedicine_states.length > 0;
      case 3:
        return documents.license_document && documents.certification_documents.length > 0;
      default:
        return true;
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

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const submitData = new FormData();
      
      // Add form data
      Object.keys(formData).forEach(key => {
        if (Array.isArray(formData[key])) {
          submitData.append(key, formData[key].join(','));
        } else {
          submitData.append(key, formData[key]);
        }
      });

      // Add documents
      if (documents.license_document) {
        submitData.append('license_document', documents.license_document);
      }
      
      documents.certification_documents.forEach(doc => {
        submitData.append('certification_documents', doc);
      });

      await api.post('/admin/register/doctor', submitData);

      setSuccess('Doctor registration submitted successfully for verification');
      // Reset form
      setFormData({
        email: '', password: '', full_name: '', phone: '',
        medical_license: '', dea_number: '', npi_number: '', state_license: '',
        primary_specialization: '', sub_specializations: [], medical_school: '',
        graduation_year: new Date().getFullYear() - 5, years_of_practice: 0,
        board_certifications: [], hospital_affiliations: [], practice_address: '',
        telemedicine_states: []
      });
      setDocuments({ license_document: null, certification_documents: [] });
      setActiveStep(0);
    } catch (err) {
      setError('Network error. Please try again.');
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
              <TextField
                fullWidth
                label="Professional Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                helperText="Preferably institutional email (.edu, .org, hospital domain)"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Secure Password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
                helperText="Minimum 8 characters"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Full Legal Name"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                required
                helperText="Must match medical license"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                required
                helperText="Will be verified via SMS"
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Medical License Number"
                value={formData.medical_license}
                onChange={(e) => handleInputChange('medical_license', e.target.value)}
                required
                InputProps={{ startAdornment: <Security sx={{ mr: 1, color: 'primary.main' }} /> }}
                helperText="State medical license number"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="NPI Number"
                value={formData.npi_number}
                onChange={(e) => handleInputChange('npi_number', e.target.value)}
                required
                inputProps={{ pattern: '[0-9]{10}' }}
                helperText="10-digit National Provider Identifier"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="DEA Number (Optional)"
                value={formData.dea_number}
                onChange={(e) => handleInputChange('dea_number', e.target.value)}
                inputProps={{ pattern: '[A-Z]{2}[0-9]{7}' }}
                helperText="Required for prescribing controlled substances"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="State License Number"
                value={formData.state_license}
                onChange={(e) => handleInputChange('state_license', e.target.value)}
                required
                helperText="Primary state medical license"
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Primary Specialization</InputLabel>
                <Select
                  value={formData.primary_specialization}
                  onChange={(e) => handleInputChange('primary_specialization', e.target.value)}
                >
                  {SPECIALIZATIONS.map(spec => (
                    <MenuItem key={spec} value={spec}>{spec}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Medical School"
                value={formData.medical_school}
                onChange={(e) => handleInputChange('medical_school', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Graduation Year"
                type="number"
                value={formData.graduation_year}
                onChange={(e) => handleInputChange('graduation_year', parseInt(e.target.value))}
                required
                inputProps={{ min: 1950, max: new Date().getFullYear() }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Years of Practice"
                type="number"
                value={formData.years_of_practice}
                onChange={(e) => handleInputChange('years_of_practice', parseInt(e.target.value))}
                required
                inputProps={{ min: 0, max: 60 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Practice Address"
                multiline
                rows={2}
                value={formData.practice_address}
                onChange={(e) => handleInputChange('practice_address', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Telemedicine Licensed States</InputLabel>
                <Select
                  multiple
                  value={formData.telemedicine_states}
                  onChange={(e) => handleInputChange('telemedicine_states', e.target.value)}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {US_STATES.map(state => (
                    <MenuItem key={state} value={state}>{state}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <VerifiedUser sx={{ mr: 1, verticalAlign: 'middle' }} />
                  All documents will be encrypted and securely stored. Only authorized administrators can access them for verification.
                </Typography>
              </Alert>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, border: '2px dashed #ccc' }}>
                <Typography variant="h6" gutterBottom>
                  Medical License Document *
                </Typography>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload('license_document', e.target.files)}
                  style={{ display: 'none' }}
                  id="license-upload"
                />
                <label htmlFor="license-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUpload />}
                    fullWidth
                  >
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
                <Typography variant="h6" gutterBottom>
                  Board Certifications *
                </Typography>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  onChange={(e) => handleFileUpload('certification_documents', e.target.files)}
                  style={{ display: 'none' }}
                  id="cert-upload"
                />
                <label htmlFor="cert-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUpload />}
                    fullWidth
                  >
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
            <Typography variant="h6" gutterBottom>Review Registration Details</Typography>
            <Divider sx={{ my: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Personal Information</Typography>
                <Typography variant="body2">Name: {formData.full_name}</Typography>
                <Typography variant="body2">Email: {formData.email}</Typography>
                <Typography variant="body2">Phone: {formData.phone}</Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Professional Credentials</Typography>
                <Typography variant="body2">License: {formData.medical_license}</Typography>
                <Typography variant="body2">NPI: {formData.npi_number}</Typography>
                <Typography variant="body2">Specialization: {formData.primary_specialization}</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2">Documents</Typography>
                <Typography variant="body2">
                  License Document: {documents.license_document?.name}
                </Typography>
                <Typography variant="body2">
                  Certifications: {documents.certification_documents.length} files
                </Typography>
              </Grid>
            </Grid>
            
            <Alert severity="warning" sx={{ mt: 2 }}>
              By submitting this registration, you confirm that all information is accurate and 
              all documents are authentic. False information may result in rejection and potential 
              legal consequences.
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          <Security sx={{ mr: 2, verticalAlign: 'middle' }} />
          Secure Doctor Registration
        </Typography>
        
        <Typography variant="body1" align="center" sx={{ mb: 4, color: 'text.secondary' }}>
          Admin-only secure registration for medical professionals
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
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Back
          </Button>
          
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <VerifiedUser />}
            >
              {loading ? 'Submitting...' : 'Submit Registration'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!validateStep(activeStep)}
            >
              Next
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

export default AdminDoctorRegistration;