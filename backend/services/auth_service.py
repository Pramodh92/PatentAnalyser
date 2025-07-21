import boto3
import uuid
import hashlib
import hmac
import base64
import json
import jwt
import logging
from datetime import datetime, timedelta
from botocore.exceptions import ClientError
from config import Config

logger = logging.getLogger(__name__)

class AuthService:
    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb', region_name=Config.AWS_REGION)
        self.users_table = self.dynamodb.Table(Config.DYNAMODB_USERS_TABLE)
        self.jwt_secret = Config.JWT_SECRET_KEY
        self.token_expiry = Config.JWT_ACCESS_TOKEN_EXPIRES
        
        # Ensure the table exists
        self._create_users_table_if_not_exists()
    
    def _create_users_table_if_not_exists(self):
        """Create the users table if it doesn't exist"""
        try:
            # Check if table exists
            self.dynamodb.meta.client.describe_table(TableName=Config.DYNAMODB_USERS_TABLE)
            logger.info(f"Table {Config.DYNAMODB_USERS_TABLE} already exists")
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                # Create the table
                table = self.dynamodb.create_table(
                    TableName=Config.DYNAMODB_USERS_TABLE,
                    KeySchema=[
                        {'AttributeName': 'user_id', 'KeyType': 'HASH'}
                    ],
                    AttributeDefinitions=[
                        {'AttributeName': 'user_id', 'AttributeType': 'S'},
                        {'AttributeName': 'email', 'AttributeType': 'S'}
                    ],
                    GlobalSecondaryIndexes=[
                        {
                            'IndexName': 'email-index',
                            'KeySchema': [
                                {'AttributeName': 'email', 'KeyType': 'HASH'}
                            ],
                            'Projection': {
                                'ProjectionType': 'ALL'
                            },
                            'ProvisionedThroughput': {
                                'ReadCapacityUnits': 5,
                                'WriteCapacityUnits': 5
                            }
                        }
                    ],
                    ProvisionedThroughput={
                        'ReadCapacityUnits': 5,
                        'WriteCapacityUnits': 5
                    }
                )
                # Wait for the table to be created
                table.meta.client.get_waiter('table_exists').wait(TableName=Config.DYNAMODB_USERS_TABLE)
                logger.info(f"Created table {Config.DYNAMODB_USERS_TABLE}")
            else:
                logger.error(f"Error checking/creating table: {e}")
                raise
    
    def _hash_password(self, password, salt=None):
        """Hash a password for storing"""
        if salt is None:
            salt = base64.b64encode(uuid.uuid4().bytes).decode('utf-8')
        
        # Use HMAC with SHA-256 for password hashing
        pwdhash = base64.b64encode(hmac.new(
            salt.encode('utf-8'),
            password.encode('utf-8'),
            hashlib.sha256
        ).digest()).decode('utf-8')
        
        return f"{salt}${pwdhash}"
    
    def _verify_password(self, stored_password, provided_password):
        """Verify a stored password against one provided by user"""
        salt, stored_hash = stored_password.split('$')
        return stored_password == self._hash_password(provided_password, salt)
    
    def _generate_token(self, user):
        """Generate a JWT token for the user"""
        payload = {
            'user_id': user['user_id'],
            'email': user['email'],
            'role': user['role'],
            'exp': datetime.utcnow() + timedelta(seconds=self.token_expiry)
        }
        return jwt.encode(payload, self.jwt_secret, algorithm='HS256')
    
    def _get_user_by_email(self, email):
        """Get a user by email"""
        response = self.users_table.query(
            IndexName='email-index',
            KeyConditionExpression=boto3.dynamodb.conditions.Key('email').eq(email)
        )
        
        items = response.get('Items', [])
        return items[0] if items else None
    
    def register_user(self, email, password, name, role='inventor'):
        """Register a new user"""
        if not email or not password or not name:
            raise ValueError("Email, password, and name are required")
        
        # Check if user already exists
        existing_user = self._get_user_by_email(email)
        if existing_user:
            raise ValueError("User with this email already exists")
        
        # Create new user
        user_id = str(uuid.uuid4())
        hashed_password = self._hash_password(password)
        
        user = {
            'user_id': user_id,
            'email': email,
            'password': hashed_password,
            'name': name,
            'role': role,
            'status': 'active',
            'created_at': datetime.utcnow().isoformat(),
            'last_login': None
        }
        
        # Save user to DynamoDB
        self.users_table.put_item(Item=user)
        
        # Don't return the password
        user.pop('password', None)
        
        # Generate token
        token = self._generate_token(user)
        
        return {
            'user': user,
            'token': token
        }
    
    def login_user(self, email, password):
        """Login a user"""
        if not email or not password:
            raise ValueError("Email and password are required")
        
        # Get user by email
        user = self._get_user_by_email(email)
        if not user:
            raise ValueError("Invalid email or password")
        
        # Check password
        if not self._verify_password(user['password'], password):
            raise ValueError("Invalid email or password")
        
        # Check if user is active
        if user.get('status') != 'active':
            raise ValueError("Account is inactive. Please contact an administrator.")
        
        # Update last login
        self.users_table.update_item(
            Key={'user_id': user['user_id']},
            UpdateExpression="set last_login = :login",
            ExpressionAttributeValues={
                ':login': datetime.utcnow().isoformat()
            }
        )
        
        # Don't return the password
        user.pop('password', None)
        
        # Generate token
        token = self._generate_token(user)
        
        return {
            'user': user,
            'token': token
        }
    
    def get_user(self, user_id):
        """Get a user by ID"""
        response = self.users_table.get_item(Key={'user_id': user_id})
        user = response.get('Item')
        
        if not user:
            raise ValueError(f"User with ID {user_id} not found")
        
        # Don't return the password
        user.pop('password', None)
        
        return user
    
    def update_user(self, user_id, updates):
        """Update a user"""
        # Get the current user
        current_user = self.get_user(user_id)
        
        # Don't allow updating certain fields
        for field in ['user_id', 'email', 'created_at']:
            updates.pop(field, None)
        
        # If updating password, hash it
        if 'password' in updates:
            updates['password'] = self._hash_password(updates['password'])
        
        # Build update expression
        update_expression = "set "
        expression_attribute_values = {}
        
        for key, value in updates.items():
            update_expression += f"{key} = :{key}, "
            expression_attribute_values[f":{key}"] = value
        
        # Remove trailing comma and space
        update_expression = update_expression[:-2]
        
        # Update the user
        self.users_table.update_item(
            Key={'user_id': user_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_attribute_values
        )
        
        # Get and return the updated user
        return self.get_user(user_id)
    
    def delete_user(self, user_id):
        """Delete a user"""
        # Check if user exists
        self.get_user(user_id)
        
        # Delete the user
        self.users_table.delete_item(Key={'user_id': user_id})
        
        return {'message': f"User {user_id} deleted successfully"}
    
    def get_all_users(self):
        """Get all users (admin only)"""
        response = self.users_table.scan()
        users = response.get('Items', [])
        
        # Don't return passwords
        for user in users:
            user.pop('password', None)
        
        return users
    
    def verify_token(self, token):
        """Verify a JWT token"""
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            raise ValueError("Token has expired")
        except jwt.InvalidTokenError:
            raise ValueError("Invalid token")