import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Grid
} from '@mui/material';

import { AuthService } from '../../services/api';
import { generateKeyPair, storePrivateKey } from '../../services/crypto';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    setError('');
    setSuccess('');
    
    const { email, firstName, lastName, password, confirmPassword } = formData;
    
    // Validate form
    if (!email || !firstName || !lastName || !password || !confirmPassword) {
      setError('Please fill out all required fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      setLoading(true);
      
      // Generate key pair
      const keyPair = await generateKeyPair();
      
      // Store private key (encrypted with password)
      await storePrivateKey(keyPair.privateKey, password);
      
      // Call register API
      await AuthService.register({
        email,
        firstName,
        lastName,
        password,
        publicKey: keyPair.publicKey
      });
      
      setLoading(false);
      setSuccess('Registration successful! Please check your email for verification.');
      
      // Redirect to login after short delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (error) {
      setLoading(false);
      setError(error.message || 'Registration failed');
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
        Create Your Account
      </Typography>
      
      <Typography variant="body1" color="textSecondary" mb={3}>
        Join your team on Team Safe
      </Typography>
      
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          width: '100%', 
          maxWidth: 600,
        }}
      >
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        
        <form onSubmit={handleRegister}>
          <TextField
            label="Company Email"
            type="email"
            name="email"
            fullWidth
            margin="normal"
            value={formData.email}
            onChange={handleChange}
            placeholder="name@company.com"
            required
          />
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="First Name"
                type="text"
                name="firstName"
                fullWidth
                margin="normal"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Last Name"
                type="text"
                name="lastName"
                fullWidth
                margin="normal"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </Grid>
          </Grid>
          
          <TextField
            label="Password"
            type="password"
            name="password"
            fullWidth
            margin="normal"
            value={formData.password}
            onChange={handleChange}
            required
          />
          
          <TextField
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            fullWidth
            margin="normal"
            value={formData.confirmPassword}
            onChange={handleChange}
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
              {loading ? <CircularProgress size={24} /> : 'Create Account'}
            </Button>
            
            <Button
              variant="text"
              color="secondary"
              fullWidth
              onClick={() => navigate('/')}
              disabled={loading}
            >
              Already have an account? Login
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default RegisterPage; 