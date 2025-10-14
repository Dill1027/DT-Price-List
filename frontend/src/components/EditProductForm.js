import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  MenuItem,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import axios from 'axios';
import toast from 'react-hot-toast';

const EditProductForm = ({ product, brands, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    modelNumber: '',
    brandId: '',
    categoryId: '',
    hp: '',
    outlet: '',
    maxHead: '',
    watt: '',
    phase: '',
    price: '',
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('/api/categories');
        setCategories(response.data.data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (product) {
      setFormData({
        modelNumber: product.modelNumber || '',
        brandId: product.brand?._id || '',
        categoryId: product.category?._id || '',
        hp: product.hp || '',
        outlet: product.outlet || '',
        maxHead: product.maxHead || '',
        watt: product.watt || '',
        phase: product.phase || '',
        price: product.price || '',
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.modelNumber || !formData.brandId || !formData.categoryId) {
        setError('Model Number, Brand, and Category are required');
        setLoading(false);
        return;
      }

      // Transform formData to match backend expectations
      const updateData = {
        modelNumber: formData.modelNumber,
        brand: formData.brandId,
        category: formData.categoryId,
        hp: parseFloat(formData.hp) || 0,
        outlet: formData.outlet,
        maxHead: parseFloat(formData.maxHead) || 0,
        watt: parseFloat(formData.watt) || 0,
        phase: formData.phase,
        price: parseFloat(formData.price) || 0,
      };

      const response = await axios.put(`/api/products/${product._id}`, updateData);
      
      if (response.data.success) {
        toast.success('Product updated successfully!');
        onSuccess();
      }
    } catch (error) {
      console.error('Update product error:', error);
      if (error.response?.data?.message) {
        if (error.response.data.message.includes('duplicate') || 
            error.response.data.message.includes('already exists')) {
          setError('This model number already exists. Please use a different model number.');
        } else {
          setError(error.response.data.message);
        }
      } else {
        setError('Failed to update product. Please try again.');
      }
      toast.error('Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            name="modelNumber"
            label="Model Number"
            value={formData.modelNumber}
            onChange={handleChange}
            fullWidth
            required
            variant="outlined"
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            name="brandId"
            label="Brand"
            value={formData.brandId}
            onChange={handleChange}
            select
            fullWidth
            required
            variant="outlined"
          >
            <MenuItem value="">Select Brand</MenuItem>
            {brands.map((brand) => (
              <MenuItem key={brand._id} value={brand._id}>
                {brand.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            name="categoryId"
            label="Category"
            value={formData.categoryId}
            onChange={handleChange}
            select
            fullWidth
            required
            variant="outlined"
          >
            <MenuItem value="">Select Category</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category._id} value={category._id}>
                {category.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            name="hp"
            label="HP"
            type="number"
            value={formData.hp}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            inputProps={{ step: "0.1" }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            name="outlet"
            label="Outlet"
            value={formData.outlet}
            onChange={handleChange}
            fullWidth
            variant="outlined"
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            name="maxHead"
            label="Max Head"
            type="number"
            value={formData.maxHead}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            inputProps={{ step: "0.1" }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            name="watt"
            label="Watt"
            type="number"
            value={formData.watt}
            onChange={handleChange}
            fullWidth
            variant="outlined"
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            name="phase"
            label="Phase"
            value={formData.phase}
            onChange={handleChange}
            select
            fullWidth
            variant="outlined"
          >
            <MenuItem value="">Select Phase</MenuItem>
            <MenuItem value="1 Phase">1 Phase</MenuItem>
            <MenuItem value="3 Phase">3 Phase</MenuItem>
          </TextField>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            name="price"
            label="Price (Rs.)"
            type="number"
            value={formData.price}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            inputProps={{ step: "0.01" }}
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button 
          onClick={onCancel} 
          variant="outlined"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          variant="contained" 
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Updating...' : 'Update Product'}
        </Button>
      </Box>
    </Box>
  );
};

export default EditProductForm;