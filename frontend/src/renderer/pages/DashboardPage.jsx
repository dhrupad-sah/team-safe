import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Divider,
  Badge,
  IconButton,
  Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

import { UserService, SecretService } from '../../services/api';
import { encryptWithPublicKey, decryptWithPrivateKey } from '../../services/crypto';

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  const [userProfile, setUserProfile] = useState(null);
  const [companyUsers, setCompanyUsers] = useState([]);
  const [secrets, setSecrets] = useState([]);
  
  // Share secret modal
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [secretText, setSecretText] = useState('');
  const [sending, setSending] = useState(false);
  
  // View secret modal
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedSecret, setSelectedSecret] = useState(null);
  const [decryptedSecret, setDecryptedSecret] = useState('');
  const [decrypting, setDecrypting] = useState(false);
  
  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
    
    // Start polling for new secrets
    const pollingInterval = setInterval(() => {
      checkNewSecrets();
    }, 15000);
    
    // Cleanup interval on unmount
    return () => clearInterval(pollingInterval);
  }, []);
  
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load user profile, company users and secrets in parallel
      const [profileData, usersData, secretsData] = await Promise.all([
        UserService.getProfile(),
        UserService.getCompanyUsers(),
        SecretService.getSecrets()
      ]);
      
      setUserProfile(profileData);
      setCompanyUsers(usersData);
      setSecrets(secretsData);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data. ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadDashboardData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  const checkNewSecrets = async () => {
    if (!userProfile) return;
    
    try {
      const latestSecrets = await SecretService.getSecrets();
      
      // If there are more secrets than before, update the state
      if (latestSecrets.length > secrets.length) {
        setSecrets(latestSecrets);
      }
    } catch (error) {
      console.error('Error checking for new secrets:', error);
    }
  };
  
  // Open share secret modal
  const handleOpenShareModal = (user) => {
    setSelectedUser(user);
    setSecretText('');
    setShareModalOpen(true);
  };
  
  // Share secret
  const handleShareSecret = async () => {
    if (!secretText || !selectedUser) return;
    
    try {
      setSending(true);
      
      // Encrypt secret with recipient's public key
      const encryptedData = await encryptWithPublicKey(
        secretText,
        selectedUser.publicKey
      );
      
      // Send to server
      await SecretService.shareSecret({
        receiverId: selectedUser.id,
        encryptedData
      });
      
      setSending(false);
      setShareModalOpen(false);
      
      // Refresh secrets list
      await loadDashboardData();
      
    } catch (error) {
      console.error('Error sharing secret:', error);
      setError('Failed to share secret: ' + error.message);
      setSending(false);
    }
  };
  
  // Open view secret modal
  const handleOpenViewModal = async (secret) => {
    setSelectedSecret(secret);
    setDecryptedSecret('');
    setViewModalOpen(true);
    
    // If this is a received secret and it's unread, mark as read
    if (userProfile && secret.receiverId === userProfile.id && !secret.isRead) {
      try {
        await SecretService.markAsRead(secret.id);
        // Update secret in the local state
        setSecrets(prevSecrets => prevSecrets.map(s => 
          s.id === secret.id ? { ...s, isRead: true } : s
        ));
      } catch (error) {
        console.error('Error marking secret as read:', error);
      }
    }
    
    // If user is recipient, decrypt the secret
    if (userProfile && secret.receiverId === userProfile.id) {
      try {
        setDecrypting(true);
        const privateKey = sessionStorage.getItem('privateKey');
        
        if (!privateKey) {
          setError('Unable to decrypt: Private key not available');
          setDecrypting(false);
          return;
        }
        
        const decrypted = await decryptWithPrivateKey(secret.encryptedData, privateKey);
        setDecryptedSecret(decrypted);
      } catch (error) {
        console.error('Error decrypting secret:', error);
        setError('Failed to decrypt the secret');
      } finally {
        setDecrypting(false);
      }
    }
  };
  
  // Get initials for avatar
  const getInitials = (firstName, lastName) => {
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '?';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    return lastInitial ? `${firstInitial}${lastInitial}` : firstInitial;
  };
  
  // Count unread secrets
  const unreadCount = userProfile ? 
    secrets.filter(s => s.receiverId === userProfile.id && !s.isRead).length : 0;
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="300px">
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}
      
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          Welcome, {userProfile?.firstName || 'User'}
        </Typography>
        
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>
      
      {/* Company Users Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Company Members
        </Typography>
        
        <List>
          {companyUsers.map(user => (
            <ListItem 
              key={user.id}
              button
              onClick={() => handleOpenShareModal(user)}
              divider
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  {getInitials(user.firstName, user.lastName)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText 
                primary={`${user.firstName} ${user.lastName}`}
                secondary={user.email} 
              />
            </ListItem>
          ))}
          
          {companyUsers.length === 0 && (
            <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
              No other company members found.
            </Typography>
          )}
        </List>
      </Paper>
      
      {/* Secrets Section */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Typography variant="h6">
            Your Secrets
          </Typography>
          {unreadCount > 0 && (
            <Badge 
              badgeContent={unreadCount} 
              color="error" 
              sx={{ ml: 2 }}
            />
          )}
        </Box>
        
        <List>
          {secrets.map(secret => (
            <ListItem
              key={secret.id}
              button
              onClick={() => handleOpenViewModal(secret)}
              divider
              sx={{
                bgcolor: !secret.isRead && secret.receiverId === userProfile?.id ? 
                  'rgba(25, 118, 210, 0.08)' : 'transparent'
              }}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: secret.senderId === userProfile?.id ? 'secondary.main' : 'primary.main' }}>
                  {secret.senderId === userProfile?.id ? 
                    getInitials(secret.receiver?.firstName, secret.receiver?.lastName) :
                    getInitials(secret.sender?.firstName, secret.sender?.lastName)
                  }
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  secret.senderId === userProfile?.id ?
                    `To: ${secret.receiver?.firstName} ${secret.receiver?.lastName}` :
                    `From: ${secret.sender?.firstName} ${secret.sender?.lastName}`
                }
                secondary={new Date(secret.createdAt).toLocaleString()}
              />
              {!secret.isRead && secret.receiverId === userProfile?.id && (
                <Badge color="error" variant="dot" />
              )}
            </ListItem>
          ))}
          
          {secrets.length === 0 && (
            <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
              No secrets shared yet.
            </Typography>
          )}
        </List>
      </Paper>
      
      {/* Share Secret Dialog */}
      <Dialog open={shareModalOpen} onClose={() => setShareModalOpen(false)}>
        <DialogTitle>
          Share Secret with {selectedUser?.firstName} {selectedUser?.lastName}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Secret Message"
            multiline
            rows={4}
            value={secretText}
            onChange={(e) => setSecretText(e.target.value)}
            margin="normal"
            placeholder="Enter your secret message"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareModalOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleShareSecret} 
            variant="contained" 
            disabled={sending || !secretText}
          >
            {sending ? <CircularProgress size={24} /> : 'Share'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* View Secret Dialog */}
      <Dialog open={viewModalOpen} onClose={() => setViewModalOpen(false)}>
        <DialogTitle>
          {selectedSecret?.senderId === userProfile?.id ?
            `Secret sent to ${selectedSecret?.receiver?.firstName} ${selectedSecret?.receiver?.lastName}` :
            `Secret from ${selectedSecret?.sender?.firstName} ${selectedSecret?.sender?.lastName}`
          }
        </DialogTitle>
        <DialogContent>
          {selectedSecret?.receiverId === userProfile?.id ? (
            <>
              <Typography variant="subtitle2" gutterBottom>
                Decrypted Message:
              </Typography>
              {decrypting ? (
                <Box display="flex" justifyContent="center" py={2}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <Typography variant="body1" sx={{ p: 2, bgcolor: 'background.default' }}>
                  {decryptedSecret}
                </Typography>
              )}
            </>
          ) : (
            <Typography variant="body1">
              This secret was encrypted for {selectedSecret?.receiver?.firstName} {selectedSecret?.receiver?.lastName} and can only be decrypted by them.
            </Typography>
          )}
          <Box mt={2}>
            <Typography variant="caption" color="textSecondary">
              Sent: {selectedSecret ? new Date(selectedSecret.createdAt).toLocaleString() : ''}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DashboardPage; 