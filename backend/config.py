import os
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

class Config:
    # Flask configuration
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.environ.get('DEBUG', 'True') == 'True'
    ALLOWED_ORIGINS = os.environ.get('ALLOWED_ORIGINS', '*').split(',')
    
    # File upload configuration
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', 'uploads')
    MAX_CONTENT_LENGTH = int(os.environ.get('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))  # 16 MB max upload
    ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt'}
    
    # AWS Configuration
    AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')
    
    # DynamoDB configuration
    DYNAMODB_USERS_TABLE = os.environ.get('DYNAMODB_USERS_TABLE', 'PatentAnalyzer-Users')
    DYNAMODB_PATENTS_TABLE = os.environ.get('DYNAMODB_PATENTS_TABLE', 'PatentAnalyzer-Patents')
    DYNAMODB_ANALYSIS_TABLE = os.environ.get('DYNAMODB_ANALYSIS_TABLE', 'PatentAnalyzer-Analysis')
    DYNAMODB_DOMAIN_KEYWORDS_TABLE = os.environ.get('DYNAMODB_DOMAIN_KEYWORDS_TABLE', 'PatentAnalyzer-DomainKeywords')
    
    # Amazon Comprehend configuration
    COMPREHEND_MIN_CONFIDENCE = float(os.environ.get('COMPREHEND_MIN_CONFIDENCE', 0.5))
    
    # Amazon SNS configuration
    SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN', '')
    
    # Frontend URL for links in notifications
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
    
    # Analysis configuration
    SIMILARITY_THRESHOLD = float(os.environ.get('SIMILARITY_THRESHOLD', 0.8))  # 80% similarity for alerts
    
    # JWT configuration for authentication
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES', 3600))  # 1 hour
    
    # Logging configuration
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    
    # Cache configuration
    CACHE_TYPE = os.environ.get('CACHE_TYPE', 'simple')  # Use 'redis' in production
    CACHE_DEFAULT_TIMEOUT = int(os.environ.get('CACHE_DEFAULT_TIMEOUT', 300))  # 5 minutes
    
    # Performance configuration
    
    # System logs configuration
    DYNAMODB_SYSTEM_LOGS_TABLE = os.environ.get('DYNAMODB_SYSTEM_LOGS_TABLE', 'PatentAnalyzer-SystemLogs')
    BATCH_SIZE = int(os.environ.get('BATCH_SIZE', 25))  # Number of items to process in a batch