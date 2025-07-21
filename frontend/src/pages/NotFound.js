import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Typography, Button, Box, Paper } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HomeIcon from '@mui/icons-material/Home';

const NotFound = () => {
  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 8 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Box sx={{ mb: 4 }}>
          <ErrorOutlineIcon sx={{ fontSize: 100, color: 'text.secondary' }} />
        </Box>
        <Typography variant="h3" component="h1" gutterBottom>
          404 - Page Not Found
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </Typography>
        <Button 
          component={Link} 
          to="/" 
          variant="contained" 
          size="large"
          startIcon={<HomeIcon />}
          sx={{ mt: 2 }}
        >
          Back to Home
        </Button>
      </Paper>
    </Container>
  );
};

export default NotFound;