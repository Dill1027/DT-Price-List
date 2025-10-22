import React, { useState, useEffect } from 'react';
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
  useTheme,
  useMediaQuery,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Engineering as ProjectIcon,
  Group as EmployeeIcon,
  ExitToApp as LogoutIcon,
  Edit as EditIcon,
  Lock as LockIcon,
  ManageAccounts as ManageAccountsIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import axios from 'axios';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State for user profile management
  const [activeTab, setActiveTab] = useState(0);
  const [editProfileDialog, setEditProfileDialog] = useState(false);
  const [changePasswordDialog, setChangePasswordDialog] = useState(false);
  const [addUserDialog, setAddUserDialog] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAddUserPassword, setShowAddUserPassword] = useState(false);
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    username: user?.username || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [addUserForm, setAddUserForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'employee',
  });
  const [errors, setErrors] = useState({});

  // Fetch users for admin
  useEffect(() => {
    if (user?.role === 'admin' && activeTab === 1) {
      fetchUsers();
    }
  }, [user, activeTab]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users');
      setUsers(response.data.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      setErrors({});

      if (!profileForm.username.trim()) {
        setErrors({ username: 'Username is required' });
        return;
      }

      if (profileForm.username.length < 3) {
        setErrors({ username: 'Username must be at least 3 characters' });
        return;
      }

      const response = await axios.put(`/api/users/${user._id}`, {
        username: profileForm.username,
      });

      if (response.data.success) {
        toast.success('Profile updated successfully!');
        setEditProfileDialog(false);
        window.location.reload(); // Simple way to refresh user data
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      const message = error.response?.data?.message || 'Failed to update profile';
      setErrors({ submit: message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Validation helper functions
  const validatePasswordChange = (passwordForm) => {
    if (!passwordForm.currentPassword) {
      return { currentPassword: 'Current password is required' };
    }

    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      return { newPassword: 'New password must be at least 6 characters' };
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return { confirmPassword: 'Passwords do not match' };
    }

    return null;
  };

  const validateAddUser = (addUserForm) => {
    if (!addUserForm.username.trim()) {
      return { addUsername: 'Username is required' };
    }

    if (addUserForm.username.length < 3) {
      return { addUsername: 'Username must be at least 3 characters' };
    }

    if (!addUserForm.password || addUserForm.password.length < 6) {
      return { addPassword: 'Password must be at least 6 characters' };
    }

    if (addUserForm.password !== addUserForm.confirmPassword) {
      return { addConfirmPassword: 'Passwords do not match' };
    }

    if (!addUserForm.role) {
      return { addRole: 'Role is required' };
    }

    return null;
  };

  const handleChangePassword = async () => {
    try {
      setLoading(true);
      setErrors({});

      // Validation
      const validationError = validatePasswordChange(passwordForm);
      if (validationError) {
        setErrors(validationError);
        return;
      }

      const response = await axios.put(`/api/users/${user._id}`, {
        password: passwordForm.newPassword,
      });

      if (response.data.success) {
        toast.success('Password changed successfully!');
        setChangePasswordDialog(false);
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (error) {
      console.error('Failed to change password:', error);
      const message = error.response?.data?.message || 'Failed to change password';
      setErrors({ submit: message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    try {
      setLoading(true);
      setErrors({});

      // Validation
      const validationError = validateAddUser(addUserForm);
      if (validationError) {
        setErrors(validationError);
        return;
      }

      const response = await axios.post('/api/users', {
        username: addUserForm.username,
        password: addUserForm.password,
        role: addUserForm.role,
      });

      if (response.data.success) {
        toast.success('User added successfully!');
        setAddUserDialog(false);
        setAddUserForm({
          username: '',
          password: '',
          confirmPassword: '',
          role: 'employee',
        });
        fetchUsers(); // Refresh the user list
      }
    } catch (error) {
      console.error('Failed to add user:', error);
      const message = error.response?.data?.message || 'Failed to add user';
      setErrors({ addSubmit: message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

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
        return 'success';
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
      
      <Container maxWidth="lg" sx={{ mt: { xs: 2, md: 4 }, mb: 4, flexGrow: 1, px: { xs: 2, sm: 3 } }}>
        <Typography 
          variant={isMobile ? "h5" : "h4"} 
          component="h1" 
          gutterBottom 
          align="center"
          sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}
        >
          User Profile
        </Typography>

        {/* Tabs for Profile and User Management */}
        {user?.role === 'admin' ? (
          <Paper sx={{ mb: 3 }}>
            <Tabs 
              value={activeTab} 
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant={isMobile ? "fullWidth" : "standard"}
            >
              <Tab 
                icon={<PersonIcon />} 
                label="My Profile" 
                iconPosition="start"
                sx={{ minHeight: 48 }}
              />
              <Tab 
                icon={<ManageAccountsIcon />} 
                label="User Management" 
                iconPosition="start"
                sx={{ minHeight: 48 }}
              />
            </Tabs>
          </Paper>
        ) : null}

        {/* Profile Tab Content */}
        {(activeTab === 0 || user?.role !== 'admin') && (
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            {/* User Info Card */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ textAlign: 'center', p: { xs: 2, sm: 3 } }}>
                  <Box sx={{ mb: 2 }}>
                    {getRoleIcon(user.role)}
                  </Box>
                  <Typography 
                    variant={isMobile ? "h6" : "h5"} 
                    gutterBottom
                    sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
                  >
                    {user.username}
                  </Typography>
                  <Chip
                    label={user.role.replace('_', ' ').toUpperCase()}
                    color={getRoleColor(user.role)}
                    size={isMobile ? "small" : "medium"}
                    sx={{ mb: 2 }}
                  />
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                  >
                    Last Login: {user.lastLogin 
                      ? new Date(user.lastLogin).toLocaleString()
                      : 'Never'
                    }
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                  >
                    Member Since: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Permissions Card */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography 
                    variant={isMobile ? "subtitle1" : "h6"} 
                    gutterBottom
                    sx={{ fontWeight: 'bold' }}
                  >
                    Role Permissions
                  </Typography>
                  <Box component="ul" sx={{ pl: { xs: 1.5, sm: 2 }, m: 0 }}>
                    {getRolePermissions(user.role).map((permission) => (
                      <Typography
                        key={permission}
                        component="li"
                        variant="body2"
                        sx={{ 
                          mb: 1,
                          fontSize: { xs: '0.8rem', sm: '0.875rem' },
                          lineHeight: 1.4
                        }}
                      >
                        {permission}
                      </Typography>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Profile Actions Card */}
            <Grid item xs={12}>
              <Paper sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
                <Typography 
                  variant={isMobile ? "subtitle1" : "h6"} 
                  gutterBottom
                  sx={{ fontWeight: 'bold' }}
                >
                  Account Management
                </Typography>
                <Box sx={{ 
                  mt: 2, 
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: { xs: 1, sm: 2 },
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => {
                      setProfileForm({ username: user.username });
                      setEditProfileDialog(true);
                    }}
                    fullWidth={isMobile}
                    size={isMobile ? "medium" : "large"}
                  >
                    Edit Username
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<LockIcon />}
                    onClick={() => setChangePasswordDialog(true)}
                    fullWidth={isMobile}
                    size={isMobile ? "medium" : "large"}
                  >
                    Change Password
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<LogoutIcon />}
                    onClick={handleLogout}
                    fullWidth={isMobile}
                    size={isMobile ? "medium" : "large"}
                  >
                    Logout
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/')}
                    fullWidth={isMobile}
                    size={isMobile ? "medium" : "large"}
                  >
                    Back to Home
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* User Management Tab Content (Admin Only) */}
        {activeTab === 1 && user?.role === 'admin' && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">User Management</Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setAddUserDialog(true)}
                  >
                    Add User
                  </Button>
                </Box>
                
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Username</TableCell>
                          <TableCell>Role</TableCell>
                          <TableCell>Last Login</TableCell>
                          <TableCell>Created</TableCell>
                          <TableCell align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {users.map((userData) => (
                          <TableRow key={userData._id}>
                            <TableCell>{userData.username}</TableCell>
                            <TableCell>
                              <Chip 
                                label={userData.role.replace('_', ' ').toUpperCase()} 
                                color={getRoleColor(userData.role)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {userData.lastLogin 
                                ? new Date(userData.lastLogin).toLocaleDateString()
                                : 'Never'
                              }
                            </TableCell>
                            <TableCell>
                              {new Date(userData.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="Edit User">
                                <IconButton 
                                  size="small"
                                  onClick={() => toast.info('Edit user functionality coming soon!')}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              {userData._id !== user._id && (
                                <Tooltip title="Delete User">
                                  <IconButton 
                                    size="small" 
                                    color="error"
                                    onClick={() => toast.info('Delete user functionality coming soon!')}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Edit Profile Dialog */}
        <Dialog 
          open={editProfileDialog} 
          onClose={() => setEditProfileDialog(false)}
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogContent>
            {errors.submit && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errors.submit}
              </Alert>
            )}
            <TextField
              autoFocus
              margin="dense"
              label="Username"
              fullWidth
              variant="outlined"
              value={profileForm.username}
              onChange={(e) => setProfileForm({ username: e.target.value })}
              error={!!errors.username}
              helperText={errors.username}
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditProfileDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleUpdateProfile} 
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : 'Update'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Change Password Dialog */}
        <Dialog 
          open={changePasswordDialog} 
          onClose={() => setChangePasswordDialog(false)}
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle>Change Password</DialogTitle>
          <DialogContent>
            {errors.submit && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errors.submit}
              </Alert>
            )}
            <TextField
              margin="dense"
              label="Current Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              variant="outlined"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm(prev => ({
                ...prev,
                currentPassword: e.target.value
              }))}
              error={!!errors.currentPassword}
              helperText={errors.currentPassword}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mt: 1 }}
            />
            <TextField
              margin="dense"
              label="New Password"
              type={showNewPassword ? 'text' : 'password'}
              fullWidth
              variant="outlined"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm(prev => ({
                ...prev,
                newPassword: e.target.value
              }))}
              error={!!errors.newPassword}
              helperText={errors.newPassword}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      edge="end"
                    >
                      {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mt: 1 }}
            />
            <TextField
              margin="dense"
              label="Confirm New Password"
              type={showConfirmPassword ? 'text' : 'password'}
              fullWidth
              variant="outlined"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm(prev => ({
                ...prev,
                confirmPassword: e.target.value
              }))}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setChangePasswordDialog(false);
              setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
              });
              setErrors({});
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleChangePassword} 
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : 'Change Password'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add User Dialog */}
        <Dialog 
          open={addUserDialog} 
          onClose={() => {
            setAddUserDialog(false);
            setAddUserForm({
              username: '',
              password: '',
              confirmPassword: '',
              role: 'employee',
            });
            setErrors({});
          }}
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle>Add New User</DialogTitle>
          <DialogContent>
            {errors.addSubmit && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errors.addSubmit}
              </Alert>
            )}
            <TextField
              autoFocus
              margin="dense"
              label="Username"
              fullWidth
              variant="outlined"
              value={addUserForm.username}
              onChange={(e) => setAddUserForm(prev => ({
                ...prev,
                username: e.target.value
              }))}
              error={!!errors.addUsername}
              helperText={errors.addUsername}
              sx={{ mt: 1 }}
            />
            <TextField
              margin="dense"
              label="Password"
              type={showAddUserPassword ? 'text' : 'password'}
              fullWidth
              variant="outlined"
              value={addUserForm.password}
              onChange={(e) => setAddUserForm(prev => ({
                ...prev,
                password: e.target.value
              }))}
              error={!!errors.addPassword}
              helperText={errors.addPassword}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowAddUserPassword(!showAddUserPassword)}
                      edge="end"
                    >
                      {showAddUserPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mt: 1 }}
            />
            <TextField
              margin="dense"
              label="Confirm Password"
              type={showAddUserPassword ? 'text' : 'password'}
              fullWidth
              variant="outlined"
              value={addUserForm.confirmPassword}
              onChange={(e) => setAddUserForm(prev => ({
                ...prev,
                confirmPassword: e.target.value
              }))}
              error={!!errors.addConfirmPassword}
              helperText={errors.addConfirmPassword}
              sx={{ mt: 1 }}
            />
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={addUserForm.role}
                label="Role"
                onChange={(e) => setAddUserForm(prev => ({
                  ...prev,
                  role: e.target.value
                }))}
                error={!!errors.addRole}
              >
                <MenuItem value="employee">Employee</MenuItem>
                <MenuItem value="project_user">Project User</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
              {errors.addRole && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                  {errors.addRole}
                </Typography>
              )}
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setAddUserDialog(false);
              setAddUserForm({
                username: '',
                password: '',
                confirmPassword: '',
                role: 'employee',
              });
              setErrors({});
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddUser} 
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : 'Add User'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>

      <Footer />
    </Box>
  );
};

export default Profile;