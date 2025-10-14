import React from 'react';
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
} from '@mui/material';
import {
  Search as SearchIcon,
  Home as HomeIcon,
  AccountCircle,
  Logout,
  Person,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({ onSearch, showSearch = true }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [searchTerm, setSearchTerm] = React.useState('');

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

  const handleSearchSubmit = (event) => {
    if (event.key === 'Enter' && searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
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
    <AppBar position="static" elevation={2}>
      <Toolbar>
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
          <Typography
            variant="h6"
            component="div"
            sx={{ 
              fontWeight: 'bold',
              color: 'white',
              cursor: 'pointer'
            }}
            onClick={handleHomeClick}
          >
            Deep Tec
          </Typography>
        </Box>

        {/* Home Button */}
        <IconButton
          color="inherit"
          onClick={handleHomeClick}
          sx={{ mr: 2 }}
        >
          <HomeIcon />
        </IconButton>

        {/* Search Bar */}
        {showSearch && (
          <Box sx={{ flexGrow: 1, maxWidth: 600, mx: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search by Model, Category, Brand, HP, Watt, Outlet, Phase..."
              value={searchTerm}
              onChange={handleSearch}
              onKeyPress={handleSearchSubmit}
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

        <Box sx={{ flexGrow: 1 }} />

        {/* User Profile */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ mr: 1, display: { xs: 'none', sm: 'block' } }}>
            {user?.username}
          </Typography>
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-controls="primary-search-account-menu"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar>
              <AccountCircle />
            </Avatar>
          </IconButton>
        </Box>

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
      </Toolbar>
    </AppBar>
  );
};

export default Header;