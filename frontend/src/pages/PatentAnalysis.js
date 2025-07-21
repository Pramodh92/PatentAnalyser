import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { API } from 'aws-amplify';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Tabs,
  Tab
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ArticleIcon from '@mui/icons-material/Article';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import CategoryIcon from '@mui/icons-material/Category';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

// Mock data for development - will be replaced with actual API calls
const mockPatentData = {
  id: '1',
  title: 'Method for Natural Language Processing',
  submissionDate: '2023-04-15',
  domain: 'AI',
  status: 'Analyzed',
  riskLevel: 'High',
  description: 'A method for processing natural language using machine learning techniques to extract meaning and context from text data.',
  inventors: 'John Doe, Jane Smith',
  keyPhrases: [
    'natural language processing',
    'machine learning',
    'text extraction',
    'semantic analysis',
    'context recognition',
    'neural networks',
    'language model'
  ],
  entities: [
    { text: 'natural language processing', type: 'TECHNICAL_TERM', score: 0.95 },
    { text: 'machine learning', type: 'TECHNICAL_TERM', score: 0.92 },
    { text: 'neural networks', type: 'TECHNICAL_TERM', score: 0.88 },
    { text: 'text data', type: 'DATA_TYPE', score: 0.85 }
  ],
  priorArtMatches: [
    {
      id: 'PA001',
      title: 'System and Method for Natural Language Understanding',
      patentNumber: 'US10839159B2',
      filingDate: '2018-05-12',
      similarityScore: 0.85,
      matchedClaims: [1, 5, 8],
      keyOverlap: ['natural language processing', 'semantic analysis', 'neural networks']
    },
    {
      id: 'PA002',
      title: 'Method for Contextual Language Processing',
      patentNumber: 'US9852136B1',
      filingDate: '2016-12-05',
      similarityScore: 0.72,
      matchedClaims: [3, 4],
      keyOverlap: ['context recognition', 'language model']
    },
    {
      id: 'PA003',
      title: 'Neural Network-Based Text Analysis System',
      patentNumber: 'US10346488B2',
      filingDate: '2017-08-23',
      similarityScore: 0.68,
      matchedClaims: [2],
      keyOverlap: ['neural networks', 'text extraction']
    }
  ],
  infringementRisks: [
    {
      id: 'IR001',
      patentNumber: 'US10839159B2',
      title: 'System and Method for Natural Language Understanding',
      owner: 'Tech Innovations Inc.',
      riskLevel: 'High',
      riskScore: 0.85,
      conflictingElements: [
        'Use of bidirectional neural networks for context analysis',
        'Semantic extraction methodology',
        'Training process for language models'
      ]
    },
    {
      id: 'IR002',
      patentNumber: 'US9852136B1',
      title: 'Method for Contextual Language Processing',
      owner: 'AI Research Group LLC',
      riskLevel: 'Moderate',
      riskScore: 0.65,
      conflictingElements: [
        'Context recognition algorithm',
        'Feedback mechanism for language model improvement'
      ]
    }
  ],
  ipcCodes: ['G06F 17/27', 'G06N 3/04', 'G06F 40/30'],
  analysisMetrics: {
    overallRiskScore: 0.78,
    noveltyScore: 0.45,
    technicalOverlapScore: 0.82,
    domainDistribution: {
      'AI': 65,
      'Software': 25,
      'Telecommunications': 10
    }
  }
};

const PatentAnalysis = ({ user }) => {
  const { id } = useParams();
  const [patentData, setPatentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    // In a real application, this would fetch data from the API
    const fetchData = async () => {
      try {
        // Simulate API call
        setTimeout(() => {
          setPatentData(mockPatentData);
          setLoading(false);
        }, 1000);

        // Actual API call would look like this:
        // const data = await API.get('patentAnalyzer', `/patents/${id}`);
        // setPatentData(data);
      } catch (err) {
        console.error('Error fetching patent analysis:', err);
        setError('Failed to load patent analysis. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getRiskChip = (riskLevel) => {
    const riskConfig = {
      High: { color: 'error', icon: <ErrorIcon /> },
      Moderate: { color: 'warning', icon: <WarningIcon /> },
      Low: { color: 'success', icon: <CheckCircleIcon /> }
    };
    
    const config = riskConfig[riskLevel] || riskConfig.Low;
    
    return (
      <Chip 
        label={riskLevel} 
        color={config.color} 
        size="small" 
        icon={config.icon}
      />
    );
  };

  const domainDistributionData = {
    labels: patentData ? Object.keys(patentData.analysisMetrics.domainDistribution) : [],
    datasets: [
      {
        data: patentData ? Object.values(patentData.analysisMetrics.domainDistribution) : [],
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)'
        ],
        borderWidth: 1
      },
    ],
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!patentData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Patent not found or analysis not yet complete.
        </Alert>
        <Box sx={{ mt: 2 }}>
          <Button 
            variant="contained" 
            component={RouterLink} 
            to="/dashboard"
          >
            Return to Dashboard
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
        <Button 
          variant="outlined" 
          component={RouterLink} 
          to="/dashboard"
          sx={{ mb: 2 }}
        >
          Back to Dashboard
        </Button>
        <Typography variant="h4" component="h1" gutterBottom>
          {patentData.title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mr: 2 }}>
            Risk Level:
          </Typography>
          {getRiskChip(patentData.riskLevel)}
        </Box>
      </Box>

      <Paper sx={{ width: '100%', mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="analysis tabs">
            <Tab label="Summary" id="tab-0" />
            <Tab label="Prior Art" id="tab-1" />
            <Tab label="Infringement Risks" id="tab-2" />
            <Tab label="Technical Analysis" id="tab-3" />
          </Tabs>
        </Box>

        {/* Summary Tab */}
        <Box role="tabpanel" hidden={tabValue !== 0} id="tabpanel-0" sx={{ p: 3 }}>
          {tabValue === 0 && (
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Patent Information
                    </Typography>
                    <Typography variant="body1">
                      <strong>Title:</strong> {patentData.title}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Inventors:</strong> {patentData.inventors}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Domain:</strong> {patentData.domain}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Submission Date:</strong> {patentData.submissionDate}
                    </Typography>
                    <Typography variant="body1">
                      <strong>IPC Codes:</strong> {patentData.ipcCodes.join(', ')}
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body1">
                      <strong>Description:</strong>
                    </Typography>
                    <Typography variant="body2" paragraph>
                      {patentData.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Risk Assessment
                    </Typography>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" gutterBottom>
                        Overall Risk Score: {patentData.analysisMetrics.overallRiskScore * 100}%
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={patentData.analysisMetrics.overallRiskScore * 100} 
                        color={patentData.analysisMetrics.overallRiskScore > 0.7 ? "error" : 
                               patentData.analysisMetrics.overallRiskScore > 0.4 ? "warning" : "success"}
                        sx={{ height: 10, borderRadius: 5 }}
                      />
                    </Box>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" gutterBottom>
                        Novelty Score: {patentData.analysisMetrics.noveltyScore * 100}%
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={patentData.analysisMetrics.noveltyScore * 100} 
                        color={patentData.analysisMetrics.noveltyScore < 0.3 ? "error" : 
                               patentData.analysisMetrics.noveltyScore < 0.6 ? "warning" : "success"}
                        sx={{ height: 10, borderRadius: 5 }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="body2" gutterBottom>
                        Technical Overlap: {patentData.analysisMetrics.technicalOverlapScore * 100}%
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={patentData.analysisMetrics.technicalOverlapScore * 100} 
                        color={patentData.analysisMetrics.technicalOverlapScore > 0.7 ? "error" : 
                               patentData.analysisMetrics.technicalOverlapScore > 0.4 ? "warning" : "success"}
                        sx={{ height: 10, borderRadius: 5 }}
                      />
                    </Box>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Domain Distribution
                    </Typography>
                    <Box sx={{ height: 250 }}>
                      <Pie data={domainDistributionData} options={{ maintainAspectRatio: false }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Key Phrases & Entities
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" gutterBottom>
                          Key Phrases
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {patentData.keyPhrases.map((phrase, index) => (
                            <Chip key={index} label={phrase} size="small" />
                          ))}
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" gutterBottom>
                          Entities
                        </Typography>
                        <List dense>
                          {patentData.entities.map((entity, index) => (
                            <ListItem key={index}>
                              <ListItemText 
                                primary={entity.text} 
                                secondary={`${entity.type} (Confidence: ${(entity.score * 100).toFixed(1)}%)`} 
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>

        {/* Prior Art Tab */}
        <Box role="tabpanel" hidden={tabValue !== 1} id="tabpanel-1" sx={{ p: 3 }}>
          {tabValue === 1 && (
            <>
              <Typography variant="h6" gutterBottom>
                Prior Art Matches
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                The following patents have been identified as potential prior art based on semantic similarity analysis.
              </Typography>

              {patentData.priorArtMatches.map((match) => (
                <Accordion key={match.id} sx={{ mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Grid container alignItems="center">
                      <Grid item xs={8}>
                        <Typography variant="subtitle1">
                          {match.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {match.patentNumber} | Filed: {match.filingDate}
                        </Typography>
                      </Grid>
                      <Grid item xs={4} sx={{ textAlign: 'right' }}>
                        <Chip 
                          label={`${(match.similarityScore * 100).toFixed(0)}% Match`} 
                          color={match.similarityScore > 0.8 ? "error" : 
                                 match.similarityScore > 0.6 ? "warning" : "success"}
                          size="small" 
                        />
                      </Grid>
                    </Grid>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2">
                          Matched Claims: {match.matchedClaims.join(', ')}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" gutterBottom>
                          Key Term Overlap:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {match.keyOverlap.map((term, index) => (
                            <Chip key={index} label={term} size="small" color="primary" variant="outlined" />
                          ))}
                        </Box>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))}
            </>
          )}
        </Box>

        {/* Infringement Risks Tab */}
        <Box role="tabpanel" hidden={tabValue !== 2} id="tabpanel-2" sx={{ p: 3 }}>
          {tabValue === 2 && (
            <>
              <Typography variant="h6" gutterBottom>
                Potential Infringement Risks
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                The following patents may pose infringement risks based on our analysis.
              </Typography>

              {patentData.infringementRisks.map((risk) => (
                <Card key={risk.id} sx={{ mb: 3 }}>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={8}>
                        <Typography variant="h6">
                          {risk.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {risk.patentNumber} | Owner: {risk.owner}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
                        {getRiskChip(risk.riskLevel)}
                      </Grid>
                      <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="subtitle2" gutterBottom>
                          Conflicting Elements:
                        </Typography>
                        <List dense>
                          {risk.conflictingElements.map((element, index) => (
                            <ListItem key={index}>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <CompareArrowsIcon color="error" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary={element} />
                            </ListItem>
                          ))}
                        </List>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </Box>

        {/* Technical Analysis Tab */}
        <Box role="tabpanel" hidden={tabValue !== 3} id="tabpanel-3" sx={{ p: 3 }}>
          {tabValue === 3 && (
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      IPC Classification
                    </Typography>
                    <List>
                      {patentData.ipcCodes.map((code, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <CategoryIcon />
                          </ListItemIcon>
                          <ListItemText primary={code} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Technical Domain Analysis
                    </Typography>
                    <Box sx={{ height: 250 }}>
                      <Pie data={domainDistributionData} options={{ maintainAspectRatio: false }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Entity Recognition
                    </Typography>
                    <Grid container spacing={2}>
                      {patentData.entities.map((entity, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="subtitle1">
                                {entity.text}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Type: {entity.type}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                <Typography variant="body2" sx={{ mr: 1 }}>
                                  Confidence:
                                </Typography>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={entity.score * 100} 
                                  sx={{ height: 8, borderRadius: 5, flexGrow: 1 }}
                                />
                                <Typography variant="body2" sx={{ ml: 1 }}>
                                  {(entity.score * 100).toFixed(0)}%
                                </Typography>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default PatentAnalysis;