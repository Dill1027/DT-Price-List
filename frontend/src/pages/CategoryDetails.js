import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Chip,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
  IconButton,
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useMediaQuery,
  useTheme,
  Fab,
  Menu,
  FormControlLabel,
  Checkbox,
  Divider,
  Tooltip,
  TextField,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Download as DownloadIcon,
  Upload as UploadIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  ViewColumn as ViewColumnIcon,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { saveAs } from 'file-saver';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import AddProductForm from '../components/AddProductForm';
import EditProductForm from '../components/EditProductForm';

const CategoryDetails = () => {
  const { categoryId } = useParams();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    brand: '',
    hp: '',
    outlet: '',
    maxHead: '',
    maxFlow: '',
    watt: '',
    phase: '',
    price: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // Column visibility state - show all details by default
  const [columnVisibilityMenuAnchor, setColumnVisibilityMenuAnchor] = useState(null);
  const [columnVisibility, setColumnVisibility] = useState({
    modelNumber: true,
    brand: true,
    hp: true,
    outlet: true,
    maxHead: true,
    maxFlow: true,
    watt: true,
    phase: true,
    price: true,
    actions: user?.role === 'admin',
  });

  useEffect(() => {
    fetchCategoryData();
    fetchBrands();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, filters]);

  const fetchCategoryData = async () => {
    try {
      const [categoryRes, productsRes] = await Promise.all([
        axios.get('/api/categories'),
        axios.get(`/api/products/category/${categoryId}`)
      ]);

      const currentCategory = categoryRes.data.data.find(cat => cat._id === categoryId);
      setCategory(currentCategory);
      setProducts(productsRes.data.data);
    } catch (error) {
      console.error('Failed to fetch category data:', error);
      toast.error('Failed to fetch category data');
    } finally {
      setLoading(false);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await axios.get('/api/brands');
      setBrands(response.data.data);
    } catch (error) {
      console.error('Failed to fetch brands:', error);
      toast.error('Failed to load brands');
    }
  };

  // Filter helper functions - comprehensive filtering for all data fields
  const applyBrandFilter = (products) => {
    return filters.brand 
      ? products.filter(product => product.brand._id === filters.brand)
      : products;
  };

  const applyHpFilter = (products) => {
    return filters.hp 
      ? products.filter(product => product.hp?.toString() === filters.hp)
      : products;
  };

  const applyOutletFilter = (products) => {
    return filters.outlet 
      ? products.filter(product => product.outlet?.toLowerCase().includes(filters.outlet.toLowerCase()))
      : products;
  };

  const applyMaxHeadFilter = (products) => {
    return filters.maxHead 
      ? products.filter(product => product.maxHead?.toString() === filters.maxHead)
      : products;
  };

  const applyMaxFlowFilter = (products) => {
    return filters.maxFlow 
      ? products.filter(product => product.maxFlow?.toString() === filters.maxFlow)
      : products;
  };

  const applyWattFilter = (products) => {
    return filters.watt 
      ? products.filter(product => product.watt?.toString() === filters.watt)
      : products;
  };

  const applyPhaseFilter = (products) => {
    return filters.phase 
      ? products.filter(product => product.phase?.toLowerCase().includes(filters.phase.toLowerCase()))
      : products;
  };

  const applyPriceFilter = (products) => {
    return filters.price 
      ? products.filter(product => product.price?.toString() === filters.price)
      : products;
  };

  const applyFilters = () => {
    let filtered = [...products];
    
    // Apply all filters
    filtered = applyBrandFilter(filtered);
    filtered = applyHpFilter(filtered);
    filtered = applyOutletFilter(filtered);
    filtered = applyMaxHeadFilter(filtered);
    filtered = applyMaxFlowFilter(filtered);
    filtered = applyWattFilter(filtered);
    filtered = applyPhaseFilter(filtered);
    filtered = applyPriceFilter(filtered);
    
    setFilteredProducts(filtered);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      brand: '',
      hp: '',
      outlet: '',
      maxHead: '',
      maxFlow: '',
      watt: '',
      phase: '',
      price: '',
    });
  };

  const handleExport = async () => {
    try {
      // Send all filter parameters for comprehensive export
      const queryParams = new URLSearchParams({
        category: categoryId,
        ...filters
      });

      const response = await axios.get(`/api/products/export?${queryParams}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      saveAs(blob, `${category?.name || 'products'}-export.xlsx`);
      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data');
    }
  };

  const handleBulkUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('categoryId', categoryId);

    setUploading(true);
    try {
      await axios.post('/api/products/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Products uploaded successfully');
      fetchCategoryData();
      event.target.value = '';
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload products');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await axios.get('/api/products/download-template', {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      saveAs(blob, 'product-upload-template.xlsx');
      toast.success('Template downloaded successfully');
    } catch (error) {
      console.error('Template download failed:', error);
      toast.error('Failed to download template');
    }
  };

  const getUploadButtonText = () => {
    if (isMobile) return '';
    return uploading ? 'Uploading...' : 'Import';
  };

  // Helper function to create base columns
  const createBaseColumns = () => [
    {
      field: 'modelNumber',
      headerName: 'Model Number',
      width: isMobile ? 140 : 180,
      flex: isMobile ? 0 : 1,
    },
    {
      field: 'brand',
      headerName: 'Brand',
      width: isMobile ? 100 : 130,
      valueGetter: (params) => params.row.brand?.name || 'N/A',
    }
  ];

  // Helper function to create conditional columns - additional details visible by default
  const createConditionalColumns = () => {
    const columns = [];

    // HP column - additional detail
    columns.push({
      field: 'hp',
      headerName: 'HP',
      width: 80,
      type: 'number',
    });

    // Outlet column - additional detail
    columns.push({
      field: 'outlet',
      headerName: 'Outlet',
      width: 100,
    });

    // Max Head column - additional detail
    columns.push({
      field: 'maxHead',
      headerName: 'Max Head (m)',
      width: 130,
      type: 'number',
    });

    // Max Flow column - additional detail
    columns.push({
      field: 'maxFlow',
      headerName: 'Max Flow (l/min)',
      width: 150,
      type: 'number',
    });

    // Watt column - additional detail
    columns.push({
      field: 'watt',
      headerName: 'Watt',
      width: 100,
      type: 'number',
    });

    // Phase column - additional detail
    columns.push({
      field: 'phase',
      headerName: 'Phase',
      width: 100,
    });

    return columns;
  };

  // Helper function to create price column - additional detail visible by default
  const createPriceColumn = () => {
    return {
      field: 'price',
      headerName: 'Price (LKR)',
      width: 120,
      type: 'number',
      valueFormatter: (params) => {
        if (params.value == null) return 'N/A';
        return new Intl.NumberFormat('en-LK', {
          style: 'currency',
          currency: 'LKR',
          minimumFractionDigits: 0,
        }).format(params.value);
      },
    };
  };

  // Helper function to create actions column
  const createActionsColumn = () => {
    if (user?.role !== 'admin') return null;
    
    return {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton size="small" onClick={() => handleEdit(params.row)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => handleDelete(params.row)} color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    };
  };

  const createDataGridColumns = () => {
    const baseColumns = createBaseColumns();
    const conditionalColumns = createConditionalColumns();
    const priceColumn = createPriceColumn();
    const actionsColumn = createActionsColumn();

    return [
      ...baseColumns,
      ...conditionalColumns,
      priceColumn,
      actionsColumn
    ].filter(Boolean);
  };

  const handleAddSuccess = (newProduct) => {
    setProducts(prev => [...prev, newProduct]);
    setAddDialog(false);
    toast.success('Product added successfully');
  };

  const columns = createDataGridColumns();

  const handleEdit = (product) => {
    setCurrentProduct(product);
    setEditDialog(true);
  };

  const handleDelete = (product) => {
    setCurrentProduct(product);
    setDeleteDialog(true);
  };

  const handleEditSuccess = () => {
    setEditDialog(false);
    setCurrentProduct(null);
    fetchCategoryData();
  };

  const handleConfirmDelete = async () => {
    if (!currentProduct) return;

    try {
      const response = await axios.delete(`/api/products/${currentProduct._id}`);
      
      if (response.data.success) {
        toast.success('Product deleted successfully!');
        setDeleteDialog(false);
        setCurrentProduct(null);
        fetchCategoryData();
      }
    } catch (error) {
      console.error('Delete product error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete product');
    }
  };

  const handleColumnVisibilityMenuOpen = (event) => {
    setColumnVisibilityMenuAnchor(event.currentTarget);
  };

  const handleColumnVisibilityMenuClose = () => {
    setColumnVisibilityMenuAnchor(null);
  };

  const handleColumnVisibilityToggle = (column) => {
    setColumnVisibility(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const resetColumnVisibility = () => {
    setColumnVisibility({
      modelNumber: true,
      brand: true,
      hp: true,
      outlet: true,
      maxHead: true,
      maxFlow: true,
      watt: true,
      phase: true,
      price: true,
      actions: user?.role === 'admin',
    });
  };

  const canAddProduct = user?.role === 'admin' || user?.role === 'project_user';

  // Helper function to render toolbar buttons
  const renderToolbarButtons = () => (
    <Box sx={{ 
      display: 'flex', 
      flexWrap: 'wrap', 
      gap: 1,
      width: { xs: '100%', sm: 'auto' }
    }}>
      <Button
        startIcon={<FilterIcon />}
        onClick={() => setShowFilters(!showFilters)}
        size={isMobile ? "small" : "medium"}
        variant={showFilters ? "contained" : "outlined"}
      >
        Filters
      </Button>

      <Tooltip title="Column Visibility">
        <Button
          startIcon={<ViewColumnIcon />}
          onClick={handleColumnVisibilityMenuOpen}
          size={isMobile ? "small" : "medium"}
          variant="outlined"
        >
          {isMobile ? '' : 'Columns'}
        </Button>
      </Tooltip>

      <Button
        startIcon={<DownloadIcon />}
        onClick={handleExport}
        size={isMobile ? "small" : "medium"}
        variant="outlined"
      >
        {isMobile ? '' : 'Export'}
      </Button>

      {(user?.role === 'admin' || user?.role === 'project_user') && (
        <>
          <input
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            id="bulk-upload"
            type="file"
            onChange={handleBulkUpload}
            disabled={uploading}
          />
          <label htmlFor="bulk-upload">
            <Button
              component="span"
              startIcon={uploading ? <CircularProgress size={16} /> : <UploadIcon />}
              disabled={uploading}
              size={isMobile ? "small" : "medium"}
              variant="outlined"
            >
              {getUploadButtonText()}
            </Button>
          </label>

          <Button
            startIcon={<DownloadIcon />}
            onClick={downloadTemplate}
            size={isMobile ? "small" : "medium"}
            variant="outlined"
          >
            {isMobile ? '' : 'Template'}
          </Button>

          <Button
            startIcon={<AddIcon />}
            onClick={() => setAddDialog(true)}
            size={isMobile ? "small" : "medium"}
            variant="contained"
          >
            {isMobile ? '' : 'Add Product'}
          </Button>
        </>
      )}
    </Box>
  );

  // Helper function to render filter fields - comprehensive filtering for all data
  const renderFilterFields = () => (
    showFilters && (
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Brand</InputLabel>
              <Select
                value={filters.brand}
                label="Brand"
                onChange={(e) => handleFilterChange('brand', e.target.value)}
              >
                <MenuItem value="">All Brands</MenuItem>
                {brands.map((brand) => (
                  <MenuItem key={brand._id} value={brand._id}>
                    {brand.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="HP"
              type="number"
              value={filters.hp}
              onChange={(e) => handleFilterChange('hp', e.target.value)}
              placeholder="Filter by HP"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Outlet"
              value={filters.outlet}
              onChange={(e) => handleFilterChange('outlet', e.target.value)}
              placeholder="Filter by outlet"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Max Head"
              type="number"
              value={filters.maxHead}
              onChange={(e) => handleFilterChange('maxHead', e.target.value)}
              placeholder="Filter by max head (m)"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Max Flow"
              type="number"
              value={filters.maxFlow}
              onChange={(e) => handleFilterChange('maxFlow', e.target.value)}
              placeholder="Filter by max flow (l/min)"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Watt"
              type="number"
              value={filters.watt}
              onChange={(e) => handleFilterChange('watt', e.target.value)}
              placeholder="Filter by watt"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Phase"
              value={filters.phase}
              onChange={(e) => handleFilterChange('phase', e.target.value)}
              placeholder="Filter by phase"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Price"
              type="number"
              value={filters.price}
              onChange={(e) => handleFilterChange('price', e.target.value)}
              placeholder="Filter by price (LKR)"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Button
              fullWidth
              variant="outlined"
              onClick={clearFilters}
              sx={{ height: '56px' }}
            >
              Clear All Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>
    )
  );

  // Helper function to render column visibility menu - simplified
  const renderColumnVisibilityMenu = () => (
    <Menu
      anchorEl={columnVisibilityMenuAnchor}
      open={Boolean(columnVisibilityMenuAnchor)}
      onClose={handleColumnVisibilityMenuClose}
      slotProps={{
        paper: {
          sx: {
            maxHeight: 400,
            width: isMobile ? 280 : 320,
            p: 1,
          }
        }
      }}
    >
      <Box sx={{ p: 1 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
          Column Visibility
        </Typography>
        <Divider sx={{ mb: 1 }} />
        
        <FormControlLabel
          control={
            <Checkbox
              checked={columnVisibility.modelNumber}
              onChange={() => handleColumnVisibilityToggle('modelNumber')}
              size={isMobile ? "small" : "medium"}
            />
          }
          label="Model Number"
          sx={{ display: 'block', mb: 0.5 }}
        />
        
        <FormControlLabel
          control={
            <Checkbox
              checked={columnVisibility.brand}
              onChange={() => handleColumnVisibilityToggle('brand')}
              size={isMobile ? "small" : "medium"}
            />
          }
          label="Brand"
          sx={{ display: 'block', mb: 0.5 }}
        />
        
        <Typography variant="caption" sx={{ display: 'block', mt: 1, mb: 0.5, fontWeight: 'bold', color: 'text.secondary' }}>
          Additional Details:
        </Typography>
        
        <FormControlLabel
          control={
            <Checkbox
              checked={columnVisibility.hp}
              onChange={() => handleColumnVisibilityToggle('hp')}
              size={isMobile ? "small" : "medium"}
            />
          }
          label="HP"
          sx={{ display: 'block', mb: 0.5 }}
        />
        
        <FormControlLabel
          control={
            <Checkbox
              checked={columnVisibility.outlet}
              onChange={() => handleColumnVisibilityToggle('outlet')}
              size={isMobile ? "small" : "medium"}
            />
          }
          label="Outlet"
          sx={{ display: 'block', mb: 0.5 }}
        />
        
        <FormControlLabel
          control={
            <Checkbox
              checked={columnVisibility.maxHead}
              onChange={() => handleColumnVisibilityToggle('maxHead')}
              size={isMobile ? "small" : "medium"}
            />
          }
          label="Max Head"
          sx={{ display: 'block', mb: 0.5 }}
        />
        
        <FormControlLabel
          control={
            <Checkbox
              checked={columnVisibility.maxFlow}
              onChange={() => handleColumnVisibilityToggle('maxFlow')}
              size={isMobile ? "small" : "medium"}
            />
          }
          label="Max Flow"
          sx={{ display: 'block', mb: 0.5 }}
        />
        
        <FormControlLabel
          control={
            <Checkbox
              checked={columnVisibility.watt}
              onChange={() => handleColumnVisibilityToggle('watt')}
              size={isMobile ? "small" : "medium"}
            />
          }
          label="Watt"
          sx={{ display: 'block', mb: 0.5 }}
        />
        
        <FormControlLabel
          control={
            <Checkbox
              checked={columnVisibility.phase}
              onChange={() => handleColumnVisibilityToggle('phase')}
              size={isMobile ? "small" : "medium"}
            />
          }
          label="Phase"
          sx={{ display: 'block', mb: 0.5 }}
        />
        
        <FormControlLabel
          control={
            <Checkbox
              checked={columnVisibility.price}
              onChange={() => handleColumnVisibilityToggle('price')}
              size={isMobile ? "small" : "medium"}
            />
          }
          label="Price"
          sx={{ display: 'block', mb: 0.5 }}
        />
        
        {user?.role === 'admin' && (
          <FormControlLabel
            control={
              <Checkbox
                checked={columnVisibility.actions}
                onChange={() => handleColumnVisibilityToggle('actions')}
                size={isMobile ? "small" : "medium"}
              />
            }
            label="Actions"
            sx={{ display: 'block', mb: 1 }}
          />
        )}
        
        <Divider sx={{ my: 1 }} />
        
        <Button
          size="small"
          onClick={resetColumnVisibility}
          fullWidth
          variant="outlined"
        >
          Reset to Default
        </Button>
      </Box>
    </Menu>
  );

  // Helper function to render dialogs
  const renderDialogs = () => (
    <>
      {/* Add Product Dialog */}
      <Dialog 
        open={addDialog} 
        onClose={() => setAddDialog(false)} 
        maxWidth="md" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Add New Product</DialogTitle>
        <DialogContent>
          <AddProductForm 
            categoryId={categoryId}
            brands={brands}
            onSuccess={handleAddSuccess}
            onCancel={() => setAddDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog 
        open={editDialog} 
        onClose={() => setEditDialog(false)} 
        maxWidth="md" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Edit Product</DialogTitle>
        <DialogContent>
          <EditProductForm 
            product={currentProduct}
            brands={brands}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{currentProduct?.modelNumber}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!category) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <Container sx={{ mt: 4, flexGrow: 1 }}>
          <Alert severity="error">Category not found</Alert>
        </Container>
        <Footer />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      
      <Container maxWidth="xl" sx={{ mt: { xs: 2, md: 4 }, mb: 4, flexGrow: 1, px: { xs: 1, md: 3 } }}>
        {/* Header */}
        <Box sx={{ mb: { xs: 2, md: 3 } }}>
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            component="h1" 
            gutterBottom
            sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}
          >
            {category.name}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {filteredProducts.length} products found
          </Typography>
        </Box>

        {/* Toolbar */}
        <Paper sx={{ mb: 3 }}>
          <Toolbar 
            sx={{ 
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'stretch', sm: 'center' },
              gap: { xs: 1, sm: 0 },
              py: { xs: 2, sm: 1 }
            }}
          >
            {renderToolbarButtons()}

            <Box sx={{ flexGrow: 1 }} />
            
            <Chip 
              label={`${user?.role?.replace('_', ' ').toUpperCase()} View`}
              color="primary"
              size={isMobile ? "small" : "medium"}
            />
          </Toolbar>
        </Paper>

        {/* Filters */}
        {renderFilterFields()}

        {/* DataGrid */}
        <Paper elevation={3} sx={{
          height: isMobile ? 400 : 'auto',
          minHeight: isMobile ? 400 : 500,
          width: '100%',
          overflow: 'hidden',
          '& .MuiDataGrid-root': {
            border: 'none',
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            fontWeight: 600,
          },
          '& .MuiDataGrid-cell': {
            borderBottom: `1px solid ${theme.palette.divider}`,
          }
        }}>
          <DataGrid
            rows={filteredProducts}
            columns={columns}
            pageSize={isMobile ? 10 : 25}
            rowsPerPageOptions={isMobile ? [10, 25] : [25, 50, 100]}
            checkboxSelection={user?.role === 'admin' && !isMobile}
            disableSelectionOnClick
            getRowId={(row) => row._id}
            density={isMobile ? "compact" : "standard"}
            scrollbarSize={isMobile ? 8 : 17}
            columnVisibilityModel={{
              modelNumber: columnVisibility.modelNumber,
              brand: columnVisibility.brand,
              hp: columnVisibility.hp,
              outlet: columnVisibility.outlet,
              maxHead: columnVisibility.maxHead,
              maxFlow: columnVisibility.maxFlow,
              watt: columnVisibility.watt,
              phase: columnVisibility.phase,
              price: columnVisibility.price,
              actions: columnVisibility.actions,
            }}
            sx={{
              '& .MuiDataGrid-cell': {
                padding: isMobile ? '4px 8px' : '8px 16px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              },
              '& .MuiDataGrid-columnHeader': {
                padding: isMobile ? '4px 8px' : '8px 16px',
              },
              '& .MuiDataGrid-virtualScroller': {
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
              }
            }}
          />
        </Paper>

        {/* Mobile Add Button */}
        {canAddProduct && isMobile && (
          <Fab
            color="primary"
            aria-label="add"
            onClick={() => setAddDialog(true)}
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              zIndex: 1000,
            }}
          >
            <AddIcon />
          </Fab>
        )}
      </Container>

      <Footer />

      {/* Dialogs */}
      {renderDialogs()}

      {/* Column Visibility Menu */}
      {renderColumnVisibilityMenu()}
    </Box>
  );
};

export default CategoryDetails;