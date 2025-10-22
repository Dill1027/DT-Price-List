import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Chip,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  CardActions,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';

const AdminPanel = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [tabValue, setTabValue] = useState(0);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState(''); // 'add-category', 'edit-category', 'add-brand', 'edit-brand'
  const [currentItem, setCurrentItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  
  // Delete confirmation
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [categoriesRes, brandsRes] = await Promise.all([
        axios.get('/api/categories'),
        axios.get('/api/brands')
      ]);
      setCategories(categoriesRes.data.data);
      setBrands(brandsRes.data.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const openAddDialog = (type) => {
    setDialogType(type);
    setCurrentItem(null);
    setFormData({ name: '', description: '' });
    setOpenDialog(true);
  };

  const openEditDialog = (type, item) => {
    setDialogType(type);
    setCurrentItem(item);
    setFormData({ name: item.name, description: item.description || '' });
    setOpenDialog(true);
  };

  // Helper functions to reduce complexity
  const validateFormData = (formData) => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return false;
    }
    return true;
  };

  const getEndpointConfig = (dialogType) => {
    const isCategory = dialogType.includes('category');
    const isEdit = dialogType.includes('edit');
    const endpoint = isCategory ? '/api/categories' : '/api/brands';
    const itemType = isCategory ? 'Category' : 'Brand';
    
    return { isCategory, isEdit, endpoint, itemType };
  };

  const updateLocalState = (config, response, currentItem) => {
    const { isCategory, isEdit } = config;
    
    if (isEdit) {
      if (isCategory) {
        setCategories(prev => prev.map(cat => 
          cat._id === currentItem._id ? response.data.data : cat
        ));
      } else {
        setBrands(prev => prev.map(brand => 
          brand._id === currentItem._id ? response.data.data : brand
        ));
      }
    } else if (isCategory) {
      setCategories(prev => [...prev, response.data.data]);
    } else {
      setBrands(prev => [...prev, response.data.data]);
    }
  };

  const handleSave = async () => {
    if (!validateFormData(formData)) {
      return;
    }

    setSaving(true);
    try {
      const config = getEndpointConfig(dialogType);
      let response;

      if (config.isEdit) {
        response = await axios.put(`${config.endpoint}/${currentItem._id}`, formData);
      } else {
        response = await axios.post(config.endpoint, formData);
      }

      updateLocalState(config, response, currentItem);
      
      const action = config.isEdit ? 'updated' : 'added';
      toast.success(`${config.itemType} ${action} successfully`);
      setOpenDialog(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const openDeleteDialog = (item, type) => {
    setItemToDelete({ ...item, type });
    setDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    setDeleting(true);
    try {
      const isCategory = itemToDelete.type === 'category';
      const endpoint = isCategory ? '/api/categories' : '/api/brands';
      
      await axios.delete(`${endpoint}/${itemToDelete._id}`);
      
      // Refresh data from server instead of manually removing from local state
      // This ensures we get the updated data (category will be hidden since backend returns only active items)
      await fetchData();
      
      toast.success(`${isCategory ? 'Category' : 'Brand'} deleted successfully`);
      setDeleteDialog(false);
      setItemToDelete(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  // Render helper functions to reduce complexity
  const renderMobileCards = (items, itemType) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {items.map((item) => (
        <Card key={item._id} variant="outlined">
          <CardContent sx={{ pb: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              {item.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {item.description || 'No description'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Created: {new Date(item.createdAt).toLocaleDateString()}
            </Typography>
          </CardContent>
          <Divider />
          <CardActions sx={{ justifyContent: 'flex-end', p: 1 }}>
            <IconButton
              size="small"
              onClick={() => openEditDialog(`edit-${itemType}`, item)}
              color="primary"
            >
              <EditIcon />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={() => openDeleteDialog(item, itemType)}
            >
              <DeleteIcon />
            </IconButton>
          </CardActions>
        </Card>
      ))}
    </Box>
  );

  const renderDesktopTable = (items, itemType) => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Created</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item._id}>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.description || '-'}</TableCell>
              <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <IconButton
                  size="small"
                  onClick={() => openEditDialog(`edit-${itemType}`, item)}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => openDeleteDialog(item, itemType)}
                >
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderTabHeader = (title, addButtonText, onAdd) => (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      mb: 3,
      flexDirection: { xs: 'column', sm: 'row' },
      gap: { xs: 2, sm: 0 },
      alignItems: { xs: 'stretch', sm: 'center' }
    }}>
      <Typography 
        variant={isMobile ? "subtitle1" : "h6"}
        sx={{ fontWeight: 'bold' }}
      >
        {title}
      </Typography>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onAdd}
        size={isMobile ? "small" : "medium"}
        fullWidth={isMobile}
      >
        {addButtonText}
      </Button>
    </Box>
  );

  if (user?.role !== 'admin') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header showSearch={false} />
        <Container sx={{ mt: 4, flexGrow: 1 }}>
          <Typography variant="h5" color="error">
            Access Denied - Admin Only
          </Typography>
        </Container>
        <Footer />
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header showSearch={false} />
      
      <Container maxWidth="lg" sx={{ mt: { xs: 2, md: 4 }, mb: 4, flexGrow: 1, px: { xs: 2, sm: 3 } }}>
        <Box sx={{ mb: 3 }}>
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            component="h1" 
            gutterBottom
            sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}
          >
            Admin Panel
          </Typography>
          <Chip 
            label="Administrator"
            color="error"
            size={isMobile ? "small" : "medium"}
            sx={{ mb: 2 }}
          />
        </Box>

        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              '& .MuiTab-root': {
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                minWidth: { xs: 80, sm: 120 },
              }
            }}
            variant={isMobile ? "fullWidth" : "standard"}
          >
            <Tab label={`Categories (${categories.length})`} />
            <Tab label={`Brands (${brands.length})`} />
          </Tabs>

          {/* Categories Tab */}
          {tabValue === 0 && (
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              {renderTabHeader(
                'Manage Categories', 
                'Add Category', 
                () => openAddDialog('add-category')
              )}
              
              {isMobile ? 
                renderMobileCards(categories, 'category') : 
                renderDesktopTable(categories, 'category')
              }
            </Box>
          )}

          {/* Brands Tab */}
          {tabValue === 1 && (
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              {renderTabHeader(
                'Manage Brands', 
                'Add Brand', 
                () => openAddDialog('add-brand')
              )}
              
              {isMobile ? 
                renderMobileCards(brands, 'brand') : 
                renderDesktopTable(brands, 'brand')
              }
            </Box>
          )}
        </Paper>
      </Container>

      <Footer />

      {/* Add/Edit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          {dialogType.includes('add') ? 'Add' : 'Edit'} {dialogType.includes('category') ? 'Category' : 'Brand'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (Optional)"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialog} 
        onClose={() => setDeleteDialog(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Delete {itemToDelete?.type === 'category' ? 'Category' : 'Brand'}</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{itemToDelete?.name}"?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            Warning: This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleDelete} 
            variant="contained" 
            color="error"
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPanel;