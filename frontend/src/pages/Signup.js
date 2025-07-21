import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Auth } from 'aws-amplify';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Link,
  Paper,
  Avatar,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'inventor' // Default role
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationStep, setConfirmationStep] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await Auth.signUp({
        username: formData.email,
        password: formData.password,
        attributes: {
          email: formData.email,
          name: `${formData.firstName} ${formData.lastName}`,
          'custom:role': formData.role
        }
      });
      setConfirmationStep(true);
    } catch (err) {
      console.error('Error signing up:', err);
      setError(err.message || 'An error occurred during sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmationSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await Auth.confirmSignUp(formData.email, confirmationCode);
      // Automatically sign in after confirmation
      await Auth.signIn(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Error confirming sign up:', err);
      setError(err.message || 'An error occurred during confirmation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper
        elevation={3}
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          p: 4
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
          <PersonAddIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          {confirmationStep ? 'Confirm Sign Up' : 'Sign Up'}
        </Typography>
        {error && (
          <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
            {error}
          </Alert>
        )}

        {!confirmationStep ? (
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  autoComplete="given-name"
                  name="firstName"
                  required
                  fullWidth
                  id="firstName"
                  label="First Name"
                  autoFocus
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="lastName"
                  label="Last Name"
                  name="lastName"
                  autoComplete="family-name"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="role-label">Role</InputLabel>
                  <Select
                    labelId="role-label"
                    id="role"
                    name="role"
                    value={formData.role}
                    label="Role"
                    onChange={handleChange}
                  >
                    <MenuItem value="inventor">Inventor</MenuItem>
                    <MenuItem value="analyst">Analyst</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign Up'}
            </Button>
            <Grid container justifyContent="flex-end">
              <Grid item>
                <Link component={RouterLink} to="/login" variant="body2">
                  Already have an account? Sign in
                </Link>
              </Grid>
            </Grid>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleConfirmationSubmit} noValidate sx={{ mt: 3 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="confirmationCode"
              label="Confirmation Code"
              name="confirmationCode"
              autoFocus
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value)}
              helperText="Please check your email for the confirmation code"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Verify'}
            </Button>
            <Grid container justifyContent="flex-end">
              <Grid item>
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => setConfirmationStep(false)}
                >
                  Back to Sign Up
                </Link>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Signup;