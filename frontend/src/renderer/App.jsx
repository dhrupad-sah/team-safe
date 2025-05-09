import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Container, CssBaseline } from '@mui/material';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';

// Services
import { AuthService } from '../services/api';

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = AuthService.isLoggedIn();
    setAuthenticated(isLoggedIn);
    setLoading(false);
  }, []);

  const handleLogout = () => {
    AuthService.logout();
    sessionStorage.removeItem('privateKey');
    setAuthenticated(false);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      <Header onLogout={authenticated ? handleLogout : null} />
      
      <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
        <Routes>
          <Route 
            path="/" 
            element={authenticated ? <Navigate to="/dashboard" /> : <LoginPage onLoginSuccess={() => setAuthenticated(true)} />} 
          />
          <Route 
            path="/register" 
            element={authenticated ? <Navigate to="/dashboard" /> : <RegisterPage />} 
          />
          <Route 
            path="/dashboard" 
            element={authenticated ? <DashboardPage /> : <Navigate to="/" />} 
          />
        </Routes>
      </Container>
      
      <Footer />
    </Box>
  );
}

export default App; 