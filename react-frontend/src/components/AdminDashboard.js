import React, { useState, useEffect } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton,
  ListItem, ListItemButton, ListItemIcon, ListItemText, CssBaseline,
  Grid, Card, CardContent, Paper, LinearProgress, Avatar, InputBase,
  Chip, Button, CircularProgress, Alert, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Badge, Menu as MenuComponent, MenuItem
} from '@mui/material';
import {
  Dashboard, People, LocalHospital, VideoCall, Assessment, Settings,
  Notifications, Search, Menu, AccountCircle, TrendingUp, Security,
  CheckCircle, Pending, Cancel, FileUpload, BarChart, PieChart, Logout
} from '@mui/icons-material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { clearToken, setUser } from '../authToken';
import api from '../api';

const drawerWidth = 280;

// Professional black/gray theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1f2937' }, // Dark gray
    secondary: { main: '#6b7280' }, // Medium gray
    info: { main: '#374151' }, // Darker gray
    background: {
      default: '#f9fafb',
      paper: '#ffffff'
    },
    text: {
      primary: '#111827',
      secondary: '#6b7280'
    }
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
          border: '1px solid #e5e7eb'
        }
      }
    }
  }
});

function AdminDashboard({ user }) {
  const [metrics, setMetrics] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

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
      // Provide default metrics if database query fails
      setMetrics({
        userMetrics: { totalUsers: 0, activeUsers: 0, totalDoctors: 0 },
        doctorVerification: { pending: 0, verified: 0, rejected: 0 },
        consultationMetrics: { total: 0, completed: 0 },
        fileMetrics: { totalFiles: 0, ocrSuccessRate: 0 },
        recentActivity: { newUsers: 0, newConsultations: 0, newFiles: 0 },
        systemStatus: { status: 'healthy', uptime: '99.9%', lastUpdated: new Date().toISOString() }
      });
      setError('Dashboard metrics unavailable - database schema update needed');
    } finally {
      setLoading(false);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    clearToken();
    setUser(null);
    window.location.href = '/login';
  };

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/admin', active: true },
    { text: 'User Management', icon: <People />, path: '/admin/users' },
    { text: 'Doctor Verification', icon: <LocalHospital />, path: '/admin/pending-doctors' },
    { text: 'Register Health Practitioner', icon: <People />, path: '/admin/register-patient' },
    { text: 'Register Doctor', icon: <LocalHospital />, path: '/admin/register-doctor' },
    { text: 'Analytics', icon: <Assessment />, path: '/admin/analytics' },
    { text: 'Settings', icon: <Settings />, path: '/admin/settings' }
  ];

  const MetricCard = ({ title, value, icon, gradient, subtitle, trend }) => (
    <Card sx={{ height: '100%', background: gradient }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
          <Box sx={{ color: 'white' }}>
            {icon}
          </Box>
        </Box>
        <Typography variant="h3" sx={{ color: 'white', fontWeight: 600, mb: 1 }}>
          {value}
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  const drawer = (
    <Box>
      <Box sx={{ p: 3, borderBottom: '1px solid #e5e7eb' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827' }}>
           Admin Dashboard
        </Typography>
      </Box>
      <List sx={{ px: 2, py: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={Link}
              to={item.path}
              sx={{
                borderRadius: 2,
                backgroundColor: item.active ? '#1f2937' : 'transparent',
                color: item.active ? 'white' : '#6b7280',
                '&:hover': {
                  backgroundColor: item.active ? '#374151' : '#f3f4f6'
                }
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box sx={{ position: 'absolute', bottom: 20, left: 16, right: 16 }}>
        <Card sx={{ background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)', color: 'white' }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>Dashboard Pro</Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>Advanced Analytics</Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  if (error) {
    return (
      <ThemeProvider theme={theme}>
        <Alert severity="error">{error}</Alert>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        <CssBaseline />
        
        {/* App Bar */}
        <AppBar
          position="fixed"
          sx={{
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
            bgcolor: 'white',
            color: 'text.primary',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <Menu />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
              
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Paper sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 300 }}>
                <IconButton sx={{ p: '10px' }}>
                  <Search />
                </IconButton>
                <InputBase placeholder="Search..." sx={{ ml: 1, flex: 1 }} />
              </Paper>
              <IconButton>
                <Badge badgeContent={4} color="default" sx={{ '& .MuiBadge-badge': { bgcolor: '#1f2937', color: 'white' } }}>
                  <Notifications />
                </Badge>
              </IconButton>
              <IconButton onClick={handleProfileMenuOpen}>
                <Avatar sx={{ bgcolor: '#1f2937' }}>
                  <AccountCircle />
                </Avatar>
              </IconButton>
              <MenuComponent
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleProfileMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <Logout fontSize="small" />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              </MenuComponent>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Sidebar */}
        <Box
          component="nav"
          sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
                borderRight: '1px solid #e5e7eb'
              }
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            mt: 10
          }}
        >
          {/* Key Metrics Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Total Users"
                value={metrics.userMetrics.totalUsers}
                icon={<People fontSize="large" />}
                gradient="linear-gradient(135deg, #1f2937 0%, #374151 100%)"
                subtitle={`${metrics.userMetrics.activeUsers} active`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Verified Doctors"
                value={metrics.doctorVerification.verified}
                icon={<LocalHospital fontSize="large" />}
                gradient="linear-gradient(135deg, #374151 0%, #4b5563 100%)"
                subtitle={`${metrics.doctorVerification.pending} pending`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Consultations"
                value={metrics.consultationMetrics.total}
                icon={<VideoCall fontSize="large" />}
                gradient="linear-gradient(135deg, #4b5563 0%, #6b7280 100%)"
                subtitle={`${metrics.consultationMetrics.completed} completed`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Medical Files"
                value={metrics.fileMetrics.totalFiles}
                icon={<FileUpload fontSize="large" />}
                gradient="linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)"
                subtitle={`${metrics.fileMetrics.ocrSuccessRate}% OCR success`}
              />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            {/* Weekly Activity Chart */}
            <Grid item xs={12} md={8}>
              <Card sx={{ height: 400 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" justifyContent="between" mb={3}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Weekly Activity</Typography>
                      <Typography variant="h4" sx={{ color: '#6366f1', fontWeight: 700 }}>2,579</Typography>
                      <Typography variant="body2" color="text.secondary">Total interactions this week</Typography>
                    </Box>
                    <BarChart sx={{ fontSize: 40, color: '#1f2937' }} />
                  </Box>
                  <Box sx={{ height: 200, display: 'flex', alignItems: 'end', gap: 1 }}>
                    {[40, 65, 45, 80, 55, 70, 85].map((height, i) => (
                      <Box
                        key={i}
                        sx={{
                          flex: 1,
                          height: `${height}%`,
                          background: 'linear-gradient(180deg, #1f2937 0%, #374151 100%)',
                          borderRadius: 1
                        }}
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Doctor Verification Status */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: 400 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>Doctor Verification</Typography>
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
                      <CircularProgress
                        variant="determinate"
                        value={75}
                        size={120}
                        thickness={4}
                        sx={{ color: '#1f2937' }}
                      />
                      <Box sx={{
                        top: 0, left: 0, bottom: 0, right: 0,
                        position: 'absolute', display: 'flex',
                        alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Typography variant="h5" sx={{ fontWeight: 600 }}>75%</Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Typography variant="h6" sx={{ color: '#6b7280' }}>{metrics.doctorVerification.pending}</Typography>
                        <Typography variant="caption">Pending</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Typography variant="h6" sx={{ color: '#1f2937' }}>{metrics.doctorVerification.verified}</Typography>
                        <Typography variant="caption">Verified</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Typography variant="h6" sx={{ color: '#6b7280' }}>{metrics.doctorVerification.rejected}</Typography>
                        <Typography variant="caption">Rejected</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  <Button
                    component={Link}
                    to="/admin/pending-doctors"
                    variant="contained"
                    fullWidth
                    sx={{ mt: 3 }}
                  >
                    Review Applications
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Activity Table */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent sx={{ p: 0 }}>
                  <Box sx={{ p: 3, borderBottom: '1px solid #e2e8f0' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Recent System Activity</Typography>
                  </Box>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Action</TableCell>
                          <TableCell>User</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {recentActivity.slice(0, 5).map((activity) => (
                          <TableRow key={activity.id}>
                            <TableCell>{activity.action.replace(/_/g, ' ')}</TableCell>
                            <TableCell>{activity.user}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={activity.action.includes('SUCCESS') ? 'Success' : 'Pending'}
                                color={activity.action.includes('SUCCESS') ? 'success' : 'warning'}
                              />
                            </TableCell>
                            <TableCell>{new Date(activity.timestamp).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>


          </Grid>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default AdminDashboard;