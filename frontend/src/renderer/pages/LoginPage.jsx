import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress
} from '@mui/material';

import { AuthService } from '../../services/api';
import { retrievePrivateKey } from '../../services/crypto';

const LoginPage = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    setError('');
    setSuccess('');
    
    // Validate form
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      setLoading(true);
      
      // Call login API
      await AuthService.login({ email, password });
      
      // Retrieve private key with password
      const privateKey = await retrievePrivateKey(password);
      
      if (!privateKey) {
        setError('Could not retrieve encryption keys. Please register first.');
        setLoading(false);
        return;
      }
      
      // Store key temporarily in session
      sessionStorage.setItem('privateKey', privateKey);
      
      setLoading(false);
      setSuccess('Login successful!');
      
      // Notify parent of successful login
      setTimeout(() => {
        onLoginSuccess();
      }, 500);
      
    } catch (error) {
      setLoading(false);
      setError(error.message || 'Login failed');
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      sx={{ py: 2 }}
    >
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        mb={2}
      >
        <Typography 
          variant="h4" 
          sx={{ 
            backgroundColor: 'primary.main',
            color: 'white',
            borderRadius: '50%', 
            width: 60, 
            height: 60, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontWeight: 'bold'
          }}
        >
          TS
        </Typography>
      </Box>
      
      <Typography variant="h5" gutterBottom>
        Welcome to Team Safe
      </Typography>
      
      <Typography variant="body1" color="textSecondary" mb={3}>
        Secure secret sharing for your team
      </Typography>
      
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          width: '100%', 
          maxWidth: 400,
        }}
      >
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        
        <form onSubmit={handleLogin}>
          <TextField
            label="Company Email"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            required
          />
          
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          
          <Box mt={3}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
              sx={{ mb: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Login'}
            </Button>
            
            <Button
              variant="text"
              color="secondary"
              fullWidth
              onClick={() => navigate('/register')}
              disabled={loading}
            >
              Don't have an account? Register
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default LoginPage; 