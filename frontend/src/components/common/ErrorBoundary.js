import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Button,
  Paper,
  Container,
  Alert,
  AlertTitle,
} from '@mui/material';
import {
  ErrorOutline as ErrorIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console and external monitoring service
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Here you could send error details to an error monitoring service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={() => this.setState({ hasError: false, error: null, errorInfo: null })}
          fallbackComponent={this.props.fallbackComponent}
        />
      );
    }

    return this.props.children;
  }
}

// Functional component for error display
const ErrorFallback = ({ error, errorInfo, resetError, fallbackComponent }) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleReload = () => {
    window.location.reload();
  };

  // If a custom fallback component is provided, use it
  if (fallbackComponent) {
    return fallbackComponent({ error, resetError });
  }

  return (
    <Container maxWidth="md" sx={{ mt: 8 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          textAlign: 'center',
          borderRadius: 2,
          backgroundColor: 'background.paper'
        }}
      >
        <Box sx={{ mb: 3 }}>
          <ErrorIcon 
            sx={{ 
              fontSize: 64, 
              color: 'error.main',
              mb: 2 
            }} 
          />
          
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 'bold',
              color: 'error.main'
            }}
          >
            Oops! Something went wrong
          </Typography>
          
          <Typography 
            variant="h6" 
            color="text.secondary" 
            sx={{ mb: 3 }}
          >
            We apologize for the inconvenience. The application encountered an unexpected error.
          </Typography>
        </Box>

        <Alert 
          severity="error" 
          sx={{ 
            textAlign: 'left', 
            mb: 3,
            '& .MuiAlert-message': {
              width: '100%'
            }
          }}
        >
          <AlertTitle>Error Details</AlertTitle>
          <Typography variant="body2" component="div">
            <strong>Error:</strong> {error?.message || 'Unknown error occurred'}
          </Typography>
          {process.env.NODE_ENV === 'development' && errorInfo && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" component="div">
                <strong>Component Stack:</strong>
              </Typography>
              <Box 
                component="pre" 
                sx={{ 
                  fontSize: '0.75rem',
                  backgroundColor: 'grey.100',
                  p: 1,
                  borderRadius: 1,
                  overflow: 'auto',
                  maxHeight: 200,
                  mt: 1
                }}
              >
                {errorInfo.componentStack}
              </Box>
            </Box>
          )}
        </Alert>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={resetError}
            sx={{ minWidth: 120 }}
          >
            Try Again
          </Button>
          
          <Button
            variant="outlined"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={handleReload}
            sx={{ minWidth: 120 }}
          >
            Reload Page
          </Button>
          
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<HomeIcon />}
            onClick={handleGoHome}
            sx={{ minWidth: 120 }}
          >
            Go Home
          </Button>
        </Box>

        {process.env.NODE_ENV === 'development' && (
          <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              💡 This detailed error information is only shown in development mode
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

ErrorFallback.propTypes = {
  error: PropTypes.object,
  errorInfo: PropTypes.object,
  resetError: PropTypes.func.isRequired,
  fallbackComponent: PropTypes.func,
};

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallbackComponent: PropTypes.func,
};

export default ErrorBoundary;