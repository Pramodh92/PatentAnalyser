import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Stack
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import WarningIcon from '@mui/icons-material/Warning';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import AnalyticsIcon from '@mui/icons-material/Analytics';

const Home = () => {
  const features = [
    {
      title: 'Prior Art Search',
      description: 'Automatically search for prior art related to your patent claims using advanced NLP and semantic analysis.',
      icon: <SearchIcon sx={{ fontSize: 60, color: 'primary.main' }} />
    },
    {
      title: 'Infringement Detection',
      description: 'Identify potential patent infringements by analyzing semantic similarities between patents.',
      icon: <WarningIcon sx={{ fontSize: 60, color: 'secondary.main' }} />
    },
    {
      title: 'Real-time Alerts',
      description: 'Receive notifications when new patents are filed that may impact your intellectual property.',
      icon: <NotificationsActiveIcon sx={{ fontSize: 60, color: 'primary.main' }} />
    },
    {
      title: 'Comprehensive Analytics',
      description: 'Gain insights into patent trends, technology domains, and competitive landscape.',
      icon: <AnalyticsIcon sx={{ fontSize: 60, color: 'secondary.main' }} />
    }
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          mb: 6
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" gutterBottom>
                AI-Powered Patent Analysis
              </Typography>
              <Typography variant="h5" paragraph>
                Automate prior art search and infringement detection with advanced NLP and AWS technology.
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  component={RouterLink}
                  to="/signup"
                >
                  Get Started
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  size="large"
                  component={RouterLink}
                  to="/login"
                >
                  Login
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src="/patent-analysis.svg"
                alt="Patent Analysis"
                sx={{
                  width: '100%',
                  maxHeight: 400,
                  display: { xs: 'none', md: 'block' }
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Typography variant="h3" component="h2" align="center" gutterBottom>
          Features
        </Typography>
        <Typography variant="h6" align="center" color="text.secondary" paragraph sx={{ mb: 6 }}>
          Leverage the power of AWS and AI to protect your intellectual property
        </Typography>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item key={index} xs={12} sm={6} md={3}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: '0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 6
                  }
                }}
              >
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                  {feature.icon}
                </Box>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="h3" align="center">
                    {feature.title}
                  </Typography>
                  <Typography align="center">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* How It Works Section */}
      <Box sx={{ bgcolor: 'grey.100', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" component="h2" align="center" gutterBottom>
            How It Works
          </Typography>
          <Typography variant="h6" align="center" color="text.secondary" paragraph sx={{ mb: 6 }}>
            Our AI-powered system simplifies the patent analysis process
          </Typography>

          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardMedia
                  component="div"
                  sx={{
                    pt: '56.25%',
                    bgcolor: 'primary.light'
                  }}
                />
                <CardContent>
                  <Typography gutterBottom variant="h5" component="h3">
                    1. Submit Your Patent
                  </Typography>
                  <Typography>
                    Upload your patent document or invention text and select the relevant technology domain.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardMedia
                  component="div"
                  sx={{
                    pt: '56.25%',
                    bgcolor: 'secondary.light'
                  }}
                />
                <CardContent>
                  <Typography gutterBottom variant="h5" component="h3">
                    2. AI Analysis
                  </Typography>
                  <Typography>
                    Our system uses AWS Comprehend to extract key phrases, entities, and perform semantic analysis.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardMedia
                  component="div"
                  sx={{
                    pt: '56.25%',
                    bgcolor: 'primary.light'
                  }}
                />
                <CardContent>
                  <Typography gutterBottom variant="h5" component="h3">
                    3. Get Results
                  </Typography>
                  <Typography>
                    Receive detailed analysis with potential prior art matches, infringement risks, and recommendations.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ bgcolor: 'secondary.main', color: 'white', py: 8 }}>
        <Container maxWidth="md">
          <Typography variant="h4" align="center" gutterBottom>
            Ready to protect your intellectual property?
          </Typography>
          <Typography variant="h6" align="center" paragraph>
            Join PatentAnalyzer today and leverage the power of AI for patent analysis.
          </Typography>
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              component={RouterLink}
              to="/signup"
              sx={{ px: 4, py: 1.5 }}
            >
              Get Started Now
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;