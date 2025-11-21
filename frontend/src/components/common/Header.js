import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  TextField,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  InputAdornment,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Home as HomeIcon,
  AccountCircle,
  Logout,
  Person,
  AdminPanelSettings,
  Menu as MenuIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { saveAs } from 'file-saver';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({ onSearch = null, showSearch = true }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [actionsMenuAnchor, setActionsMenuAnchor] = useState(null);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    navigate('/profile');
    handleMenuClose();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleMenuClose();
  };

  const handleAdmin = () => {
    navigate('/admin');
    handleMenuClose();
  };

  const handleSearch = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleSearchIconClick = () => {
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  // Export all products functionality
  const handleExportAllProducts = async () => {
    try {
      const response = await axios.get('/api/products/export', {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      saveAs(blob, 'all-products-export.xlsx');
      toast.success('All products exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export products');
    }
    setActionsMenuAnchor(null);
  };

  // Bulk upload functionality
  const handleBulkUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const response = await axios.post('/api/products/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = response.data.data;
      const summary = data.summary;
      
      let successMsg = 'Upload completed! ';
      const details = [];
      
      if (summary?.created > 0) details.push(`${summary.created} new products`);
      if (summary?.priceUpdated > 0) details.push(`${summary.priceUpdated} prices updated`);
      if (summary?.detailsUpdated > 0) details.push(`${summary.detailsUpdated} details updated`);
      if (summary?.noChangeNeeded > 0) details.push(`${summary.noChangeNeeded} unchanged`);
      
      if (details.length > 0) {
        successMsg += details.join(', ');
      }
      
      if (data.errors && data.errors.length > 0) {
        successMsg += `. ${data.errors.length} errors occurred.`;
      }

      toast.success(successMsg);
      event.target.value = '';
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload products');
    } finally {
      setUploading(false);
    }
    setActionsMenuAnchor(null);
  };

  // Download template
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
    setActionsMenuAnchor(null);
  };

  const handleActionsMenuOpen = (event) => {
    setActionsMenuAnchor(event.currentTarget);
  };

  const handleActionsMenuClose = () => {
    setActionsMenuAnchor(null);
  };

  const isMenuOpen = Boolean(anchorEl);
  const isActionsMenuOpen = Boolean(actionsMenuAnchor);
  const canManageProducts = user?.role === 'admin' || user?.role === 'project_user';

  return (
    <>
      <AppBar position="static" elevation={2}>
        <Toolbar>
          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileMenuOpen(true)}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', mr: { xs: 1, md: 3 } }}>
            <Typography
              variant="h6"
              component="div"
              sx={{ 
                fontWeight: 'bold',
                color: 'white',
                cursor: 'pointer',
                fontSize: { xs: '1rem', md: '1.25rem' }
              }}
              onClick={handleHomeClick}
            >
              Deep Tec
            </Typography>
          </Box>

          {/* Desktop Navigation */}
          {!isMobile && (
            <>
              <IconButton
                color="inherit"
                onClick={handleHomeClick}
                sx={{ mr: 2 }}
              >
                <HomeIcon />
              </IconButton>
              
              {/* Actions Button for Desktop */}
              {canManageProducts && (
                <Tooltip title="Product Actions">
                  <IconButton
                    color="inherit"
                    onClick={handleActionsMenuOpen}
                    sx={{ mr: 2 }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Tooltip>
              )}
            </>
          )}

          {/* Search Bar - Desktop */}
          {showSearch && !isMobile && (
            <Box sx={{ flexGrow: 1, maxWidth: 600, mx: 2 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search by Model, Category, Brand, HP, Watt, Outlet, Phase..."
                value={searchTerm}
                onChange={handleSearch}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchIconClick();
                  }
                }}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon 
                        sx={{ cursor: 'pointer' }}
                        onClick={handleSearchIconClick}
                      />
                    </InputAdornment>
                  ),
                  style: { backgroundColor: 'white', borderRadius: 4 }
                }}
              />
            </Box>
          )}

          {/* Mobile Search Button */}
          {showSearch && isMobile && (
            <IconButton
              color="inherit"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              sx={{ mr: 1 }}
            >
              <SearchIcon />
            </IconButton>
          )}

          <Box sx={{ flexGrow: 1 }} />

          {/* User Profile */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography 
              variant="body2" 
              sx={{ 
                mr: 1, 
                display: { xs: 'none', sm: 'block' },
                fontSize: { xs: '0.75rem', md: '0.875rem' }
              }}
            >
              {user?.username}
            </Typography>
            <IconButton
              size={isMobile ? "medium" : "large"}
              edge="end"
              aria-label="account of current user"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ width: { xs: 32, md: 40 }, height: { xs: 32, md: 40 } }}>
                <AccountCircle />
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>

        {/* Mobile Search Bar */}
        {showSearch && isMobile && mobileSearchOpen && (
          <Box sx={{ px: 2, pb: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search products..."
              value={searchTerm}
              onChange={handleSearch}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearchIconClick();
                }
              }}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon 
                      sx={{ cursor: 'pointer' }}
                      onClick={handleSearchIconClick}
                    />
                  </InputAdornment>
                ),
                style: { backgroundColor: 'white', borderRadius: 4 }
              }}
            />
          </Box>
        )}
      </AppBar>

      {/* Mobile Navigation Drawer */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      >
        <Box sx={{ width: 250, pt: 2 }}>
          <List>
            <ListItem component="button" onClick={handleHomeClick} sx={{ cursor: 'pointer' }}>
              <ListItemIcon>
                <HomeIcon />
              </ListItemIcon>
              <ListItemText primary="Home" />
            </ListItem>

            {/* Mobile Product Actions */}
            {canManageProducts && (
              <>
                <ListItem component="button" onClick={handleExportAllProducts} sx={{ cursor: 'pointer' }}>
                  <ListItemIcon>
                    <DownloadIcon />
                  </ListItemIcon>
                  <ListItemText primary="Export All Products" />
                </ListItem>

                <ListItem component="label" sx={{ cursor: 'pointer' }}>
                  <input
                    accept=".xlsx,.xls"
                    style={{ display: 'none' }}
                    id="mobile-bulk-upload"
                    type="file"
                    onChange={handleBulkUpload}
                    disabled={uploading}
                  />
                  <ListItemIcon>
                    {uploading ? <CircularProgress size={24} /> : <UploadIcon />}
                  </ListItemIcon>
                  <ListItemText primary={uploading ? "Uploading..." : "Upload Products"} />
                </ListItem>

                <ListItem component="button" onClick={downloadTemplate} sx={{ cursor: 'pointer' }}>
                  <ListItemIcon>
                    <DownloadIcon />
                  </ListItemIcon>
                  <ListItemText primary="Download Template" />
                </ListItem>
              </>
            )}
            
            <ListItem component="button" onClick={handleProfile} sx={{ cursor: 'pointer' }}>
              <ListItemIcon>
                <Person />
              </ListItemIcon>
              <ListItemText primary="Profile" />
            </ListItem>

            {user?.role === 'admin' && (
              <ListItem component="button" onClick={handleAdmin} sx={{ cursor: 'pointer' }}>
                <ListItemIcon>
                  <AdminPanelSettings />
                </ListItemIcon>
                <ListItemText primary="Admin Panel" />
              </ListItem>
            )}

            <ListItem component="button" onClick={handleLogout} sx={{ cursor: 'pointer' }}>
              <ListItemIcon>
                <Logout />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </Box>
      </Drawer>

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          id="primary-search-account-menu"
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={isMenuOpen}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleProfile}>
            <Person sx={{ mr: 1 }} />
            Profile
          </MenuItem>
          {user?.role === 'admin' && (
            <MenuItem onClick={handleAdmin}>
              <AdminPanelSettings sx={{ mr: 1 }} />
              Admin Panel
            </MenuItem>
          )}
          <MenuItem onClick={handleLogout}>
            <Logout sx={{ mr: 1 }} />
            Logout
          </MenuItem>
        </Menu>

        {/* Actions Menu */}
        <Menu
          anchorEl={actionsMenuAnchor}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          id="actions-menu"
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={isActionsMenuOpen}
          onClose={handleActionsMenuClose}
        >
          <MenuItem onClick={handleExportAllProducts}>
            <DownloadIcon sx={{ mr: 1 }} />
            Export All Products
          </MenuItem>
          <MenuItem component="label">
            <input
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              id="desktop-bulk-upload"
              type="file"
              onChange={handleBulkUpload}
              disabled={uploading}
            />
            {uploading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : <UploadIcon sx={{ mr: 1 }} />}
            {uploading ? 'Uploading...' : 'Upload Products'}
          </MenuItem>
          <MenuItem onClick={downloadTemplate}>
            <DownloadIcon sx={{ mr: 1 }} />
            Download Template
          </MenuItem>
        </Menu>
    </>
  );
};

Header.propTypes = {
  onSearch: PropTypes.func,
  showSearch: PropTypes.bool
};

export default Header;