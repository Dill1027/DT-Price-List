import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Box,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  Chip,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import { 
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data.data);
      setFilteredCategories(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchTerm) => {
    if (!searchTerm.trim()) {
      setFilteredCategories(categories);
    } else {
      // First try to filter categories locally
      const filtered = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCategories(filtered);
      
      // If no categories match and search term looks like it might be for products,
      // the user can press Enter in the search bar to go to global search
    }
  };

  const handleCategoryClick = (categoryId) => {
    navigate(`/category/${categoryId}`);
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setSaving(true);
    try {
      const response = await axios.post('/api/categories', newCategory);
      const updatedCategories = [...categories, response.data.data];
      setCategories(updatedCategories);
      setFilteredCategories(updatedCategories);
      setOpenDialog(false);
      setNewCategory({ name: '', description: '' });
      toast.success('Category added successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add category');
    } finally {
      setSaving(false);
    }
  };

  const handleMenuOpen = (event, category) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedCategory(category);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCategory(null);
  };

  const handleDeleteClick = () => {
    setCategoryToDelete(selectedCategory);
    setDeleteDialog(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    setDeleting(true);
    try {
      await axios.delete(`/api/categories/${categoryToDelete._id}`);
      const updatedCategories = categories.filter(cat => cat._id !== categoryToDelete._id);
      setCategories(updatedCategories);
      setFilteredCategories(updatedCategories);
      setDeleteDialog(false);
      setCategoryToDelete(null);
      toast.success('Category deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete category');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog(false);
    setCategoryToDelete(null);
  };

  const canAddCategory = user?.role === 'admin';

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header onSearch={handleSearch} />
      
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Price List Categories
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Select a category to view products
          </Typography>
          {user && (
            <Chip 
              label={`Logged in as ${user.role.replace('_', ' ').toUpperCase()}`}
              color="primary"
              sx={{ mt: 2 }}
            />
          )}
        </Box>

        <Grid container spacing={3}>
          {filteredCategories.map((category) => (
            <Grid item xs={12} sm={6} md={4} key={category._id}>
              <Card 
                sx={{ 
                  height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  position: 'relative',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
              >
                {/* Admin Menu */}
                {canAddCategory && (
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, category)}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      },
                    }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                )}

                <CardActionArea 
                  onClick={() => handleCategoryClick(category._id)}
                  sx={{ height: '100%' }}
                >
                  <CardContent sx={{ p: 3, pr: canAddCategory ? 5 : 3 }}>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {category.name}
                    </Typography>
                    {category.description && (
                      <Typography variant="body2" color="text.secondary">
                        {category.description}
                      </Typography>
                    )}
                    <Typography variant="caption" display="block" sx={{ mt: 2 }}>
                      Created: {new Date(category.createdAt).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>

        {filteredCategories.length === 0 && categories.length > 0 && (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No categories found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Press <strong>Enter</strong> in the search bar to search for products instead
            </Typography>
          </Box>
        )}
      </Container>

      <Footer />

      {/* Add Category FAB */}
      {canAddCategory && (
        <Fab
          color="primary"
          aria-label="add category"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
          }}
          onClick={() => setOpenDialog(true)}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Category Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={handleDeleteClick}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Category
        </MenuItem>
      </Menu>

      {/* Add Category Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Category</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Category Name"
            fullWidth
            variant="outlined"
            value={newCategory.name}
            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (Optional)"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newCategory.description}
            onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleAddCategory} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Add Category'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Category Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={handleDeleteCancel} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Category</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the category "{categoryToDelete?.name}"?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            Warning: This action cannot be undone. All products in this category will need to be reassigned.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button 
            onClick={handleDeleteConfirm} 
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

export default Home;