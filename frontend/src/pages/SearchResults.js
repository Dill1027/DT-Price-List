import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Grid,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Get search term from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const query = urlParams.get('q');
    if (query) {
      setSearchTerm(query);
      performSearch(query);
    } else {
      setLoading(false);
    }
  }, [location.search]);

  const performSearch = async (query) => {
    if (!query.trim()) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`/api/products?search=${encodeURIComponent(query)}&limit=100`);
      setProducts(response.data.data);
    } catch (error) {
      toast.error('Failed to search products');
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (newSearchTerm) => {
    if (newSearchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(newSearchTerm)}`);
    } else {
      navigate('/');
    }
  };

  const columns = [
    {
      field: 'modelNumber',
      headerName: 'Model Number',
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 140,
      renderCell: (params) => (
        <Chip 
          label={params.value?.name || 'N/A'} 
          size="small" 
          color="primary" 
          variant="outlined"
        />
      ),
    },
    {
      field: 'brand',
      headerName: 'Brand',
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value?.name || 'N/A'} 
          size="small" 
          color="secondary" 
          variant="outlined"
        />
      ),
    },
    {
      field: 'hp',
      headerName: 'HP',
      width: 80,
      type: 'number',
    },
    {
      field: 'outlet',
      headerName: 'Outlet',
      width: 120,
    },
    {
      field: 'maxHead',
      headerName: 'Max Head (m)',
      width: 120,
      type: 'number',
    },
    {
      field: 'watt',
      headerName: 'Watt',
      width: 100,
      type: 'number',
    },
    {
      field: 'phase',
      headerName: 'Phase',
      width: 100,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          size="small" 
          color={params.value === '3 Phase' ? 'error' : 'success'}
          variant="filled"
        />
      ),
    },
  ];

  // Add price column only for admin users
  if (user?.role === 'admin') {
    columns.push({
      field: 'price',
      headerName: 'Price (Rs.)',
      width: 120,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
          {params.value ? `Rs.${params.value.toLocaleString()}` : 'N/A'}
        </Typography>
      ),
    });
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header onSearch={handleSearch} />
        <Box display="flex" justifyContent="center" alignItems="center" sx={{ flexGrow: 1 }}>
          <CircularProgress />
        </Box>
        <Footer />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header onSearch={handleSearch} />
      
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Search Results
          </Typography>
          
          {searchTerm && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" color="text.secondary">
                Searching for: "{searchTerm}"
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Found {products.length} product{products.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
          )}

          {!searchTerm && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Use the search bar above to find products by model number, category, brand, HP, watt, outlet, phase, or price.
            </Alert>
          )}
        </Box>

        {products.length > 0 ? (
          <Paper sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={products}
              columns={columns}
              pageSize={25}
              rowsPerPageOptions={[25, 50, 100]}
              disableSelectionOnClick
              getRowId={(row) => row._id}
              sx={{
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            />
          </Paper>
        ) : searchTerm ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              No products found
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Try searching with different keywords such as:
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={1} justifyContent="center">
                <Grid item><Chip label="Model numbers" variant="outlined" /></Grid>
                <Grid item><Chip label="Brand names" variant="outlined" /></Grid>
                <Grid item><Chip label="Category names" variant="outlined" /></Grid>
                <Grid item><Chip label="HP values" variant="outlined" /></Grid>
                <Grid item><Chip label="Watt values" variant="outlined" /></Grid>
                <Grid item><Chip label="Outlet types" variant="outlined" /></Grid>
                <Grid item><Chip label="Phase (1 Phase, 3 Phase)" variant="outlined" /></Grid>
              </Grid>
            </Box>
          </Paper>
        ) : null}
      </Container>

      <Footer />
    </Box>
  );
};

export default SearchResults;