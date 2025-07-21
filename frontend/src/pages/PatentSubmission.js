import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API, Storage } from 'aws-amplify';
import {
  Container,
  Typography,
  Box,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  Card,
  CardContent
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import CategoryIcon from '@mui/icons-material/Category';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const steps = ['Patent Information', 'Upload Document', 'Select Domain', 'Review & Submit'];

const domains = [
  { value: 'ai', label: 'Artificial Intelligence' },
  { value: 'biotech', label: 'Biotechnology' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'mechanical', label: 'Mechanical Engineering' },
  { value: 'software', label: 'Software' },
  { value: 'pharmaceutical', label: 'Pharmaceutical' },
  { value: 'telecommunications', label: 'Telecommunications' },
  { value: 'other', label: 'Other' }
];

const PatentSubmission = ({ user }) => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    inventors: '',
    description: '',
    domain: '',
    file: null,
    textContent: ''
  });

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFormData({
          ...formData,
          file: acceptedFiles[0]
        });
      }
    }
  });

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateCurrentStep = () => {
    switch (activeStep) {
      case 0: // Patent Information
        return formData.title.trim() !== '' && formData.description.trim() !== '';
      case 1: // Upload Document
        return formData.file !== null || formData.textContent.trim() !== '';
      case 2: // Select Domain
        return formData.domain !== '';
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // In a real application, this would upload the file to S3 and create a record in DynamoDB
      // For now, we'll simulate a successful submission
      
      // Example of how this would work with actual AWS services:
      /*
      let fileKey = null;
      
      if (formData.file) {
        // Upload file to S3
        fileKey = `patents/${user.username}/${Date.now()}-${formData.file.name}`;
        await Storage.put(fileKey, formData.file, {
          contentType: formData.file.type
        });
      }
      
      // Create record in DynamoDB via API Gateway
      const submission = {
        title: formData.title,
        inventors: formData.inventors,
        description: formData.description,
        domain: formData.domain,
        fileKey: fileKey,
        textContent: formData.textContent,
        userId: user.username,
        submissionDate: new Date().toISOString()
      };
      
      const result = await API.post('patentAnalyzer', '/patents', {
        body: submission
      });
      */
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Navigate to the dashboard with a success message
      navigate('/dashboard', { 
        state: { 
          notification: {
            type: 'success',
            message: 'Patent submitted successfully! Analysis is in progress.'
          }
        }
      });
    } catch (err) {
      console.error('Error submitting patent:', err);
      setError('Failed to submit patent. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 4 }}>
            <TextField
              label="Patent Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              fullWidth
              required
              margin="normal"
            />
            <TextField
              label="Inventors"
              name="inventors"
              value={formData.inventors}
              onChange={handleChange}
              fullWidth
              margin="normal"
              helperText="Separate multiple inventors with commas"
            />
            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              fullWidth
              required
              multiline
              rows={6}
              margin="normal"
              helperText="Provide a brief description of your invention"
            />
          </Box>
        );
      case 1:
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Upload Patent Document
            </Typography>
            <Paper
              {...getRootProps()}
              sx={{
                p: 3,
                mt: 2,
                mb: 3,
                border: '2px dashed #ccc',
                borderRadius: 2,
                bgcolor: isDragActive ? 'rgba(25, 118, 210, 0.08)' : 'inherit',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <input {...getInputProps()} />
              <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              {isDragActive ? (
                <Typography>Drop the file here...</Typography>
              ) : (
                <Typography>
                  Drag and drop a file here, or click to select a file
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Supported formats: PDF, DOC, DOCX, TXT
              </Typography>
            </Paper>

            {formData.file && (
              <Box sx={{ mt: 2, mb: 3 }}>
                <Typography variant="subtitle2">
                  Selected file: {formData.file.name} ({(formData.file.size / 1024).toFixed(2)} KB)
                </Typography>
              </Box>
            )}

            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                OR
              </Typography>
            </Divider>

            <Typography variant="h6" gutterBottom>
              Enter Patent Text
            </Typography>
            <TextField
              label="Patent Text Content"
              name="textContent"
              value={formData.textContent}
              onChange={handleChange}
              fullWidth
              multiline
              rows={10}
              margin="normal"
              helperText="Paste the text content of your patent here if you don't have a document to upload"
            />
          </Box>
        );
      case 2:
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Select Technology Domain
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Selecting the appropriate domain helps our AI system perform more accurate analysis.
            </Typography>
            <FormControl fullWidth margin="normal" required>
              <InputLabel id="domain-label">Technology Domain</InputLabel>
              <Select
                labelId="domain-label"
                id="domain"
                name="domain"
                value={formData.domain}
                label="Technology Domain"
                onChange={handleChange}
              >
                {domains.map((domain) => (
                  <MenuItem key={domain.value} value={domain.value}>
                    {domain.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        );
      case 3:
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Review Submission
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Patent Information
                    </Typography>
                    <Typography variant="body1">
                      <strong>Title:</strong> {formData.title}
                    </Typography>
                    {formData.inventors && (
                      <Typography variant="body1">
                        <strong>Inventors:</strong> {formData.inventors}
                      </Typography>
                    )}
                    <Typography variant="body1">
                      <strong>Domain:</strong> {domains.find(d => d.value === formData.domain)?.label || ''}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Document Information
                    </Typography>
                    {formData.file ? (
                      <Typography variant="body1">
                        <strong>File:</strong> {formData.file.name} ({(formData.file.size / 1024).toFixed(2)} KB)
                      </Typography>
                    ) : formData.textContent ? (
                      <Typography variant="body1">
                        <strong>Text Content:</strong> {formData.textContent.substring(0, 100)}...
                      </Typography>
                    ) : (
                      <Typography variant="body1" color="error">
                        No document or text content provided
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          Submit Patent for Analysis
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === steps.length ? (
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Submission Complete!
            </Typography>
            <Typography variant="body1" paragraph>
              Your patent has been submitted for analysis. You will be notified when the analysis is complete.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/dashboard')}
              sx={{ mt: 2 }}
            >
              Return to Dashboard
            </Button>
          </Box>
        ) : (
          <>
            {renderStepContent(activeStep)}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0 || loading}
                onClick={handleBack}
                variant="outlined"
              >
                Back
              </Button>
              <div>
                {activeStep === steps.length - 1 ? (
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={!validateCurrentStep() || loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Submit'}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={!validateCurrentStep()}
                  >
                    Next
                  </Button>
                )}
              </div>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default PatentSubmission;