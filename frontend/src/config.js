// AWS Configuration
const config = {
  // API Gateway configuration
  apiGateway: {
    REGION: process.env.REACT_APP_REGION || 'us-east-1',
    URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
  },
  // Cognito configuration
  cognito: {
    REGION: process.env.REACT_APP_REGION || 'us-east-1',
    USER_POOL_ID: process.env.REACT_APP_USER_POOL_ID || 'us-east-1_XXXXXXXXX',
    APP_CLIENT_ID: process.env.REACT_APP_USER_POOL_CLIENT_ID || 'XXXXXXXXXXXXXXXXXXXXXXXXXX',
    IDENTITY_POOL_ID: process.env.REACT_APP_IDENTITY_POOL_ID || 'us-east-1:XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX'
  },
  // S3 configuration for file uploads
  s3: {
    REGION: process.env.REACT_APP_REGION || 'us-east-1',
    BUCKET: process.env.REACT_APP_BUCKET || 'patent-analyzer-uploads'
  }
};

export default config;