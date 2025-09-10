import React, { useState, useEffect } from 'react';
import {
  Grid, Paper, Typography, Card, CardContent, Box, List, ListItem, ListItemText,
  Chip, Button, CircularProgress, Alert
} from '@mui/material';
import {
  People, LocalHospital, VideoCall, FileUpload, TrendingUp, Security,
  CheckCircle, Pending, Cancel, Assessment
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import api from '../api';

function AdminDashboard({ user }) {
  const [metrics, setMetrics] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [metricsRes, activityRes] = await Promise.all([
        api.get('/admin/dashboard/metrics'),
        api.get('/admin/dashboard/recent-activity')
      ]);
      setMetrics(metricsRes.data);
      setRecentActivity(activityRes.data);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const MetricCard = ({ title, value, icon, color = "primary", subtitle }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box color={`${color}.main`}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        Welcome back, {user.name || user.email}
      </Typography>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Users"
            value={metrics.userMetrics.totalUsers}
            icon={<People fontSize="large" />}
            subtitle={`${metrics.userMetrics.activeUsers} active`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Doctors"
            value={metrics.userMetrics.totalDoctors}
            icon={<LocalHospital fontSize="large" />}
            color="success"
            subtitle={`${metrics.doctorVerification.verified} verified`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Consultations"
            value={metrics.consultationMetrics.total}
            icon={<VideoCall fontSize="large" />}
            color="info"
            subtitle={`${metrics.consultationMetrics.completed} completed`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Medical Files"
            value={metrics.fileMetrics.totalFiles}
            icon={<FileUpload fontSize="large" />}
            color="warning"
            subtitle={`${metrics.fileMetrics.ocrSuccessRate}% OCR success`}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Doctor Verification Status */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <Security sx={{ mr: 1 }} />
              <Typography variant="h6">Doctor Verification</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <Pending color="warning" />
                  <Typography variant="h5">{metrics.doctorVerification.pending}</Typography>
                  <Typography variant="body2">Pending</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <CheckCircle color="success" />
                  <Typography variant="h5">{metrics.doctorVerification.verified}</Typography>
                  <Typography variant="body2">Verified</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <Cancel color="error" />
                  <Typography variant="h5">{metrics.doctorVerification.rejected}</Typography>
                  <Typography variant="body2">Rejected</Typography>
                </Box>
              </Grid>
            </Grid>
            <Box mt={2}>
              <Button
                component={Link}
                to="/admin/pending-doctors"
                variant="outlined"
                fullWidth
                disabled={metrics.doctorVerification.pending === 0}
              >
                Review Pending Doctors ({metrics.doctorVerification.pending})
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Recent Activity Growth */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <TrendingUp sx={{ mr: 1 }} />
              <Typography variant="h6">Recent Activity (7 days)</Typography>
            </Box>
            <Box mb={2}>
              <Typography variant="body2" color="textSecondary">New Users</Typography>
              <Typography variant="h5">{metrics.recentActivity.newUsers}</Typography>
            </Box>
            <Box mb={2}>
              <Typography variant="body2" color="textSecondary">New Consultations</Typography>
              <Typography variant="h5">{metrics.recentActivity.newConsultations}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="textSecondary">Files Uploaded</Typography>
              <Typography variant="h5">{metrics.recentActivity.newFiles}</Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Quick Actions</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Button
                  component={Link}
                  to="/admin/register-patient"
                  variant="contained"
                  fullWidth
                  startIcon={<People />}
                >
                  Register Health Practitioner
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Button
                  component={Link}
                  to="/admin/register-doctor"
                  variant="contained"
                  color="success"
                  fullWidth
                  startIcon={<LocalHospital />}
                >
                  Register Doctor
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Button
                  component={Link}
                  to="/admin/pending-doctors"
                  variant="outlined"
                  fullWidth
                  startIcon={<Assessment />}
                >
                  Review Applications
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Recent System Activity */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Recent System Activity</Typography>
            <List dense>
              {recentActivity.slice(0, 5).map((activity) => (
                <ListItem key={activity.id} divider>
                  <ListItemText
                    primary={activity.action.replace(/_/g, ' ').toLowerCase()}
                    secondary={`${activity.user} • ${new Date(activity.timestamp).toLocaleString()}`}
                  />
                  <Chip
                    size="small"
                    label={activity.action.split('_')[0]}
                    color={
                      activity.action.includes('SUCCESS') ? 'success' :
                      activity.action.includes('FAILED') ? 'error' : 'default'
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* System Status */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>System Status</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Box textAlign="center">
                  <Chip label={metrics.systemStatus.status} color="success" />
                  <Typography variant="body2" sx={{ mt: 1 }}>Platform Status</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box textAlign="center">
                  <Typography variant="h6">{metrics.systemStatus.uptime}</Typography>
                  <Typography variant="body2">Uptime</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box textAlign="center">
                  <Typography variant="body2">
                    Last Updated: {new Date(metrics.systemStatus.lastUpdated).toLocaleString()}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default AdminDashboard;