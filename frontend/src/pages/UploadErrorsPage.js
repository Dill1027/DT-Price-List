import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  useMediaQuery,
  useTheme,
  Divider,
  Alert,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  GetApp as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';

const UploadErrorsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Get error data from navigation state
  const { errors = [], summary = {}, categoryName = 'Unknown Category', categoryId, originalFile } = location.state || {};
  const [showFixSuggestions, setShowFixSuggestions] = useState(true);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleRetryUpload = () => {
    // Navigate back to category page with retry intent
    if (categoryId) {
      navigate(`/category/${categoryId}`, {
        state: {
          retryUpload: true,
          previousErrors: errors,
          uploadSummary: summary
        }
      });
    } else {
      navigate(-1);
    }
  };

  const handleFixAndRetry = () => {
    // Navigate back with specific fix suggestions
    if (categoryId) {
      navigate(`/category/${categoryId}`, {
        state: {
          fixAndRetry: true,
          errorData: errors,
          suggestions: generateFixSuggestions()
        }
      });
    }
  };

  const generateFixSuggestions = () => {
    const suggestions = [];
    
    errors.forEach(error => {
      if (error.field === 'brand' && error.message.includes('not found')) {
        suggestions.push({
          type: 'brand_fix',
          message: 'Check brand names against available brands in the system',
          action: 'Correct brand names in your Excel file'
        });
      }
      
      if (error.field === 'modelNumber' && error.message.includes('duplicate')) {
        suggestions.push({
          type: 'duplicate_fix',
          message: 'Model numbers must be unique or will update existing products',
          action: 'Review duplicate model numbers - they will update existing products'
        });
      }
      
      if (error.message.includes('required')) {
        suggestions.push({
          type: 'required_fix',
          message: 'Fill in all required fields',
          action: 'Add missing required data to your Excel file'
        });
      }
    });
    
    return [...new Map(suggestions.map(s => [s.type, s])).values()]; // Remove duplicates
  };

  const handleDownloadErrorReport = () => {
    // Create CSV content for error report
    const csvContent = [
      ['Row', 'Error Type', 'Message', 'Field', 'Data'],
      ...errors.map((error, index) => [
        error.row || index + 1,
        error.type || 'Validation Error',
        error.message || error.error || 'Unknown error',
        error.field || '',
        error.data ? JSON.stringify(error.data) : ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `upload-errors-${categoryName}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderErrorCard = (error, index) => {
    const errorType = error.type || 'Validation Error';
    const isWarning = errorType.toLowerCase().includes('warning');
    
    return (
      <Card 
        key={index} 
        sx={{ 
          mb: 2, 
          border: 1, 
          borderColor: isWarning ? 'warning.light' : 'error.light',
          '&:hover': {
            boxShadow: 3,
          }
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ mr: 2, mt: 0.5 }}>
              {isWarning ? (
                <WarningIcon color="warning" />
              ) : (
                <ErrorIcon color="error" />
              )}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Row {error.row || index + 1}
                </Typography>
                <Chip 
                  label={errorType}
                  size="small"
                  color={isWarning ? 'warning' : 'error'}
                  variant="outlined"
                />
              </Box>
              
              <Typography variant="body1" sx={{ mb: 2, color: 'text.primary' }}>
                <strong>Error:</strong> {error.message || error.error || 'Unknown error occurred'}
              </Typography>

              {error.field && (
                <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                  <strong>Field:</strong> {error.field}
                </Typography>
              )}

              {error.data && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
                    Problematic Data:
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50', overflow: 'auto' }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                      {typeof error.data === 'object' 
                        ? JSON.stringify(error.data, null, 2)
                        : String(error.data)
                      }
                    </Typography>
                  </Paper>
                </Box>
              )}

              {error.suggestion && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'info.50', borderRadius: 1, border: 1, borderColor: 'info.light' }}>
                  <Typography variant="body2" color="info.dark">
                    <strong>Suggestion:</strong> {error.suggestion}
                  </Typography>
                </Box>
              )}
              
              {/* Quick fix suggestions */}
              {showFixSuggestions && (
                <Box sx={{ mt: 2 }}>
                  {error.field === 'brand' && error.message.includes('not found') && (
                    <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
                      <strong>Quick Fix:</strong> Use the dropdown in Excel or check the available brands list when uploading.
                    </Alert>
                  )}
                  
                  {error.field === 'modelNumber' && error.message.includes('exists') && (
                    <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
                      <strong>Note:</strong> This model number will update the existing product instead of creating a new one.
                    </Alert>
                  )}
                  
                  {error.message.includes('required') && (
                    <Alert severity="warning" sx={{ fontSize: '0.875rem' }}>
                      <strong>Required:</strong> This field must have a value. Add the missing data to your Excel file.
                    </Alert>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderSummaryCard = () => (
    <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.50', border: 1, borderColor: 'primary.light' }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <ErrorIcon sx={{ mr: 1, color: 'primary.main' }} />
        Upload Summary for {categoryName}
      </Typography>
      
      <Grid container spacing={2} sx={{ mt: 1 }}>
        {summary.created > 0 && (
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                {summary.created}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Created
              </Typography>
            </Box>
          </Grid>
        )}
        
        {summary.priceUpdated > 0 && (
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold' }}>
                {summary.priceUpdated}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Price Updated
              </Typography>
            </Box>
          </Grid>
        )}
        
        {summary.detailsUpdated > 0 && (
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                {summary.detailsUpdated}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Details Updated
              </Typography>
            </Box>
          </Grid>
        )}
        
        <Grid item xs={6} sm={3}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="error.main" sx={{ fontWeight: 'bold' }}>
              {errors.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Errors
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );

  if (errors.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <Container maxWidth="md" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            No upload errors to display.
          </Alert>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleGoBack}
            variant="contained"
          >
            Go Back
          </Button>
        </Container>
        <Footer />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      
      <Container maxWidth="lg" sx={{ mt: { xs: 2, md: 4 }, mb: 4, flexGrow: 1 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={handleGoBack} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography 
              variant={isMobile ? "h5" : "h4"} 
              component="h1" 
              sx={{ fontWeight: 'bold', color: 'error.main' }}
            >
              Upload Errors Report
            </Typography>
          </Box>
          
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
            {errors.length} error{errors.length !== 1 ? 's' : ''} occurred during the bulk upload process
          </Typography>

          {/* Action Buttons */}
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            flexWrap: 'wrap',
            mb: 3
          }}>
            <Button
              startIcon={<DownloadIcon />}
              onClick={handleDownloadErrorReport}
              variant="outlined"
              color="primary"
            >
              Download Error Report
            </Button>
            <Button
              startIcon={<RefreshIcon />}
              onClick={handleRetryUpload}
              variant="contained"
              color="primary"
            >
              Fix & Try Again
            </Button>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={handleGoBack}
              variant="outlined"
            >
              Go Back
            </Button>
          </Box>

          <Divider />
        </Box>

        {/* Summary Card */}
        {renderSummaryCard()}

        {/* Error Guidelines */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Common Solutions:
          </Typography>
          <Typography variant="body2" component="div">
            • Check data formatting (numbers, dates, text length)<br/>
            • Ensure required fields are not empty<br/>
            • Verify brand names exist in the system<br/>
            • Download the template for correct format reference
          </Typography>
        </Alert>

        {/* Error List */}
        <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 'bold' }}>
          Detailed Error List
        </Typography>
        
        <Box sx={{ mb: 4 }}>
          {errors.map((error, index) => renderErrorCard(error, index))}
        </Box>

        {/* Footer Actions */}
        <Paper sx={{ p: 3, mt: 4, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Need help resolving these errors?
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              startIcon={<DownloadIcon />}
              onClick={handleDownloadErrorReport}
              variant="outlined"
            >
              Export Errors
            </Button>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={handleGoBack}
              variant="contained"
            >
              Back to Upload
            </Button>
          </Box>
        </Paper>
      </Container>

      <Footer />
    </Box>
  );
};

export default UploadErrorsPage;