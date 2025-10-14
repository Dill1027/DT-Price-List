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

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setSaving(true);
    try {
      let response;
      const isCategory = dialogType.includes('category');
      const isEdit = dialogType.includes('edit');
      const endpoint = isCategory ? '/api/categories' : '/api/brands';

      if (isEdit) {
        response = await axios.put(`${endpoint}/${currentItem._id}`, formData);
        // Update local state
        if (isCategory) {
          setCategories(prev => prev.map(cat => 
            cat._id === currentItem._id ? response.data.data : cat
          ));
        } else {
          setBrands(prev => prev.map(brand => 
            brand._id === currentItem._id ? response.data.data : brand
          ));
        }
        toast.success(`${isCategory ? 'Category' : 'Brand'} updated successfully`);
      } else {
        response = await axios.post(endpoint, formData);
        // Add to local state
        if (isCategory) {
          setCategories(prev => [...prev, response.data.data]);
        } else {
          setBrands(prev => [...prev, response.data.data]);
        }
        toast.success(`${isCategory ? 'Category' : 'Brand'} added successfully`);
      }

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
      
      // Remove from local state
      if (isCategory) {
        setCategories(prev => prev.filter(cat => cat._id !== itemToDelete._id));
      } else {
        setBrands(prev => prev.filter(brand => brand._id !== itemToDelete._id));
      }
      
      toast.success(`${isCategory ? 'Category' : 'Brand'} deleted successfully`);
      setDeleteDialog(false);
      setItemToDelete(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

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
      
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Admin Panel
          </Typography>
          <Chip 
            label="Administrator"
            color="error"
            sx={{ mb: 2 }}
          />
        </Box>

        <Paper sx={{ width: '100%' }}>
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label={`Categories (${categories.length})`} />
            <Tab label={`Brands (${brands.length})`} />
          </Tabs>

          {/* Categories Tab */}
          {tabValue === 0 && (
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Manage Categories</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => openAddDialog('add-category')}
                >
                  Add Category
                </Button>
              </Box>

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
                    {categories.map((category) => (
                      <TableRow key={category._id}>
                        <TableCell>{category.name}</TableCell>
                        <TableCell>{category.description || '-'}</TableCell>
                        <TableCell>{new Date(category.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => openEditDialog('edit-category', category)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => openDeleteDialog(category, 'category')}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Brands Tab */}
          {tabValue === 1 && (
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Manage Brands</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => openAddDialog('add-brand')}
                >
                  Add Brand
                </Button>
              </Box>

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
                    {brands.map((brand) => (
                      <TableRow key={brand._id}>
                        <TableCell>{brand.name}</TableCell>
                        <TableCell>{brand.description || '-'}</TableCell>
                        <TableCell>{new Date(brand.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => openEditDialog('edit-brand', brand)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => openDeleteDialog(brand, 'brand')}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Paper>
      </Container>

      <Footer />

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
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
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="sm" fullWidth>
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