import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
} from '@mui/material';
import {
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Engineering as ProjectIcon,
  Group as EmployeeIcon,
  ExitToApp as LogoutIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <AdminIcon sx={{ fontSize: 40 }} />;
      case 'project_user':
        return <ProjectIcon sx={{ fontSize: 40 }} />;
      case 'employee':
        return <EmployeeIcon sx={{ fontSize: 40 }} />;
      default:
        return <PersonIcon sx={{ fontSize: 40 }} />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'project_user':
        return 'warning';
      case 'employee':
        return 'info';
      default:
        return 'default';
    }
  };

  const getRolePermissions = (role) => {
    switch (role) {
      case 'admin':
        return [
          'Add, edit, and delete all items',
          'Add new categories and brands',
          'Change user credentials',
          'Upload data in bulk via Excel',
          'Edit all details including price',
        ];
      case 'project_user':
        return [
          'Add and edit some details (except prices)',
          'Upload data in bulk via Excel (price ignored)',
          'Cannot delete items',
          'Cannot add new categories or brands',
        ];
      case 'employee':
        return [
          'View data only',
          'Cannot add, edit, or delete anything',
        ];
      default:
        return [];
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header showSearch={false} />
      
      <Container maxWidth="md" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          User Profile
        </Typography>

        <Grid container spacing={3}>
          {/* User Info Card */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Box sx={{ mb: 2 }}>
                  {getRoleIcon(user.role)}
                </Box>
                <Typography variant="h5" gutterBottom>
                  {user.username}
                </Typography>
                <Chip
                  label={user.role.replace('_', ' ').toUpperCase()}
                  color={getRoleColor(user.role)}
                  sx={{ mb: 2 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Last Login: {user.lastLogin 
                    ? new Date(user.lastLogin).toLocaleString()
                    : 'Never'
                  }
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Member Since: {new Date(user.createdAt).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Permissions Card */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Role Permissions
                </Typography>
                <Box component="ul" sx={{ pl: 2 }}>
                  {getRolePermissions(user.role).map((permission, index) => (
                    <Typography
                      key={index}
                      component="li"
                      variant="body2"
                      sx={{ mb: 1 }}
                    >
                      {permission}
                    </Typography>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Actions Card */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Account Actions
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<LogoutIcon />}
                  onClick={handleLogout}
                  sx={{ mr: 2 }}
                >
                  Logout
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/')}
                >
                  Back to Home
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <Footer />
    </Box>
  );
};

export default Profile;