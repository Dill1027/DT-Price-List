import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  DialogActions,
  Alert,
  InputAdornment,
  useMediaQuery,
} from '@mui/material';
import { CheckCircle, Error } from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';

const AddProductForm = ({ categoryId, brands, onSuccess, onCancel }) => {
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('sm'));
  const [formData, setFormData] = useState({
    modelNumber: '',
    brand: '',
    hp: '',
    outlet: '',
    maxHead: '',
    maxFlow: '',
    watt: '',
    phase: '1 Phase',
    price: '',
  });
  const [loading, setLoading] = useState(false);
  const [modelNumberStatus, setModelNumberStatus] = useState(null); // null, 'checking', 'available', 'taken'
  const [modelNumberError, setModelNumberError] = useState('');

  // Check model number availability with debounce
  useEffect(() => {
    const checkModelNumber = async () => {
      if (!formData.modelNumber || formData.modelNumber.length < 2) {
        setModelNumberStatus(null);
        setModelNumberError('');
        return;
      }

      setModelNumberStatus('checking');
      try {
        const response = await axios.get(`/api/products/check-model/${encodeURIComponent(formData.modelNumber)}`);
        if (response.data.exists) {
          setModelNumberStatus('taken');
          setModelNumberError('This model number already exists');
        } else {
          setModelNumberStatus('available');
          setModelNumberError('');
        }
      } catch (error) {
        console.error('Model number check error:', error);
        setModelNumberStatus(null);
        setModelNumberError('');
      }
    };

    const timeoutId = setTimeout(checkModelNumber, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.modelNumber]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation - only require essential fields
    if (!formData.modelNumber || !formData.brand || !formData.phase || !formData.price) {
      toast.error('Please fill in all required fields (Model Number, Brand, Phase, Price)');
      return;
    }

    // Check if model number is available
    if (modelNumberStatus === 'taken') {
      toast.error('Model number already exists. Please choose a different one.');
      return;
    }

    setLoading(true);
    try {
      const productData = {
        ...formData,
        category: categoryId,
        // Only include numeric fields if they have values
        hp: formData.hp ? parseFloat(formData.hp) : undefined,
        maxHead: formData.maxHead ? parseFloat(formData.maxHead) : undefined,
        maxFlow: formData.maxFlow ? parseFloat(formData.maxFlow) : undefined,
        watt: formData.watt ? parseFloat(formData.watt) : undefined,
        price: parseFloat(formData.price),
        // Keep outlet as string, can be empty
        outlet: formData.outlet || undefined,
      };

      const response = await axios.post('/api/products', productData);
      onSuccess(response.data.data);
    } catch (error) {
      console.error('Add product error:', error);
      const errorMessage = error.response?.data?.message;
      
      if (errorMessage && errorMessage.includes('already exists')) {
        toast.error(`Model number "${formData.modelNumber}" already exists! Please use a different model number.`);
      } else {
        toast.error(errorMessage || 'Failed to add product');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: { xs: 1, sm: 0 } }}>
      <Alert severity="info" sx={{ mb: 2, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
        Model numbers must be unique. The system will automatically check for duplicates as you type.
      </Alert>
      <Grid container spacing={{ xs: 2, sm: 2, md: 3 }} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Model Number"
            value={formData.modelNumber}
            onChange={(e) => handleChange('modelNumber', e.target.value)}
            required
            error={modelNumberStatus === 'taken'}
            helperText={modelNumberError}
            InputProps={{
              endAdornment: modelNumberStatus && (
                <InputAdornment position="end">
                  {modelNumberStatus === 'checking' && <CircularProgress size={20} />}
                  {modelNumberStatus === 'available' && <CheckCircle color="success" />}
                  {modelNumberStatus === 'taken' && <Error color="error" />}
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required>
            <InputLabel>Brand</InputLabel>
            <Select
              value={formData.brand}
              onChange={(e) => handleChange('brand', e.target.value)}
              label="Brand"
            >
              {brands.map((brand) => (
                <MenuItem key={brand._id} value={brand._id}>
                  {brand.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="HP (Optional)"
            type="number"
            value={formData.hp}
            onChange={(e) => handleChange('hp', e.target.value)}
            inputProps={{ min: 0, step: 0.1 }}
            helperText="Leave empty if not applicable"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Outlet (Optional)"
            value={formData.outlet}
            onChange={(e) => handleChange('outlet', e.target.value)}
            helperText="Leave empty if not applicable"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Max Head (m) (Optional)"
            type="number"
            value={formData.maxHead}
            onChange={(e) => handleChange('maxHead', e.target.value)}
            inputProps={{ min: 0, step: 0.1 }}
            helperText="Leave empty if not applicable"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Max Flow (L/min) (Optional)"
            type="number"
            value={formData.maxFlow}
            onChange={(e) => handleChange('maxFlow', e.target.value)}
            inputProps={{ min: 0, step: 0.1 }}
            helperText="Leave empty if not applicable"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Watt (Optional)"
            type="number"
            value={formData.watt}
            onChange={(e) => handleChange('watt', e.target.value)}
            inputProps={{ min: 0 }}
            helperText="Leave empty if not applicable"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth required>
            <InputLabel>Phase</InputLabel>
            <Select
              value={formData.phase}
              onChange={(e) => handleChange('phase', e.target.value)}
              label="Phase"
            >
              <MenuItem value="1 Phase">1 Phase</MenuItem>
              <MenuItem value="3 Phase">3 Phase</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Price (Rs.)"
            type="number"
            value={formData.price}
            onChange={(e) => handleChange('price', e.target.value)}
            required
            inputProps={{ min: 0, step: 0.01 }}
          />
        </Grid>
      </Grid>

      <DialogActions sx={{ 
        mt: 3, 
        px: 0,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 1 },
        '& .MuiButton-root': {
          width: { xs: '100%', sm: 'auto' },
          minWidth: { sm: 100 }
        }
      }}>
        <Button onClick={onCancel} color="inherit" size={isMobile ? 'large' : 'medium'}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          variant="contained" 
          disabled={loading}
          size={isMobile ? 'large' : 'medium'}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Adding...' : 'Add Product'}
        </Button>
      </DialogActions>
    </Box>
  );
};

AddProductForm.propTypes = {
  categoryId: PropTypes.string.isRequired,
  brands: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  })).isRequired,
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default AddProductForm;