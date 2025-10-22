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
  useTheme,
  useMediaQuery,
  Button,
  Menu,
  FormControlLabel,
  Checkbox,
  Divider,
  Tooltip,
  IconButton,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { 
  ViewColumn as ViewColumnIcon,
} from '@mui/icons-material';
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Column visibility state
  const [columnVisibilityMenuAnchor, setColumnVisibilityMenuAnchor] = useState(null);
  const [columnVisibility, setColumnVisibility] = useState({
    modelNumber: true,
    category: true,
    brand: true,
    hp: false,        // Hidden by default - optional field
    outlet: false,    // Hidden by default - optional field
    maxHead: false,   // Hidden by default - optional field
    watt: false,      // Hidden by default - optional field
    phase: true,
    price: user?.role === 'admin',
  });

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

  // Column creation helper functions
  const createModelNumberColumn = (isMobile, columnVisibility) => ({
    field: 'modelNumber',
    headerName: 'Model Number',
    width: isMobile ? 120 : 150,
    hide: !columnVisibility.modelNumber,
    renderCell: (params) => (
      <Typography 
        variant="body2" 
        sx={{ 
          fontWeight: 'bold', 
          color: 'primary.main',
          fontSize: { xs: '0.8rem', sm: '0.875rem' }
        }}
      >
        {params.value}
      </Typography>
    ),
  });

  const createCategoryColumn = (isMobile, columnVisibility) => ({
    field: 'category',
    headerName: 'Category',
    width: isMobile ? 100 : 140,
    hide: !columnVisibility.category || isMobile,
    renderCell: (params) => (
      <Chip 
        label={params.value?.name || 'N/A'} 
        size="small" 
        color="primary" 
        variant="outlined"
      />
    ),
  });

  const createBrandColumn = (isMobile, columnVisibility) => ({
    field: 'brand',
    headerName: 'Brand',
    width: isMobile ? 90 : 120,
    hide: !columnVisibility.brand,
    renderCell: (params) => (
      <Chip 
        label={params.value?.name || 'N/A'} 
        size="small" 
        color="secondary" 
        variant="outlined"
      />
    ),
  });

  const createPhaseColumn = (isMobile, columnVisibility) => ({
    field: 'phase',
    headerName: 'Phase',
    width: isMobile ? 80 : 100,
    hide: !columnVisibility.phase,
    renderCell: (params) => (
      <Chip 
        label={params.value} 
        size="small" 
        color={params.value === '3 Phase' ? 'error' : 'success'}
        variant="filled"
      />
    ),
  });

  const createPriceColumn = (isMobile, columnVisibility) => ({
    field: 'price',
    headerName: isMobile ? 'Price' : 'Price (Rs.)',
    width: isMobile ? 90 : 120,
    type: 'number',
    hide: !columnVisibility.price,
    renderCell: (params) => (
      <Typography 
        variant="body2" 
        sx={{ 
          fontWeight: 'bold',
          fontSize: { xs: '0.8rem', sm: '0.875rem' }
        }}
      >
        {params.value ? `Rs.${params.value.toLocaleString()}` : 'N/A'}
      </Typography>
    ),
  });

  const createBasicColumns = (isMobile, columnVisibility) => [
    createModelNumberColumn(isMobile, columnVisibility),
    createCategoryColumn(isMobile, columnVisibility),
    createBrandColumn(isMobile, columnVisibility),
    {
      field: 'hp',
      headerName: 'HP',
      width: 60,
      type: 'number',
      hide: !columnVisibility.hp,
    },
    {
      field: 'outlet',
      headerName: 'Outlet',
      width: isMobile ? 80 : 120,
      hide: !columnVisibility.outlet || isMobile,
    },
    {
      field: 'maxHead',
      headerName: isMobile ? 'Head' : 'Max Head (m)',
      width: isMobile ? 70 : 120,
      type: 'number',
      hide: !columnVisibility.maxHead || isMobile,
    },
    {
      field: 'watt',
      headerName: 'Watt',
      width: isMobile ? 70 : 100,
      type: 'number',
      hide: !columnVisibility.watt,
    },
    createPhaseColumn(isMobile, columnVisibility),
  ];

  const columns = [
    ...createBasicColumns(isMobile, columnVisibility),
    ...(user?.role === 'admin' ? [createPriceColumn(isMobile, columnVisibility)] : []),
  ];

  // Column visibility functions
  const handleColumnVisibilityMenuOpen = (event) => {
    setColumnVisibilityMenuAnchor(event.currentTarget);
  };

  const handleColumnVisibilityMenuClose = () => {
    setColumnVisibilityMenuAnchor(null);
  };

  const handleColumnVisibilityToggle = (columnField) => {
    setColumnVisibility(prev => ({
      ...prev,
      [columnField]: !prev[columnField]
    }));
  };

  const resetColumnVisibility = () => {
    setColumnVisibility({
      modelNumber: true,
      category: true,
      brand: true,
      hp: false,        // Hidden by default - optional field
      outlet: false,    // Hidden by default - optional field
      maxHead: false,   // Hidden by default - optional field
      watt: false,      // Hidden by default - optional field
      phase: true,
      price: user?.role === 'admin',
    });
  };

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
      
      <Container maxWidth="xl" sx={{ mt: { xs: 2, md: 4 }, mb: 4, flexGrow: 1, px: { xs: 1, sm: 3 } }}>
        <Box sx={{ mb: { xs: 2, md: 3 } }}>
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            component="h1" 
            gutterBottom
            sx={{ px: { xs: 1, sm: 0 } }}
          >
            Search Results
          </Typography>
          
          {searchTerm && (
            <Box sx={{ mb: 2, px: { xs: 1, sm: 0 } }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 1, sm: 0 }
              }}>
                <Box>
                  <Typography 
                    variant={isMobile ? "subtitle1" : "h6"} 
                    color="text.secondary"
                    sx={{ 
                      wordBreak: 'break-word',
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}
                  >
                    Searching for: "{searchTerm}"
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.85rem', sm: '0.875rem' } }}
                  >
                    Found {products.length} product{products.length !== 1 ? 's' : ''}
                  </Typography>
                </Box>
                
                <Tooltip title="Column Visibility">
                  <IconButton
                    onClick={handleColumnVisibilityMenuOpen}
                    size={isMobile ? "small" : "medium"}
                    sx={{ 
                      alignSelf: { xs: 'flex-end', sm: 'center' },
                      mt: { xs: 1, sm: 0 }
                    }}
                  >
                    <ViewColumnIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          )}

          {!searchTerm && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 2
            }}>
              <Alert severity="info" sx={{ flexGrow: 1, mr: 2 }}>
                Use the search bar above to find products by model number, category, brand, HP, watt, outlet, phase, or price.
              </Alert>
              
              <Tooltip title="Column Visibility">
                <IconButton
                  onClick={handleColumnVisibilityMenuOpen}
                  size={isMobile ? "small" : "medium"}
                >
                  <ViewColumnIcon />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>

        {products.length > 0 ? (
          <Paper sx={{ height: isMobile ? 500 : 600, width: '100%' }}>
            <DataGrid
              rows={products}
              columns={columns}
              pageSize={isMobile ? 10 : 25}
              rowsPerPageOptions={isMobile ? [10, 25] : [25, 50, 100]}
              disableSelectionOnClick
              getRowId={(row) => row._id}
              density={isMobile ? 'compact' : 'standard'}
              sx={{
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: 'action.hover',
                },
                '& .MuiDataGrid-columnHeaders': {
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                },
                '& .MuiDataGrid-cell': {
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  padding: { xs: '4px 8px', sm: '8px 16px' },
                },
              }}
            />
          </Paper>
        ) : (
          searchTerm ? (
            <Paper sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
              <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom>
                No products found
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{ 
                  mb: 2,
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }}
              >
                Try searching with different keywords such as:
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={1} justifyContent="center">
                  <Grid item><Chip label="Model numbers" variant="outlined" size={isMobile ? "small" : "medium"} /></Grid>
                  <Grid item><Chip label="Brand names" variant="outlined" size={isMobile ? "small" : "medium"} /></Grid>
                  <Grid item><Chip label="Category names" variant="outlined" size={isMobile ? "small" : "medium"} /></Grid>
                  <Grid item><Chip label="HP values" variant="outlined" size={isMobile ? "small" : "medium"} /></Grid>
                  <Grid item><Chip label="Watt values" variant="outlined" size={isMobile ? "small" : "medium"} /></Grid>
                  <Grid item><Chip label="Outlet types" variant="outlined" size={isMobile ? "small" : "medium"} /></Grid>
                  <Grid item><Chip label="Phase (1 Phase, 3 Phase)" variant="outlined" size={isMobile ? "small" : "medium"} /></Grid>
                </Grid>
              </Box>
            </Paper>
          ) : null
        )}

        {/* Column Visibility Menu */}
        <Menu
          anchorEl={columnVisibilityMenuAnchor}
          open={Boolean(columnVisibilityMenuAnchor)}
          onClose={handleColumnVisibilityMenuClose}
          slotProps={{
            paper: {
              sx: {
                maxWidth: 280,
                '& .MuiMenuItem-root': {
                  padding: 1,
                },
              },
            }
          }}
        >
          <Box sx={{ p: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Show/Hide Columns
            </Typography>
            
            {columns.slice(0, -1).map((column) => (
              <FormControlLabel
                key={column.field}
                control={
                  <Checkbox
                    checked={columnVisibility[column.field] !== false}
                    onChange={() => handleColumnVisibilityToggle(column.field)}
                    size="small"
                  />
                }
                label={column.headerName}
                sx={{ 
                  display: 'block',
                  '& .MuiFormControlLabel-label': {
                    fontSize: '0.875rem',
                  },
                }}
              />
            ))}
            
            <Divider sx={{ my: 1 }} />
            
            <Button
              variant="outlined"
              size="small"
              onClick={resetColumnVisibility}
              fullWidth
              sx={{ fontSize: '0.75rem' }}
            >
              Reset to Default
            </Button>
          </Box>
        </Menu>
      </Container>

      <Footer />
    </Box>
  );
};

export default SearchResults;