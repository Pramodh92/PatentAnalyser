import React, { useState, useEffect } from 'react';
import { API } from 'aws-amplify';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import StorageIcon from '@mui/icons-material/Storage';
import NotificationsIcon from '@mui/icons-material/Notifications';
import BuildIcon from '@mui/icons-material/Build';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip as ChartTooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, ChartTooltip, Legend);

// Mock data for development - will be replaced with actual API calls
const mockUsers = [
  { id: '1', email: 'admin@example.com', name: 'Admin User', role: 'admin', status: 'active', lastLogin: '2023-04-15 10:30:45' },
  { id: '2', email: 'inventor1@example.com', name: 'John Inventor', role: 'inventor', status: 'active', lastLogin: '2023-04-14 15:22:10' },
  { id: '3', email: 'analyst1@example.com', name: 'Jane Analyst', role: 'analyst', status: 'active', lastLogin: '2023-04-13 09:15:33' },
  { id: '4', email: 'inventor2@example.com', name: 'Bob Smith', role: 'inventor', status: 'inactive', lastLogin: '2023-03-25 11:45:20' }
];

const mockSystemHealth = {
  cpu: 35,
  memory: 42,
  storage: 28,
  apiLatency: 120, // ms
  dbConnections: 8,
  activeUsers: 12,
  uptime: '5d 7h 22m',
  lastRestart: '2023-04-10 03:00:00'
};

const mockUsageStats = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'Patent Submissions',
      data: [12, 19, 15, 25, 22, 30],
      borderColor: 'rgb(54, 162, 235)',
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
    },
    {
      label: 'Analyses Run',
      data: [15, 25, 18, 30, 28, 35],
      borderColor: 'rgb(255, 99, 132)',
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
    },
  ],
};

const mockDomainKeywords = [
  { id: '1', domain: 'AI', keywords: ['machine learning', 'neural network', 'deep learning', 'natural language processing', 'computer vision'] },
  { id: '2', domain: 'Biotech', keywords: ['genome', 'protein', 'enzyme', 'cell culture', 'antibody', 'therapeutic'] },
  { id: '3', domain: 'Electronics', keywords: ['circuit', 'semiconductor', 'transistor', 'microprocessor', 'sensor'] }
];

const mockSystemLogs = [
  { id: '1', timestamp: '2023-04-15 10:30:45', level: 'INFO', message: 'User admin@example.com logged in', service: 'auth' },
  { id: '2', timestamp: '2023-04-15 10:35:22', level: 'INFO', message: 'Patent analysis started for submission ID: 12345', service: 'analysis' },
  { id: '3', timestamp: '2023-04-15 10:38:15', level: 'WARNING', message: 'High CPU usage detected (85%)', service: 'monitoring' },
  { id: '4', timestamp: '2023-04-15 10:40:33', level: 'ERROR', message: 'Failed to connect to DynamoDB', service: 'database' },
  { id: '5', timestamp: '2023-04-15 10:42:10', level: 'INFO', message: 'DynamoDB connection restored', service: 'database' },
  { id: '6', timestamp: '2023-04-15 10:45:55', level: 'INFO', message: 'Patent analysis completed for submission ID: 12345', service: 'analysis' }
];

const AdminPanel = ({ user }) => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [usageStats, setUsageStats] = useState(null);
  const [domainKeywords, setDomainKeywords] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [editingDomain, setEditingDomain] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [newDomainName, setNewDomainName] = useState('');
  const [addingNewDomain, setAddingNewDomain] = useState(false);
  const [newDomainKeywords, setNewDomainKeywords] = useState([]);

  useEffect(() => {
    // In a real application, this would fetch data from the API
    const fetchData = async () => {
      try {
        // Simulate API call
        setTimeout(() => {
          setUsers(mockUsers);
          setSystemHealth(mockSystemHealth);
          setUsageStats(mockUsageStats);
          setDomainKeywords(mockDomainKeywords);
          setSystemLogs(mockSystemLogs);
          setLoading(false);
        }, 1000);

        // Actual API calls would look like this:
        // const usersData = await API.get('patentAnalyzer', '/admin/users');
        // const healthData = await API.get('patentAnalyzer', '/admin/system-health');
        // const statsData = await API.get('patentAnalyzer', '/admin/usage-stats');
        // const keywordsData = await API.get('patentAnalyzer', '/admin/domain-keywords');
        // const logsData = await API.get('patentAnalyzer', '/admin/system-logs');
        // setUsers(usersData);
        // setSystemHealth(healthData);
        // setUsageStats(statsData);
        // setDomainKeywords(keywordsData);
        // setSystemLogs(logsData);
      } catch (err) {
        console.error('Error fetching admin data:', err);
        setError('Failed to load admin data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleRefreshData = () => {
    setLoading(true);
    // In a real app, this would re-fetch the data
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const handleEditDomain = (domain) => {
    setEditingDomain(domain);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingDomain(null);
    setNewKeyword('');
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim() === '') return;

    if (editingDomain) {
      // Update existing domain
      const updatedDomains = domainKeywords.map(domain => {
        if (domain.id === editingDomain.id) {
          return {
            ...domain,
            keywords: [...domain.keywords, newKeyword.trim()]
          };
        }
        return domain;
      });
      setDomainKeywords(updatedDomains);
    } else if (addingNewDomain) {
      // Add to new domain keywords
      setNewDomainKeywords([...newDomainKeywords, newKeyword.trim()]);
    }

    setNewKeyword('');
  };

  const handleRemoveKeyword = (domainId, keyword) => {
    const updatedDomains = domainKeywords.map(domain => {
      if (domain.id === domainId) {
        return {
          ...domain,
          keywords: domain.keywords.filter(k => k !== keyword)
        };
      }
      return domain;
    });
    setDomainKeywords(updatedDomains);
  };

  const handleRemoveNewKeyword = (keyword) => {
    setNewDomainKeywords(newDomainKeywords.filter(k => k !== keyword));
  };

  const handleAddNewDomain = () => {
    setAddingNewDomain(true);
    setNewDomainName('');
    setNewDomainKeywords([]);
    setOpenDialog(true);
  };

  const handleSaveNewDomain = () => {
    if (newDomainName.trim() === '') return;

    const newDomain = {
      id: `new-${Date.now()}`, // In a real app, this would be generated by the backend
      domain: newDomainName.trim(),
      keywords: newDomainKeywords
    };

    setDomainKeywords([...domainKeywords, newDomain]);
    setAddingNewDomain(false);
    setOpenDialog(false);
  };

  const handleDeleteDomain = (domainId) => {
    setDomainKeywords(domainKeywords.filter(domain => domain.id !== domainId));
  };

  const handleUpdateUserStatus = (userId, newStatus) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, status: newStatus } : user
    ));
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Admin Panel
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefreshData}
          disabled={loading}
        >
          Refresh Data
        </Button>
      </Box>

      <Paper sx={{ width: '100%', mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="admin tabs">
            <Tab icon={<StorageIcon />} label="System Health" id="tab-0" />
            <Tab icon={<PersonIcon />} label="User Management" id="tab-1" />
            <Tab icon={<BuildIcon />} label="Domain Keywords" id="tab-2" />
            <Tab icon={<NotificationsIcon />} label="System Logs" id="tab-3" />
          </Tabs>
        </Box>

        {/* System Health Tab */}
        <Box role="tabpanel" hidden={tabValue !== 0} id="tabpanel-0" sx={{ p: 3 }}>
          {tabValue === 0 && systemHealth && (
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      System Resources
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="body2" gutterBottom>
                          CPU Usage: {systemHealth.cpu}%
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ width: '100%', mr: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={systemHealth.cpu} 
                              sx={{ height: 10, borderRadius: 5 }}
                              color={systemHealth.cpu > 80 ? "error" : systemHealth.cpu > 60 ? "warning" : "primary"}
                            />
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" gutterBottom>
                          Memory Usage: {systemHealth.memory}%
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ width: '100%', mr: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={systemHealth.memory} 
                              sx={{ height: 10, borderRadius: 5 }}
                              color={systemHealth.memory > 80 ? "error" : systemHealth.memory > 60 ? "warning" : "primary"}
                            />
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" gutterBottom>
                          Storage Usage: {systemHealth.storage}%
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ width: '100%', mr: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={systemHealth.storage} 
                              sx={{ height: 10, borderRadius: 5 }}
                              color={systemHealth.storage > 80 ? "error" : systemHealth.storage > 60 ? "warning" : "primary"}
                            />
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body1">
                      <strong>API Latency:</strong> {systemHealth.apiLatency} ms
                    </Typography>
                    <Typography variant="body1">
                      <strong>DB Connections:</strong> {systemHealth.dbConnections}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Active Users:</strong> {systemHealth.activeUsers}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Uptime:</strong> {systemHealth.uptime}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Last Restart:</strong> {systemHealth.lastRestart}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Usage Statistics
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <Line 
                        data={usageStats} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'top',
                            },
                            title: {
                              display: true,
                              text: 'Monthly Usage'
                            },
                          },
                        }} 
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      System Settings
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6} md={4}>
                        <FormControlLabel
                          control={<Switch defaultChecked />}
                          label="Enable Automatic Alerts"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <FormControlLabel
                          control={<Switch defaultChecked />}
                          label="Daily System Backup"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <FormControlLabel
                          control={<Switch />}
                          label="Maintenance Mode"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <TextField
                          label="Alert Threshold (%)"
                          type="number"
                          defaultValue="80"
                          InputLabelProps={{
                            shrink: true,
                          }}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <TextField
                          label="Max File Upload Size (MB)"
                          type="number"
                          defaultValue="10"
                          InputLabelProps={{
                            shrink: true,
                          }}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <TextField
                          label="Session Timeout (minutes)"
                          type="number"
                          defaultValue="30"
                          InputLabelProps={{
                            shrink: true,
                          }}
                          fullWidth
                        />
                      </Grid>
                    </Grid>
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                      >
                        Save Settings
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>

        {/* User Management Tab */}
        <Box role="tabpanel" hidden={tabValue !== 1} id="tabpanel-1" sx={{ p: 3 }}>
          {tabValue === 1 && (
            <>
              <Typography variant="h6" gutterBottom>
                User Management
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Last Login</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip 
                            label={user.role.charAt(0).toUpperCase() + user.role.slice(1)} 
                            color={user.role === 'admin' ? 'secondary' : 'primary'}
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>
                          <FormControlLabel
                            control={
                              <Switch 
                                checked={user.status === 'active'} 
                                onChange={(e) => handleUpdateUserStatus(user.id, e.target.checked ? 'active' : 'inactive')}
                                size="small"
                              />
                            }
                            label={user.status === 'active' ? 'Active' : 'Inactive'}
                          />
                        </TableCell>
                        <TableCell>{user.lastLogin}</TableCell>
                        <TableCell>
                          <Tooltip title="Edit User">
                            <IconButton size="small">
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete User">
                            <IconButton size="small">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                >
                  Add New User
                </Button>
              </Box>
            </>
          )}
        </Box>

        {/* Domain Keywords Tab */}
        <Box role="tabpanel" hidden={tabValue !== 2} id="tabpanel-2" sx={{ p: 3 }}>
          {tabValue === 2 && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  Domain-Specific Keywords
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddNewDomain}
                >
                  Add New Domain
                </Button>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Manage domain-specific keywords used by the AI system for better classification and analysis.
              </Typography>

              <Grid container spacing={3}>
                {domainKeywords.map((domain) => (
                  <Grid item xs={12} md={6} lg={4} key={domain.id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h6">{domain.domain}</Typography>
                          <Box>
                            <Tooltip title="Edit Keywords">
                              <IconButton size="small" onClick={() => handleEditDomain(domain)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Domain">
                              <IconButton size="small" onClick={() => handleDeleteDomain(domain.id)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {domain.keywords.map((keyword, index) => (
                            <Chip 
                              key={index} 
                              label={keyword} 
                              size="small" 
                              onDelete={() => handleRemoveKeyword(domain.id, keyword)}
                            />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Edit Domain Dialog */}
              <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                  {addingNewDomain ? 'Add New Domain' : editingDomain ? `Edit ${editingDomain.domain} Keywords` : ''}
                </DialogTitle>
                <DialogContent>
                  {addingNewDomain && (
                    <TextField
                      autoFocus
                      margin="dense"
                      label="Domain Name"
                      fullWidth
                      value={newDomainName}
                      onChange={(e) => setNewDomainName(e.target.value)}
                      sx={{ mb: 3 }}
                    />
                  )}
                  
                  <DialogContentText>
                    {addingNewDomain 
                      ? 'Add keywords for the new domain:' 
                      : 'Add or remove keywords for this domain:'}
                  </DialogContentText>
                  
                  <Box sx={{ display: 'flex', mt: 2 }}>
                    <TextField
                      label="New Keyword"
                      fullWidth
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                    />
                    <Button 
                      variant="contained" 
                      onClick={handleAddKeyword} 
                      sx={{ ml: 1 }}
                      disabled={!newKeyword.trim()}
                    >
                      Add
                    </Button>
                  </Box>
                  
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Current Keywords:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {addingNewDomain ? (
                        newDomainKeywords.length > 0 ? (
                          newDomainKeywords.map((keyword, index) => (
                            <Chip 
                              key={index} 
                              label={keyword} 
                              size="small" 
                              onDelete={() => handleRemoveNewKeyword(keyword)}
                            />
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No keywords added yet
                          </Typography>
                        )
                      ) : editingDomain && (
                        editingDomain.keywords.map((keyword, index) => (
                          <Chip 
                            key={index} 
                            label={keyword} 
                            size="small" 
                            onDelete={() => handleRemoveKeyword(editingDomain.id, keyword)}
                          />
                        ))
                      )}
                    </Box>
                  </Box>
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleCloseDialog}>Cancel</Button>
                  {addingNewDomain ? (
                    <Button 
                      onClick={handleSaveNewDomain} 
                      variant="contained"
                      disabled={!newDomainName.trim() || newDomainKeywords.length === 0}
                    >
                      Save Domain
                    </Button>
                  ) : (
                    <Button onClick={handleCloseDialog} variant="contained">
                      Done
                    </Button>
                  )}
                </DialogActions>
              </Dialog>
            </>
          )}
        </Box>

        {/* System Logs Tab */}
        <Box role="tabpanel" hidden={tabValue !== 3} id="tabpanel-3" sx={{ p: 3 }}>
          {tabValue === 3 && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  System Logs
                </Typography>
                <Box>
                  <FormControl sx={{ minWidth: 150, mr: 2 }}>
                    <InputLabel id="log-level-label">Log Level</InputLabel>
                    <Select
                      labelId="log-level-label"
                      label="Log Level"
                      defaultValue="ALL"
                      size="small"
                    >
                      <MenuItem value="ALL">All Levels</MenuItem>
                      <MenuItem value="INFO">Info</MenuItem>
                      <MenuItem value="WARNING">Warning</MenuItem>
                      <MenuItem value="ERROR">Error</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl sx={{ minWidth: 150 }}>
                    <InputLabel id="service-label">Service</InputLabel>
                    <Select
                      labelId="service-label"
                      label="Service"
                      defaultValue="ALL"
                      size="small"
                    >
                      <MenuItem value="ALL">All Services</MenuItem>
                      <MenuItem value="auth">Authentication</MenuItem>
                      <MenuItem value="analysis">Analysis</MenuItem>
                      <MenuItem value="database">Database</MenuItem>
                      <MenuItem value="monitoring">Monitoring</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Level</TableCell>
                      <TableCell>Service</TableCell>
                      <TableCell>Message</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {systemLogs.map((log) => (
                      <TableRow key={log.id} sx={{
                        bgcolor: 
                          log.level === 'ERROR' ? 'rgba(255, 0, 0, 0.05)' :
                          log.level === 'WARNING' ? 'rgba(255, 152, 0, 0.05)' :
                          'inherit'
                      }}>
                        <TableCell>{log.timestamp}</TableCell>
                        <TableCell>
                          <Chip 
                            label={log.level} 
                            size="small" 
                            color={
                              log.level === 'ERROR' ? 'error' :
                              log.level === 'WARNING' ? 'warning' :
                              'info'
                            }
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{log.service}</TableCell>
                        <TableCell>{log.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="outlined">
                  Download Logs
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default AdminPanel;

// Helper component for LinearProgress
const LinearProgressWithLabel = (props) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" color="text.secondary">{`${Math.round(
          props.value,
        )}%`}</Typography>
      </Box>
    </Box>
  );
};