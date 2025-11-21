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
  Card,
  CardContent,
  CardActions,
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
  Business as BusinessIcon,
  Memory as MemoryIcon,
  Power as PowerIcon,
  Speed as SpeedIcon,
  WaterDrop as WaterDropIcon,
  ElectricalServices as ElectricalServicesIcon,
} from '@mui/icons-material';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { saveAs } from 'file-saver';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import AddProductForm from '../components/AddProductForm';
import EditProductForm from '../components/EditProductForm';
import ExcelPreviewDialog from '../components/ExcelPreviewDialog';

const CategoryDetails = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
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
  const [mobileSearch, setMobileSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [retryUploadInfo, setRetryUploadInfo] = useState(null);
  const [uploadResultsDialog, setUploadResultsDialog] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  
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

  // Handle retry upload from error page
  useEffect(() => {
    if (location.state?.retryUpload || location.state?.fixAndRetry) {
      setRetryUploadInfo({
        previousErrors: location.state.previousErrors || [],
        suggestions: location.state.suggestions || [],
        uploadSummary: location.state.uploadSummary || {}
      });
      
      // Show helpful message
      if (location.state.retryUpload) {
        toast.info('Ready to retry upload. Please select your corrected Excel file.');
      } else if (location.state.fixAndRetry) {
        toast.info('Apply the suggested fixes to your Excel file before uploading.');
      }
      
      // Clear the navigation state
      navigate(location.pathname, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, filters, mobileSearch, isMobile]);

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
    
    // Apply mobile search or desktop filters
    if (isMobile && mobileSearch) {
      // Mobile: search only by model number
      filtered = filtered.filter(product => 
        product.modelNumber.toLowerCase().includes(mobileSearch.toLowerCase())
      );
    } else if (!isMobile) {
      // Desktop: apply all filters
      filtered = applyBrandFilter(filtered);
      filtered = applyHpFilter(filtered);
      filtered = applyOutletFilter(filtered);
      filtered = applyMaxHeadFilter(filtered);
      filtered = applyMaxFlowFilter(filtered);
      filtered = applyWattFilter(filtered);
      filtered = applyPhaseFilter(filtered);
      filtered = applyPriceFilter(filtered);
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

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('Please select a valid Excel file (.xlsx, .xls) or CSV file');
      event.target.value = '';
      return;
    }

    setSelectedFile(file);
    setPreviewDialog(true);
    event.target.value = '';
  };

  const handleConfirmUpload = async (previewData) => {
    if (!selectedFile) return;

    // Create FormData with the original file for server processing
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('categoryId', categoryId);
    
    // Also send the preview data for validation
    formData.append('previewData', JSON.stringify(previewData));

    setUploading(true);
    try {
      const response = await axios.post('/api/products/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Store detailed results for dialog display
      const data = response.data.data;
      const summary = data.summary;
      
      setUploadResults({
        success: true,
        summary,
        errors: data.errors || [],
        totalProcessed: (summary?.created || 0) + (summary?.priceUpdated || 0) + (summary?.detailsUpdated || 0) + (summary?.noChangeNeeded || 0),
        categoryName: category?.name || 'Unknown Category'
      });
      
      // Show results dialog
      setUploadResultsDialog(true);
      
      // Quick toast for immediate feedback
      const hasErrors = data.errors && data.errors.length > 0;
      if (hasErrors) {
        toast.success(`Upload completed with ${data.errors.length} issue(s). Click 'View Details' for more info.`);
      } else {
        toast.success('Upload completed successfully!');
      }
      
      fetchCategoryData();
      setPreviewDialog(false);
      setSelectedFile(null);
    } catch (error) {
      // Store error results for dialog
      setUploadResults({
        success: false,
        error: error.response?.data?.message || 'Failed to upload products',
        details: error.response?.data?.details || 'Unknown error occurred',
        categoryName: category?.name || 'Unknown Category'
      });
      
      setUploadResultsDialog(true);
      toast.error('Upload failed. Click \'View Details\' for more information.');
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

  // Bulk delete functions
  const handleBulkDelete = () => {
    console.log('handleBulkDelete called, selectedProducts:', selectedProducts);
    if (selectedProducts.length === 0) {
      toast.error('Please select products to delete');
      return;
    }
    setBulkDeleteDialog(true);
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedProducts.length === 0) return;

    setBulkDeleting(true);
    try {
      const response = await axios.post('/api/products/bulk-delete', {
        productIds: selectedProducts
      });
      
      if (response.data.success) {
        const { data } = response.data;
        toast.success(`Successfully deleted ${data.deleted} product(s)!`);
        setBulkDeleteDialog(false);
        setSelectedProducts([]);
        fetchCategoryData();
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete products');
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleCancelBulkDelete = () => {
    setBulkDeleteDialog(false);
  };

  const handleSelectionModelChange = (newSelectionModel) => {
    console.log('Row selection model changed:', newSelectionModel);
    setSelectedProducts(newSelectionModel);
    console.log('Current row selection model:', newSelectionModel);
  };  const handleColumnVisibilityMenuOpen = (event) => {
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

  // Mobile-friendly product card component
  const renderMobileProductCard = (product) => (
    <Card key={product._id} sx={{ mb: 2, position: 'relative' }}>
      <CardContent sx={{ pb: 1 }}>
        {/* Header with Model Number and Brand */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
              {product.modelNumber}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
              <BusinessIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
              <Typography variant="body2" color="text.secondary">
                {product.brand?.name || 'N/A'}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold' }}>
              {product.price ? new Intl.NumberFormat('en-LK', {
                style: 'currency',
                currency: 'LKR',
                minimumFractionDigits: 0,
              }).format(product.price) : 'N/A'}
            </Typography>
          </Box>
        </Box>

        {/* Product Details Grid */}
        <Grid container spacing={1} sx={{ mt: 1 }}>
          {product.hp && (
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PowerIcon sx={{ fontSize: 16, color: 'primary.main', mr: 1 }} />
                <Box>
                  <Typography variant="caption" display="block" color="text.secondary">HP</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{product.hp}</Typography>
                </Box>
              </Box>
            </Grid>
          )}
          
          {product.outlet && (
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <WaterDropIcon sx={{ fontSize: 16, color: 'info.main', mr: 1 }} />
                <Box>
                  <Typography variant="caption" display="block" color="text.secondary">Outlet</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{product.outlet}</Typography>
                </Box>
              </Box>
            </Grid>
          )}
          
          {product.maxHead && (
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SpeedIcon sx={{ fontSize: 16, color: 'warning.main', mr: 1 }} />
                <Box>
                  <Typography variant="caption" display="block" color="text.secondary">Max Head</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{product.maxHead}m</Typography>
                </Box>
              </Box>
            </Grid>
          )}
          
          {product.maxFlow && (
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <WaterDropIcon sx={{ fontSize: 16, color: 'info.main', mr: 1 }} />
                <Box>
                  <Typography variant="caption" display="block" color="text.secondary">Max Flow</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{product.maxFlow} l/min</Typography>
                </Box>
              </Box>
            </Grid>
          )}
          
          {product.watt && (
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ElectricalServicesIcon sx={{ fontSize: 16, color: 'secondary.main', mr: 1 }} />
                <Box>
                  <Typography variant="caption" display="block" color="text.secondary">Watt</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{product.watt}W</Typography>
                </Box>
              </Box>
            </Grid>
          )}
          
          {product.phase && (
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <MemoryIcon sx={{ fontSize: 16, color: 'error.main', mr: 1 }} />
                <Box>
                  <Typography variant="caption" display="block" color="text.secondary">Phase</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{product.phase}</Typography>
                </Box>
              </Box>
            </Grid>
          )}
        </Grid>
      </CardContent>
      
      {/* Actions for Admin */}
      {user?.role === 'admin' && (
        <CardActions sx={{ pt: 0, pb: 2, px: 2 }}>
          <Button
            size="small"
            startIcon={<EditIcon />}
            onClick={() => handleEdit(product)}
            variant="outlined"
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          <Button
            size="small"
            startIcon={<DeleteIcon />}
            onClick={() => handleDelete(product)}
            color="error"
            variant="outlined"
          >
            Delete
          </Button>
        </CardActions>
      )}
      
      {/* Selection Checkbox for Admin (Mobile) */}
      {user?.role === 'admin' && (
        <Checkbox
          checked={selectedProducts.includes(product._id)}
          onChange={(e) => {
            const newSelection = e.target.checked 
              ? [...selectedProducts, product._id]
              : selectedProducts.filter(id => id !== product._id);
            setSelectedProducts(newSelection);
          }}
          size="small"
          sx={{ 
            position: 'absolute', 
            bottom: 4, 
            right: 4,
            zIndex: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '50%',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 1)',
            }
          }}
        />
      )}
    </Card>
  );

  // Helper function to render toolbar buttons
  const renderToolbarButtons = () => {
    if (isMobile) {
      // Mobile: Simplified toolbar with essential actions only
      return (
        <Box sx={{ width: '100%' }}>
          {/* Mobile Search Bar */}
          <TextField
            fullWidth
            placeholder="Search by model number..."
            value={mobileSearch}
            onChange={(e) => setMobileSearch(e.target.value)}
            size="small"
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <FilterIcon sx={{ color: 'action.active', mr: 1 }} />
              ),
            }}
          />
          
          {/* Mobile Action Buttons */}
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 1,
            justifyContent: 'center'
          }}>
            <Button
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              size="small"
              variant="outlined"
              sx={{ minWidth: 80 }}
            >
              Export
            </Button>
            
            {(user?.role === 'admin' || user?.role === 'project_user') && (
              <>
                <input
                  accept=".xlsx,.xls,.csv"
                  style={{ display: 'none' }}
                  id="mobile-bulk-upload"
                  type="file"
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
                <label htmlFor="mobile-bulk-upload">
                  <Button
                    component="span"
                    startIcon={uploading ? <CircularProgress size={16} /> : <UploadIcon />}
                    disabled={uploading}
                    size="small"
                    variant="outlined"
                    sx={{ minWidth: 80 }}
                  >
                    Import
                  </Button>
                </label>
                
                <Button
                  startIcon={<DownloadIcon />}
                  onClick={downloadTemplate}
                  size="small"
                  variant="outlined"
                  sx={{ minWidth: 90 }}
                >
                  Template
                </Button>
                
                {user?.role === 'admin' && selectedProducts.length > 0 && (
                  <Button
                    startIcon={<DeleteIcon />}
                    onClick={handleBulkDelete}
                    size="small"
                    variant="outlined"
                    color="error"
                    sx={{ minWidth: 80 }}
                  >
                    Delete ({selectedProducts.length})
                  </Button>
                )}
              </>
            )}
          </Box>
        </Box>
      );
    }
    
    // Desktop: Full toolbar with all features
    return (
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 1,
        width: { xs: '100%', sm: 'auto' }
      }}>
        <Button
          startIcon={<FilterIcon />}
          onClick={() => setShowFilters(!showFilters)}
          size="medium"
          variant={showFilters ? "contained" : "outlined"}
        >
          Filters
        </Button>

        <Tooltip title="Column Visibility">
          <Button
            startIcon={<ViewColumnIcon />}
            onClick={handleColumnVisibilityMenuOpen}
            size="medium"
            variant="outlined"
          >
            Columns
          </Button>
        </Tooltip>

        <Button
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          size="medium"
          variant="outlined"
        >
          Export
        </Button>

        {(user?.role === 'admin' || user?.role === 'project_user') && (
          <>
            <input
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              id="bulk-upload"
              type="file"
              onChange={handleFileSelect}
              disabled={uploading}
            />
            <label htmlFor="bulk-upload">
              <Button
                component="span"
                startIcon={uploading ? <CircularProgress size={16} /> : <UploadIcon />}
                disabled={uploading}
                size="medium"
                variant="outlined"
              >
                Import
              </Button>
            </label>

            <Button
              startIcon={<DownloadIcon />}
              onClick={downloadTemplate}
              size="medium"
              variant="outlined"
            >
              Template
            </Button>

            <Button
              startIcon={<AddIcon />}
              onClick={() => setAddDialog(true)}
              size="medium"
              variant="contained"
            >
              Add Product
            </Button>

            {user?.role === 'admin' && (
              <Button
                startIcon={<DeleteIcon />}
                onClick={handleBulkDelete}
                size="medium"
                variant="outlined"
                color="error"
                disabled={selectedProducts.length === 0}
              >
                Delete ({selectedProducts.length})
              </Button>
            )}
          </>
        )}
      </Box>
    );
  };

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

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog 
        open={bulkDeleteDialog} 
        onClose={handleCancelBulkDelete}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Bulk Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedProducts.length} selected product(s)? 
            This action cannot be undone and will permanently remove these products from the database.
          </DialogContentText>
          {selectedProducts.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Selected products will be deleted:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedProducts.length} product(s) selected
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelBulkDelete}>Cancel</Button>
          <Button 
            onClick={handleConfirmBulkDelete} 
            color="error" 
            variant="contained"
            disabled={bulkDeleting}
            startIcon={bulkDeleting ? <CircularProgress size={20} /> : null}
          >
            {bulkDeleting ? 'Deleting...' : `Delete ${selectedProducts.length} Product(s)`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Results Dialog */}
      {uploadResults && (
        <Dialog 
          open={uploadResultsDialog}
          onClose={() => {
            setUploadResultsDialog(false);
            setUploadResults(null);
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {uploadResults.success ? (
                <span style={{ color: '#4caf50', fontSize: '24px' }}>✅</span>
              ) : (
                <span style={{ color: '#f44336', fontSize: '24px' }}>❌</span>
              )}
              <Typography variant="h6">
                Upload {uploadResults.success ? 'Completed' : 'Failed'}
              </Typography>
            </Box>
          </DialogTitle>
          
          <DialogContent>
            {uploadResults.success ? (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Upload Summary for {uploadResults.categoryName}
                </Typography>
                
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.50' }}>
                      <Typography variant="h4" color="success.main">
                        {uploadResults.summary?.created || 0}
                      </Typography>
                      <Typography variant="body2">New Products</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.50' }}>
                      <Typography variant="h4" color="info.main">
                        {uploadResults.summary?.priceUpdated || 0}
                      </Typography>
                      <Typography variant="body2">Price Updates</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.50' }}>
                      <Typography variant="h4" color="warning.main">
                        {uploadResults.summary?.detailsUpdated || 0}
                      </Typography>
                      <Typography variant="body2">Detail Updates</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.100' }}>
                      <Typography variant="h4" color="text.secondary">
                        {uploadResults.summary?.noChangeNeeded || 0}
                      </Typography>
                      <Typography variant="body2">No Changes</Typography>
                    </Paper>
                  </Grid>
                </Grid>
                
                {uploadResults.errors.length > 0 && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      {uploadResults.errors.length} issue(s) occurred during upload:
                    </Typography>
                    <Typography variant="body2">
                      Some rows had validation errors. You can view detailed error information or retry the upload with corrections.
                    </Typography>
                  </Alert>
                )}
                
                <Typography variant="body1" color="text.secondary">
                  Total processed: {uploadResults.totalProcessed} rows
                </Typography>
              </Box>
            ) : (
              <Box>
                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Upload Failed
                  </Typography>
                  <Typography variant="body2">
                    {uploadResults.error}
                  </Typography>
                </Alert>
                
                {uploadResults.details && (
                  <Typography variant="body2" color="text.secondary">
                    {uploadResults.details}
                  </Typography>
                )}
              </Box>
            )}
          </DialogContent>
          
          <DialogActions>
            {uploadResults.success && uploadResults.errors.length > 0 && (
              <Button
                onClick={() => {
                  setUploadResultsDialog(false);
                  navigate('/upload-errors', {
                    state: {
                      errors: uploadResults.errors,
                      summary: uploadResults.summary,
                      categoryName: uploadResults.categoryName,
                      categoryId: categoryId
                    }
                  });
                }}
                color="warning"
                startIcon={<span>⚠️</span>}
              >
                View Errors ({uploadResults.errors.length})
              </Button>
            )}
            
            {!uploadResults.success && (
              <Button
                onClick={() => {
                  setUploadResultsDialog(false);
                  setUploadResults(null);
                  // Reset for retry
                }}
                color="primary"
                variant="outlined"
              >
                Try Again
              </Button>
            )}
            
            <Button
              onClick={() => {
                setUploadResultsDialog(false);
                setUploadResults(null);
              }}
              color="primary"
              variant="contained"
            >
              {uploadResults.success ? 'Done' : 'Close'}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Excel Preview Dialog */}
      <ExcelPreviewDialog
        open={previewDialog}
        onClose={() => {
          setPreviewDialog(false);
          setSelectedFile(null);
        }}
        file={selectedFile}
        brands={brands}
        categoryId={categoryId}
        onUploadConfirm={handleConfirmUpload}
        uploading={uploading}
      />
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

        {/* Retry Upload Notification */}
        {retryUploadInfo && (
          <Alert 
            severity="info" 
            sx={{ mb: 3 }}
            action={
              <Button 
                size="small" 
                onClick={() => setRetryUploadInfo(null)}
                color="inherit"
              >
                Dismiss
              </Button>
            }
          >
            <Typography variant="subtitle2" gutterBottom>
              Previous upload had {retryUploadInfo.previousErrors.length} error(s)
            </Typography>
            <Typography variant="body2">
              Please review and fix the errors in your Excel file before uploading again.
              {retryUploadInfo.suggestions.length > 0 && (
                <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                  {retryUploadInfo.suggestions.slice(0, 3).map((suggestion, index) => (
                    <li key={index}>
                      <Typography variant="caption">{suggestion.action}</Typography>
                    </li>
                  ))}
                </Box>
              )}
            </Typography>
          </Alert>
        )}

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

        {/* Filters - Desktop Only */}
        {!isMobile && renderFilterFields()}

        {/* Products Display - Mobile Cards vs Desktop DataGrid */}
        {isMobile ? (
          /* Mobile Card Layout */
          <Box sx={{ mb: 2 }}>
            {/* Mobile bulk actions */}
            {user?.role === 'admin' && selectedProducts.length > 0 && (
              <Paper sx={{ p: 2, mb: 2, bgcolor: 'action.hover' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    {selectedProducts.length} product(s) selected
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<DeleteIcon />}
                    onClick={handleBulkDelete}
                    color="error"
                    variant="contained"
                  >
                    Delete Selected
                  </Button>
                </Box>
              </Paper>
            )}
            
            {/* Product Cards */}
            {filteredProducts.length > 0 ? (
              filteredProducts.map(product => renderMobileProductCard(product))
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  No products found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Try adjusting your filters or add new products
                </Typography>
              </Paper>
            )}
          </Box>
        ) : (
          /* Desktop DataGrid */
          <Paper elevation={3} sx={{
            height: 'auto',
            minHeight: 500,
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
              pageSize={100}
              rowsPerPageOptions={[25, 50, 100]}
              checkboxSelection={user?.role === 'admin'}
              disableSelectionOnClick
              getRowId={(row) => row._id}
              rowSelectionModel={selectedProducts}
              onRowSelectionModelChange={handleSelectionModelChange}
              density="standard"
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
                  padding: '8px 16px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                },
                '& .MuiDataGrid-columnHeader': {
                  padding: '8px 16px',
                },
                '& .MuiDataGrid-virtualScroller': {
                  overflowX: 'auto',
                  WebkitOverflowScrolling: 'touch',
                }
              }}
            />
          </Paper>
        )}

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