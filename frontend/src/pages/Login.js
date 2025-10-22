import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.username, formData.password);
    
    if (result.success) {
      navigate('/', { replace: true });
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container component="main" maxWidth="xs" sx={{ px: { xs: 2, sm: 3 } }}>
      <Box
        sx={{
          marginTop: { xs: 4, sm: 8 },
          marginBottom: { xs: 4, sm: 8 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: { xs: 'calc(100vh - 64px)', sm: 'auto' },
          justifyContent: { xs: 'center', sm: 'flex-start' },
        }}
      >
        <Paper
          elevation={isMobile ? 0 : 6}
          sx={{
            padding: { xs: 3, sm: 4 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            backgroundColor: isMobile ? 'transparent' : 'background.paper',
            boxShadow: isMobile ? 'none' : undefined,
          }}
        >
          <Typography 
            component="h1" 
            variant={isMobile ? "h5" : "h4"} 
            sx={{ 
              mb: { xs: 2, sm: 3 }, 
              fontWeight: 'bold',
              textAlign: 'center'
            }}
          >
            Deep Tec
          </Typography>
          <Typography 
            component="h2" 
            variant={isMobile ? "subtitle1" : "h6"} 
            sx={{ 
              mb: { xs: 2, sm: 3 },
              textAlign: 'center',
              color: 'text.secondary'
            }}
          >
            Price List System
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ 
                mt: 3, 
                mb: 2, 
                py: { xs: 1.2, sm: 1.5 },
                fontSize: { xs: '0.9rem', sm: '1rem' },
                fontWeight: 'bold'
              }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
          </Box>

          <Box sx={{ mt: 2, textAlign: 'center', width: '100%' }}>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
            >
              Demo Credentials:
            </Typography>
            <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography 
                variant="caption" 
                display="block"
                sx={{ 
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  backgroundColor: 'action.hover',
                  padding: '4px 8px',
                  borderRadius: 1,
                  margin: '2px 0'
                }}
              >
                Admin: admin / admin123
              </Typography>
              <Typography 
                variant="caption" 
                display="block"
                sx={{ 
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  backgroundColor: 'action.hover',
                  padding: '4px 8px',
                  borderRadius: 1,
                  margin: '2px 0'
                }}
              >
                Project User: project / project123
              </Typography>
              <Typography 
                variant="caption" 
                display="block"
                sx={{ 
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  backgroundColor: 'action.hover',
                  padding: '4px 8px',
                  borderRadius: 1,
                  margin: '2px 0'
                }}
              >
                Employee: employee / employee123
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;