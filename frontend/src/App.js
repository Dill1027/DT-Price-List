import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Box, CircularProgress } from '@mui/material';

// Import pages
import Login from './pages/Login';
import Home from './pages/Home';
import Profile from './pages/Profile';
import CategoryDetails from './pages/CategoryDetails';
import AdminPanel from './pages/AdminPanel';
import SearchResults from './pages/SearchResults';
import ProtectedRoute from './components/common/ProtectedRoute';

function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      
      {/* Protected Routes */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/category/:categoryId" 
        element={
          <ProtectedRoute>
            <CategoryDetails />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute>
            <AdminPanel />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/search" 
        element={
          <ProtectedRoute>
            <SearchResults />
          </ProtectedRoute>
        } 
      />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;