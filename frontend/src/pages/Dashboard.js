import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { API } from 'aws-amplify';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import NotificationsIcon from '@mui/icons-material/Notifications';

// Mock data for development - will be replaced with actual API calls
const mockPatents = [
  {
    id: '1',
    title: 'Method for Natural Language Processing',
    submissionDate: '2023-04-15',
    domain: 'AI',
    status: 'Analyzed',
    riskLevel: 'High',
    matchCount: 5
  },
  {
    id: '2',
    title: 'System for Automated Patent Analysis',
    submissionDate: '2023-04-10',
    domain: 'LegalTech',
    status: 'Analyzed',
    riskLevel: 'Low',
    matchCount: 1
  },
  {
    id: '3',
    title: 'Device for Wireless Communication',
    submissionDate: '2023-04-05',
    domain: 'Electronics',
    status: 'Processing',
    riskLevel: null,
    matchCount: null
  }
];

const mockAlerts = [
  {
    id: '1',
    type: 'infringement',
    message: 'Potential infringement detected for "Method for Natural Language Processing"',
    date: '2023-04-16',
    read: false
  },
  {
    id: '2',
    type: 'new_match',
    message: 'New matching patent filed in AI domain',
    date: '2023-04-14',
    read: true
  },
  {
    id: '3',
    type: 'critical_change',
    message: 'Critical change in monitored Electronics category',
    date: '2023-04-12',
    read: false
  }
];

const Dashboard = ({ user }) => {
  const [patents, setPatents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    // In a real application, this would fetch data from the API
    const fetchData = async () => {
      try {
        // Simulate API call
        setTimeout(() => {
          setPatents(mockPatents);
          setAlerts(mockAlerts);
          setLoading(false);
        }, 1000);

        // Actual API call would look like this:
        // const patentsData = await API.get('patentAnalyzer', '/patents');
        // const alertsData = await API.get('patentAnalyzer', '/alerts');
        // setPatents(patentsData);
        // setAlerts(alertsData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleMarkAsRead = (alertId) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, read: true } : alert
    ));
    // In a real app, you would also update this on the server
    // API.put('patentAnalyzer', `/alerts/${alertId}/read`);
  };

  const getRiskChip = (riskLevel) => {
    if (!riskLevel) return null;
    
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

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Welcome back, {user?.attributes?.name || 'User'}!
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Summary Cards */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Submissions
              </Typography>
              <Typography variant="h3">{patents.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pending Analysis
              </Typography>
              <Typography variant="h3">
                {patents.filter(p => p.status === 'Processing').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                New Alerts
              </Typography>
              <Typography variant="h3">
                {alerts.filter(a => !a.read).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12}>
          <Paper sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="dashboard tabs">
                <Tab label="My Patents" id="tab-0" />
                <Tab 
                  label="Alerts" 
                  id="tab-1" 
                  icon={alerts.some(a => !a.read) ? <NotificationsIcon color="error" /> : null} 
                  iconPosition="end"
                />
              </Tabs>
            </Box>

            {/* Patents Tab */}
            <Box role="tabpanel" hidden={tabValue !== 0} id="tabpanel-0" sx={{ p: 3 }}>
              {tabValue === 0 && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <Button 
                      variant="contained" 
                      startIcon={<AddIcon />}
                      component={RouterLink}
                      to="/submit"
                    >
                      Submit New Patent
                    </Button>
                  </Box>
                  
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Title</TableCell>
                          <TableCell>Domain</TableCell>
                          <TableCell>Submission Date</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Risk Level</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {patents.length > 0 ? (
                          patents.map((patent) => (
                            <TableRow key={patent.id}>
                              <TableCell>{patent.title}</TableCell>
                              <TableCell>{patent.domain}</TableCell>
                              <TableCell>{patent.submissionDate}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={patent.status} 
                                  color={patent.status === 'Analyzed' ? 'success' : 'info'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                {getRiskChip(patent.riskLevel)}
                              </TableCell>
                              <TableCell>
                                <Tooltip title="View Analysis">
                                  <IconButton 
                                    component={RouterLink} 
                                    to={`/analysis/${patent.id}`}
                                    disabled={patent.status !== 'Analyzed'}
                                  >
                                    <VisibilityIcon />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} align="center">
                              No patents submitted yet. Click "Submit New Patent" to get started.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </Box>

            {/* Alerts Tab */}
            <Box role="tabpanel" hidden={tabValue !== 1} id="tabpanel-1" sx={{ p: 3 }}>
              {tabValue === 1 && (
                <>
                  {alerts.length > 0 ? (
                    alerts.map((alert) => (
                      <Card 
                        key={alert.id} 
                        sx={{ 
                          mb: 2, 
                          bgcolor: alert.read ? 'inherit' : 'rgba(25, 118, 210, 0.08)'
                        }}
                      >
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>
                            {alert.message}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {alert.date}
                          </Typography>
                        </CardContent>
                        {!alert.read && (
                          <CardActions>
                            <Button size="small" onClick={() => handleMarkAsRead(alert.id)}>
                              Mark as Read
                            </Button>
                          </CardActions>
                        )}
                      </Card>
                    ))
                  ) : (
                    <Typography variant="body1" align="center">
                      No alerts to display.
                    </Typography>
                  )}
                </>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;