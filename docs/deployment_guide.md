# PatentAnalyzer Deployment Guide

This guide provides step-by-step instructions for deploying the PatentAnalyzer system on AWS Free Tier resources. The system uses AWS EC2, DynamoDB, Comprehend, and SNS to provide AI-powered patent analysis capabilities.

## Prerequisites

1. **AWS Account**: You need an AWS account with Free Tier eligibility
2. **AWS CLI**: Install and configure the AWS CLI on your local machine
3. **Python 3.8+**: Required for running the backend services
4. **Node.js 14+**: Required for building the React frontend
5. **Git**: For cloning the repository (optional)

## AWS Services Configuration

### 1. Set Up IAM Permissions

1. Log in to the AWS Management Console
2. Navigate to IAM (Identity and Access Management)
3. Create a new IAM user or use an existing one with programmatic access
4. Attach the following policies:
   - `AmazonDynamoDBFullAccess`
   - `ComprehendFullAccess`
   - `AmazonSNSFullAccess`
   - `AmazonEC2FullAccess` (or a more restricted policy for EC2 if preferred)
5. Save the Access Key ID and Secret Access Key for later use

### 2. Configure AWS CLI

Run the following command and enter your AWS credentials:

```bash
aws configure
```

## Deployment Steps

### 1. Clone or Download the PatentAnalyzer Code

If you received the code as a ZIP file, extract it. Otherwise, clone the repository:

```bash
git clone <repository-url>
cd PatentAnalyzer
```

### 2. Set Up Environment Variables

Create a `.env` file in the backend directory with the following variables:

```
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key

# DynamoDB Tables
DYNAMODB_USERS_TABLE=PatentAnalyzer_Users
DYNAMODB_PATENTS_TABLE=PatentAnalyzer_Patents
DYNAMODB_ANALYSIS_TABLE=PatentAnalyzer_Analysis
DYNAMODB_DOMAIN_KEYWORDS_TABLE=PatentAnalyzer_DomainKeywords
DYNAMODB_SYSTEM_LOGS_TABLE=PatentAnalyzer_SystemLogs

# Comprehend Configuration
COMPREHEND_MIN_CONFIDENCE=0.5

# SNS Configuration
SNS_TOPIC_ARN=

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# File Upload Configuration
UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=16777216

# Analysis Configuration
SIMILARITY_THRESHOLD=0.7
```

Note: You'll update the `SNS_TOPIC_ARN` after creating the SNS topic in a later step.

### 3. Set Up DynamoDB Tables

The PatentAnalyzer system uses several DynamoDB tables to store data. These tables will be created automatically by the `setup_dynamodb.py` script, but you need to ensure the table names are properly configured in your environment variables.

The following tables will be created:

- `PatentAnalyzer-Users`: Stores user account information
- `PatentAnalyzer-Patents`: Stores patent documents and metadata
- `PatentAnalyzer-Analysis`: Stores analysis results and job status
- `PatentAnalyzer-DomainKeywords`: Stores domain-specific keywords for analysis
- `PatentAnalyzer-SystemLogs`: Stores application logs for monitoring and troubleshooting

Run the DynamoDB setup script to create the required tables and load sample data:

```bash
cd backend
python -m scripts.setup_dynamodb
```

### 4. Create SNS Topic

1. Navigate to the Amazon SNS console
2. Click "Create topic"
3. Select "Standard" type
4. Name the topic "PatentAnalyzer_Alerts"
5. Click "Create topic"
6. Copy the Topic ARN and update the `SNS_TOPIC_ARN` in your `.env` file

### 5. Configure Notification Templates

The system uses customizable templates for sending notifications via SNS. These templates are located in the `backend/templates` directory.

1. Review the default templates in `backend/templates/sns_alert_template.json`
2. The templates use Jinja2 syntax and support the following formats:
   - Default: A simple text message used as a fallback
   - Email: Contains both text and HTML versions of the email
   - SMS: A short message format for SMS notifications
3. You can customize these templates to match your organization's branding and notification requirements
4. Test the templates using the provided script:

```bash
cd backend
python -m scripts.test_notification_template
```

### 6. System Logs

The PatentAnalyzer system includes a comprehensive logging system that stores application logs in DynamoDB for monitoring and troubleshooting.

#### System Logs Features

- Logs are stored in the `PatentAnalyzer-SystemLogs` DynamoDB table
- Each log entry includes timestamp, log level, message, service, and optional additional data
- Logs can be filtered by level, service, and date range
- The system provides API endpoints for retrieving, adding, and clearing logs

#### System Logs API Endpoints

1. **Get System Logs**
   - Endpoint: `GET /api/admin/system-logs`
   - Query Parameters:
     - `level`: Filter by log level (INFO, WARNING, ERROR, etc.)
     - `service`: Filter by service name
     - `start_date`: Filter logs after this date (ISO format)
     - `end_date`: Filter logs before this date (ISO format)
     - `limit`: Maximum number of logs to return (default: 100)

2. **Add System Log**
   - Endpoint: `POST /api/admin/system-logs`
   - Request Body:
     ```json
     {
       "level": "INFO",
       "message": "Log message",
       "service": "api",
       "additional_data": { "key": "value" } // Optional
     }
     ```

3. **Clear System Logs**
   - Endpoint: `POST /api/admin/system-logs/clear`
   - Request Body (optional):
     ```json
     {
       "older_than": "2023-01-01T00:00:00" // ISO format date
     }
     ```
   - If `older_than` is not provided, all logs will be cleared

### 7. Deploy Backend on EC2

#### Launch EC2 Instance

1. Navigate to the EC2 console
2. Click "Launch Instance"
3. Choose "Amazon Linux 2 AMI" (Free tier eligible)
4. Select "t2.micro" instance type (Free tier eligible)
5. Configure instance details as needed
6. Add storage (default 8GB is sufficient)
7. Add tags if desired
8. Configure security group to allow:
   - SSH (port 22) from your IP
   - HTTP (port 80) from anywhere
   - HTTPS (port 443) from anywhere
   - Custom TCP (port 5000) from anywhere (for the Flask API)
9. Review and launch the instance
10. Create or select an existing key pair for SSH access

#### Connect to EC2 Instance

```bash
ssh -i /path/to/your-key.pem ec2-user@your-instance-public-dns
```

#### Install Dependencies

```bash
# Update system packages
sudo yum update -y

# Install Python 3 and pip
sudo yum install python3 python3-pip -y

# Install Git
sudo yum install git -y

# Install Node.js and npm
curl -sL https://rpm.nodesource.com/setup_14.x | sudo bash -
sudo yum install nodejs -y
```

#### Deploy Backend

```bash
# Clone or copy your code to the EC2 instance
git clone <repository-url> || scp -r /path/to/local/code ec2-user@your-instance-public-dns:~/
cd PatentAnalyzer/backend

# Install Python dependencies
pip3 install -r requirements.txt

# Set up environment variables
# Copy your .env file to the EC2 instance or create it directly

# Run the Flask application with Gunicorn
pip3 install gunicorn
gunicorn -b 0.0.0.0:5000 app:app --daemon
```

### 7. Deploy Frontend

#### Build Frontend

You can build the frontend locally and then deploy it to the EC2 instance, or build it directly on the EC2 instance:

```bash
# Navigate to the frontend directory
cd ../frontend

# Install dependencies
npm install

# Build the production version
npm run build
```

#### Serve Frontend with Nginx

```bash
# Install Nginx
sudo yum install nginx -y

# Configure Nginx
sudo nano /etc/nginx/nginx.conf
```

Add the following configuration to the `http` block:

```nginx
server {
    listen 80;
    server_name your-instance-public-dns;

    location / {
        root /home/ec2-user/PatentAnalyzer/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Start Nginx:

```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 8. Set Up Automatic Startup

Create a systemd service for the Flask backend:

```bash
sudo nano /etc/systemd/system/patentanalyzer.service
```

Add the following content:

```ini
[Unit]
Description=PatentAnalyzer Flask Backend
After=network.target

[Service]
User=ec2-user
WorkingDirectory=/home/ec2-user/PatentAnalyzer/backend
EnvironmentFile=/home/ec2-user/PatentAnalyzer/backend/.env
ExecStart=/usr/local/bin/gunicorn -b 0.0.0.0:5000 app:app
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl enable patentanalyzer
sudo systemctl start patentanalyzer
```

## Verification

1. Open a web browser and navigate to your EC2 instance's public DNS or IP address
2. You should see the PatentAnalyzer frontend
3. Test the system by creating an account and submitting a patent for analysis

## Monitoring and Maintenance

### Check Service Status

```bash
sudo systemctl status patentanalyzer
sudo systemctl status nginx
```

### View Logs

```bash
# Backend logs
journalctl -u patentanalyzer

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Update the Application

```bash
# Pull latest code
cd ~/PatentAnalyzer
git pull

# Rebuild frontend
cd frontend
npm install
npm run build

# Restart backend
sudo systemctl restart patentanalyzer
```

## AWS Free Tier Considerations

To stay within AWS Free Tier limits:

1. **EC2**: Use t2.micro instance type (750 hours per month)
2. **DynamoDB**: Stay within 25GB of storage and 25 WCU/RCU
3. **Comprehend**: Be aware that Comprehend has limited Free Tier offerings. Monitor usage closely.
4. **SNS**: First 1 million SNS requests per month are free

Set up CloudWatch Alarms to monitor usage and avoid unexpected charges.

## Troubleshooting

### Common Issues

1. **Connection Refused**: Check that security groups allow traffic on the required ports
2. **Backend Not Starting**: Check the systemd logs with `journalctl -u patentanalyzer`
3. **Frontend Not Loading**: Verify Nginx configuration and restart with `sudo systemctl restart nginx`
4. **AWS Service Errors**: Verify IAM permissions and AWS credentials

### AWS Support

If you encounter issues with AWS services, consult the AWS documentation or contact AWS Support.

## Security Considerations

1. **Restrict Security Groups**: Limit access to your EC2 instance
2. **Use HTTPS**: Consider setting up SSL/TLS with Let's Encrypt
3. **Rotate Credentials**: Regularly update AWS access keys and application secrets
4. **Update Regularly**: Keep the system and dependencies updated

## Conclusion

Your PatentAnalyzer system should now be deployed and operational on AWS Free Tier resources. The system provides AI-powered patent analysis capabilities, including prior art search and infringement detection.

For additional assistance or feature requests, please contact the development team.