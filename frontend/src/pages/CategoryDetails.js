import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Chip,
  Grid,
  TextField,
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
  DialogActions,
  Fab,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Download as DownloadIcon,
  Upload as UploadIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
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
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    brand: '',
    phase: '',
    minHp: '',
    maxHp: '',
    minPrice: '',
    maxPrice: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [uploading, setUploading] = useState(false);

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
        axios.get(`/api/categories`),
        axios.get(`/api/products/category/${categoryId}`)
      ]);

      const currentCategory = categoryRes.data.data.find(cat => cat._id === categoryId);
      setCategory(currentCategory);
      setProducts(productsRes.data.data);
    } catch (error) {
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
      console.error('Failed to fetch brands');
    }
  };

  const handleAddSuccess = (newProduct) => {
    setProducts(prev => [...prev, newProduct]);
    setAddDialog(false);
    toast.success('Product added successfully!');
  };

  const applyFilters = () => {
    let filtered = [...products];

    if (filters.brand) {
      filtered = filtered.filter(product => product.brand._id === filters.brand);
    }

    if (filters.phase) {
      filtered = filtered.filter(product => product.phase === filters.phase);
    }

    if (filters.minHp) {
      filtered = filtered.filter(product => product.hp >= Number(filters.minHp));
    }

    if (filters.maxHp) {
      filtered = filtered.filter(product => product.hp <= Number(filters.maxHp));
    }

    if (filters.minPrice && user?.role !== 'employee') {
      filtered = filtered.filter(product => product.price >= Number(filters.minPrice));
    }

    if (filters.maxPrice && user?.role !== 'employee') {
      filtered = filtered.filter(product => product.price <= Number(filters.maxPrice));
    }

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
      phase: '',
      minHp: '',
      maxHp: '',
      minPrice: '',
      maxPrice: '',
    });
  };

  const handleExport = async () => {
    try {
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
      toast.error('Failed to export data');
    }
  };

  const handleBulkUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const response = await axios.post('/api/products/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success(response.data.message);
      fetchCategoryData(); // Refresh data
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      event.target.value = ''; // Reset file input
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

      saveAs(blob, 'product-template.xlsx');
      toast.success('Template downloaded');
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  const columns = [
    { field: 'modelNumber', headerName: 'Model Number', width: 150 },
    { 
      field: 'brand', 
      headerName: 'Brand', 
      width: 120,
      valueGetter: (params) => params.row.brand?.name || ''
    },
    { field: 'hp', headerName: 'HP', width: 80, type: 'number' },
    { field: 'outlet', headerName: 'Outlet', width: 100 },
    { field: 'maxHead', headerName: 'Max Head', width: 100, type: 'number' },
    { field: 'watt', headerName: 'Watt', width: 100, type: 'number' },
    { field: 'phase', headerName: 'Phase', width: 100 },
    ...(user?.role !== 'employee' ? [{
      field: 'price',
      headerName: 'Price',
      width: 100,
      type: 'number',
      valueFormatter: (params) => `Rs.${params.value?.toLocaleString() || 0}`
    }] : []),
    ...(user?.role === 'admin' ? [{
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
    }] : [])
  ];

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
    fetchCategoryData(); // Refresh the data
  };

  const handleConfirmDelete = async () => {
    if (!currentProduct) return;

    try {
      const response = await axios.delete(`/api/products/${currentProduct._id}`);
      
      if (response.data.success) {
        toast.success('Product deleted successfully!');
        setDeleteDialog(false);
        setCurrentProduct(null);
        fetchCategoryData(); // Refresh the data
      }
    } catch (error) {
      console.error('Delete product error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete product');
    }
  };

  const canAddProduct = user?.role === 'admin' || user?.role === 'project_user';
  const canBulkUpload = user?.role === 'admin' || user?.role === 'project_user';

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
      
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {category.name}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {filteredProducts.length} products found
          </Typography>
        </Box>

        {/* Toolbar */}
        <Paper sx={{ mb: 3 }}>
          <Toolbar>
            <Button
              startIcon={<FilterIcon />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{ mr: 2 }}
            >
              Filters
            </Button>
            
            <Button
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              sx={{ mr: 2 }}
            >
              Export
            </Button>

            {canBulkUpload && (
              <>
                <Button
                  startIcon={<DownloadIcon />}
                  onClick={downloadTemplate}
                  sx={{ mr: 2 }}
                >
                  Template
                </Button>
                
                <Button
                  component="label"
                  startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
                  disabled={uploading}
                  sx={{ mr: 2 }}
                >
                  Upload
                  <input
                    type="file"
                    hidden
                    accept=".xlsx,.xls"
                    onChange={handleBulkUpload}
                  />
                </Button>
              </>
            )}

            <Box sx={{ flexGrow: 1 }} />
            
            <Chip 
              label={`${user?.role?.replace('_', ' ').toUpperCase()} View`}
              color="primary"
              size="small"
            />
          </Toolbar>
        </Paper>

        {/* Filters */}
        {showFilters && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Filters
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Brand</InputLabel>
                  <Select
                    value={filters.brand}
                    onChange={(e) => handleFilterChange('brand', e.target.value)}
                  >
                    <MenuItem value="">All Brands</MenuItem>
                    {brands.map(brand => (
                      <MenuItem key={brand._id} value={brand._id}>
                        {brand.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Phase</InputLabel>
                  <Select
                    value={filters.phase}
                    onChange={(e) => handleFilterChange('phase', e.target.value)}
                  >
                    <MenuItem value="">All Phases</MenuItem>
                    <MenuItem value="1 Phase">1 Phase</MenuItem>
                    <MenuItem value="3 Phase">3 Phase</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Min HP"
                  type="number"
                  value={filters.minHp}
                  onChange={(e) => handleFilterChange('minHp', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Max HP"
                  type="number"
                  value={filters.maxHp}
                  onChange={(e) => handleFilterChange('maxHp', e.target.value)}
                />
              </Grid>

              {user?.role !== 'employee' && (
                <>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Min Price"
                      type="number"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Max Price"
                      type="number"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    />
                  </Grid>
                </>
              )}

              <Grid item xs={12}>
                <Button onClick={clearFilters} variant="outlined">
                  Clear Filters
                </Button>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Data Grid */}
        <Paper sx={{ height: 600 }}>
          <DataGrid
            rows={filteredProducts}
            columns={columns}
            pageSize={25}
            rowsPerPageOptions={[25, 50, 100]}
            checkboxSelection={user?.role === 'admin'}
            disableSelectionOnClick
            onSelectionModelChange={setSelectedRows}
            getRowId={(row) => row._id}
          />
        </Paper>
      </Container>

      <Footer />

      {/* Add Product Dialog */}
      <Dialog 
        open={addDialog} 
        onClose={() => setAddDialog(false)} 
        maxWidth="md" 
        fullWidth
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
      <Dialog 
        open={deleteDialog} 
        onClose={() => setDeleteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the product "{currentProduct?.modelNumber}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialog(false)}
            color="inherit"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Product FAB */}
      {canAddProduct && (
        <Fab
          color="primary"
          aria-label="add product"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
          }}
          onClick={() => setAddDialog(true)}
        >
          <AddIcon />
        </Fab>
      )}
    </Box>
  );
};

export default CategoryDetails;