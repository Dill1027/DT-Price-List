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
} from '@mui/material';
import {
  Search as SearchIcon,
  Home as HomeIcon,
  AccountCircle,
  Logout,
  Person,
  AdminPanelSettings,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
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

  const isMenuOpen = Boolean(anchorEl);

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
            <IconButton
              color="inherit"
              onClick={handleHomeClick}
              sx={{ mr: 2 }}
            >
              <HomeIcon />
            </IconButton>
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
    </>
  );
};

Header.propTypes = {
  onSearch: PropTypes.func,
  showSearch: PropTypes.bool
};

export default Header;