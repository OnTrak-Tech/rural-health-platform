import React, { useState } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, List, Typography, IconButton,
  ListItem, ListItemButton, ListItemIcon, ListItemText, CssBaseline,
  Paper, Avatar, InputBase, Badge, Menu as MenuComponent, MenuItem
} from '@mui/material';
import {
  Dashboard, People, LocalHospital, Assessment, Settings,
  Notifications, Search, Menu, AccountCircle, Logout
} from '@mui/icons-material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { clearToken, setUser } from '../authToken';

const drawerWidth = 280;

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1f2937' },
    secondary: { main: '#6b7280' },
    info: { main: '#374151' },
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

function AdminLayout({ children, title = 'Admin Panel' }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

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
    clearToken();
    setUser(null);
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/admin' },
    { text: 'User Management', icon: <People />, path: '/admin/users' },
    { text: 'Doctor Verification', icon: <LocalHospital />, path: '/admin/pending-doctors' },
    { text: 'Register Health Practitioner', icon: <People />, path: '/admin/register-patient' },
    { text: 'Register Doctor', icon: <LocalHospital />, path: '/admin/register-doctor' },
    { text: 'Analytics', icon: <Assessment />, path: '/admin/analytics' },
    { text: 'Settings', icon: <Settings />, path: '/admin/settings' }
  ];

  const drawer = (
    <Box>
      <Box sx={{ p: 3, borderBottom: '1px solid #e5e7eb' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827' }}>
          Rural Health Admin
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
                backgroundColor: location.pathname === item.path ? '#1f2937' : 'transparent',
                color: location.pathname === item.path ? 'white' : '#6b7280',
                '&:hover': {
                  backgroundColor: location.pathname === item.path ? '#374151' : '#f3f4f6'
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
        <Paper sx={{ background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)', color: 'white', p: 2 }}>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>Dashboard Pro</Typography>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>Advanced Analytics</Typography>
        </Paper>
      </Box>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        <CssBaseline />
        
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
              {title}
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

        <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
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

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            mt: 10
          }}
        >
          {children}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default AdminLayout;