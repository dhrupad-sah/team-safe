import React from 'react';
import { Box, Typography } from '@mui/material';

const Footer = () => {
  return (
    <Box 
      component="footer" 
      sx={{ 
        py: 2, 
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.grey[100],
        textAlign: 'center'
      }}
    >
      <Typography variant="body2" color="text.secondary">
        Team Safe • Secure Secret Sharing
      </Typography>
    </Box>
  );
};

export default Footer; 