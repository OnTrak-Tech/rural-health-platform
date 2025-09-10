import React, { useState, useEffect } from 'react';
import {
  Grid, Paper, Typography, Card, CardContent, Box, Alert, Button, List, ListItem, ListItemText,
  ListItemIcon, Chip, LinearProgress
} from '@mui/material';
import {
  HourglassEmpty, CheckCircle, Upload, School, LocalHospital, Phone, Email,
  Description, Timeline, Support
} from '@mui/icons-material';
import api from '../api';

function PendingDoctorDashboard({ user }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      // This would fetch doctor profile with verification status
      // For now, we'll simulate the data
      setProfile({
        verification_status: 'pending',
        submitted_at: new Date().toISOString(),
        estimated_review_days: 3,
        documents_uploaded: 2,
        required_documents: 2
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'verified': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <HourglassEmpty />;
      case 'verified': return <CheckCircle />;
      default: return <HourglassEmpty />;
    }
  };

  if (loading) {
    return <Box sx={{ p: 3 }}><LinearProgress /></Box>;
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Status Banner */}
      <Alert 
        severity={getStatusColor(profile.verification_status)} 
        icon={getStatusIcon(profile.verification_status)}
        sx={{ mb: 3, fontSize: '1.1rem' }}
      >
        <Typography variant="h6" component="div">
          Account Pending Verification
        </Typography>
        <Typography variant="body2">
          Your application is under review by our medical team. You'll receive an email notification once approved.
          <br />
          <strong>Estimated review time: {profile.estimated_review_days} business days</strong>
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {/* Verification Progress */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <Timeline sx={{ mr: 1, verticalAlign: 'middle' }} />
              Verification Progress
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary="Application Submitted" 
                  secondary={`Submitted on ${new Date(profile.submitted_at).toLocaleDateString()}`}
                />
                <Chip label="Complete" color="success" size="small" />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary="Documents Uploaded" 
                  secondary={`${profile.documents_uploaded}/${profile.required_documents} required documents`}
                />
                <Chip label="Complete" color="success" size="small" />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <HourglassEmpty color="warning" />
                </ListItemIcon>
                <ListItemText 
                  primary="Credential Verification" 
                  secondary="Our team is verifying your medical license and certifications"
                />
                <Chip label="In Progress" color="warning" size="small" />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <HourglassEmpty color="disabled" />
                </ListItemIcon>
                <ListItemText 
                  primary="Final Approval" 
                  secondary="Admin review and account activation"
                />
                <Chip label="Pending" color="default" size="small" />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Quick Info */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              <LocalHospital sx={{ mr: 1, verticalAlign: 'middle' }} />
              Your Application
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">Status</Typography>
              <Chip 
                label={profile.verification_status.toUpperCase()} 
                color={getStatusColor(profile.verification_status)}
                icon={getStatusIcon(profile.verification_status)}
              />
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">Submitted</Typography>
              <Typography variant="body1">
                {new Date(profile.submitted_at).toLocaleDateString()}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="textSecondary">Application ID</Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                DOC-{user.id.toString().padStart(6, '0')}
              </Typography>
            </Box>
          </Paper>

          {/* Support Card */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <Support sx={{ mr: 1, verticalAlign: 'middle' }} />
              Need Help?
            </Typography>
            
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <Email fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary="Email Support" 
                  secondary="support@healthcare.com"
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <Phone fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary="Phone Support" 
                  secondary="1-800-HEALTH-1"
                />
              </ListItem>
            </List>
            
            <Button variant="outlined" fullWidth sx={{ mt: 2 }}>
              Contact Support
            </Button>
          </Paper>
        </Grid>

        {/* What's Next */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              What Happens Next?
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom>
                      <Description sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Document Review
                    </Typography>
                    <Typography variant="body2">
                      Our medical team will verify your license, certifications, and credentials with state medical boards.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom>
                      <School sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Background Check
                    </Typography>
                    <Typography variant="body2">
                      We'll verify your medical education, training history, and professional references.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom>
                      <CheckCircle sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Account Activation
                    </Typography>
                    <Typography variant="body2">
                      Once approved, you'll receive an email and can start providing telemedicine services.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default PendingDoctorDashboard;