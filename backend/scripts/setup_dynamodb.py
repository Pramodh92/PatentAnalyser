import boto3
import json
import os
import sys
import time
from datetime import datetime

# Add the parent directory to the path so we can import from the config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import Config

# Initialize boto3 client with AWS credentials
dynamodb = boto3.resource('dynamodb', 
                         region_name=Config.AWS_REGION,
                         aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
                         aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY'))

def create_users_table():
    """Create the Users table in DynamoDB"""
    table = dynamodb.create_table(
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
                'IndexName': 'EmailIndex',
                'KeySchema': [
                    {'AttributeName': 'email', 'KeyType': 'HASH'},
                ],
                'Projection': {
                    'ProjectionType': 'ALL'
                },
                'ProvisionedThroughput': {
                    'ReadCapacityUnits': 5,
                    'WriteCapacityUnits': 5
                }
            },
        ],
        ProvisionedThroughput={
            'ReadCapacityUnits': 5,
            'WriteCapacityUnits': 5
        }
    )
    print(f"Created table {Config.DYNAMODB_USERS_TABLE}. Waiting for it to become active...")
    table.meta.client.get_waiter('table_exists').wait(TableName=Config.DYNAMODB_USERS_TABLE)
    print(f"Table {Config.DYNAMODB_USERS_TABLE} is now active.")
    return table

def create_patents_table():
    """Create the Patents table in DynamoDB"""
    table = dynamodb.create_table(
        TableName=Config.DYNAMODB_PATENTS_TABLE,
        KeySchema=[
            {'AttributeName': 'patent_id', 'KeyType': 'HASH'}
        ],
        AttributeDefinitions=[
            {'AttributeName': 'patent_id', 'AttributeType': 'S'},
            {'AttributeName': 'user_id', 'AttributeType': 'S'},
            {'AttributeName': 'technology_domain', 'AttributeType': 'S'},
            {'AttributeName': 'submission_date', 'AttributeType': 'S'}
        ],
        GlobalSecondaryIndexes=[
            {
                'IndexName': 'UserIdIndex',
                'KeySchema': [
                    {'AttributeName': 'user_id', 'KeyType': 'HASH'},
                    {'AttributeName': 'submission_date', 'KeyType': 'RANGE'}
                ],
                'Projection': {
                    'ProjectionType': 'ALL'
                },
                'ProvisionedThroughput': {
                    'ReadCapacityUnits': 5,
                    'WriteCapacityUnits': 5
                }
            },
            {
                'IndexName': 'DomainIndex',
                'KeySchema': [
                    {'AttributeName': 'technology_domain', 'KeyType': 'HASH'},
                    {'AttributeName': 'submission_date', 'KeyType': 'RANGE'}
                ],
                'Projection': {
                    'ProjectionType': 'ALL'
                },
                'ProvisionedThroughput': {
                    'ReadCapacityUnits': 5,
                    'WriteCapacityUnits': 5
                }
            },
        ],
        ProvisionedThroughput={
            'ReadCapacityUnits': 5,
            'WriteCapacityUnits': 5
        }
    )
    print(f"Created table {Config.DYNAMODB_PATENTS_TABLE}. Waiting for it to become active...")
    table.meta.client.get_waiter('table_exists').wait(TableName=Config.DYNAMODB_PATENTS_TABLE)
    print(f"Table {Config.DYNAMODB_PATENTS_TABLE} is now active.")
    return table

def create_analysis_table():
    """Create the Analysis table in DynamoDB"""
    table = dynamodb.create_table(
        TableName=Config.DYNAMODB_ANALYSIS_TABLE,
        KeySchema=[
            {'AttributeName': 'analysis_id', 'KeyType': 'HASH'}
        ],
        AttributeDefinitions=[
            {'AttributeName': 'analysis_id', 'AttributeType': 'S'},
            {'AttributeName': 'patent_id', 'AttributeType': 'S'},
            {'AttributeName': 'creation_date', 'AttributeType': 'S'}
        ],
        GlobalSecondaryIndexes=[
            {
                'IndexName': 'PatentIdIndex',
                'KeySchema': [
                    {'AttributeName': 'patent_id', 'KeyType': 'HASH'},
                    {'AttributeName': 'creation_date', 'KeyType': 'RANGE'}
                ],
                'Projection': {
                    'ProjectionType': 'ALL'
                },
                'ProvisionedThroughput': {
                    'ReadCapacityUnits': 5,
                    'WriteCapacityUnits': 5
                }
            },
        ],
        ProvisionedThroughput={
            'ReadCapacityUnits': 5,
            'WriteCapacityUnits': 5
        }
    )
    print(f"Created table {Config.DYNAMODB_ANALYSIS_TABLE}. Waiting for it to become active...")
    table.meta.client.get_waiter('table_exists').wait(TableName=Config.DYNAMODB_ANALYSIS_TABLE)
    print(f"Table {Config.DYNAMODB_ANALYSIS_TABLE} is now active.")
    return table

def create_domain_keywords_table():
    """Create the Domain Keywords table in DynamoDB"""
    table = dynamodb.create_table(
        TableName=Config.DYNAMODB_DOMAIN_KEYWORDS_TABLE,
        KeySchema=[
            {'AttributeName': 'keyword_id', 'KeyType': 'HASH'}
        ],
        AttributeDefinitions=[
            {'AttributeName': 'keyword_id', 'AttributeType': 'S'},
            {'AttributeName': 'domain', 'AttributeType': 'S'}
        ],
        GlobalSecondaryIndexes=[
            {
                'IndexName': 'DomainIndex',
                'KeySchema': [
                    {'AttributeName': 'domain', 'KeyType': 'HASH'},
                ],
                'Projection': {
                    'ProjectionType': 'ALL'
                },
                'ProvisionedThroughput': {
                    'ReadCapacityUnits': 5,
                    'WriteCapacityUnits': 5
                }
            },
        ],
        ProvisionedThroughput={
            'ReadCapacityUnits': 5,
            'WriteCapacityUnits': 5
        }
    )
    print(f"Created table {Config.DYNAMODB_DOMAIN_KEYWORDS_TABLE}. Waiting for it to become active...")
    table.meta.client.get_waiter('table_exists').wait(TableName=Config.DYNAMODB_DOMAIN_KEYWORDS_TABLE)
    print(f"Table {Config.DYNAMODB_DOMAIN_KEYWORDS_TABLE} is now active.")
    return table

def create_system_logs_table():
    """Create the System Logs table in DynamoDB"""
    table = dynamodb.create_table(
        TableName=Config.DYNAMODB_SYSTEM_LOGS_TABLE,
        KeySchema=[
            {'AttributeName': 'log_id', 'KeyType': 'HASH'}
        ],
        AttributeDefinitions=[
            {'AttributeName': 'log_id', 'AttributeType': 'S'},
            {'AttributeName': 'timestamp', 'AttributeType': 'S'},
            {'AttributeName': 'log_level', 'AttributeType': 'S'},
            {'AttributeName': 'service', 'AttributeType': 'S'}
        ],
        GlobalSecondaryIndexes=[
            {
                'IndexName': 'TimestampIndex',
                'KeySchema': [
                    {'AttributeName': 'timestamp', 'KeyType': 'HASH'},
                ],
                'Projection': {
                    'ProjectionType': 'ALL'
                },
                'ProvisionedThroughput': {
                    'ReadCapacityUnits': 5,
                    'WriteCapacityUnits': 5
                }
            },
            {
                'IndexName': 'LogLevelIndex',
                'KeySchema': [
                    {'AttributeName': 'log_level', 'KeyType': 'HASH'},
                    {'AttributeName': 'timestamp', 'KeyType': 'RANGE'}
                ],
                'Projection': {
                    'ProjectionType': 'ALL'
                },
                'ProvisionedThroughput': {
                    'ReadCapacityUnits': 5,
                    'WriteCapacityUnits': 5
                }
            },
            {
                'IndexName': 'ServiceIndex',
                'KeySchema': [
                    {'AttributeName': 'service', 'KeyType': 'HASH'},
                    {'AttributeName': 'timestamp', 'KeyType': 'RANGE'}
                ],
                'Projection': {
                    'ProjectionType': 'ALL'
                },
                'ProvisionedThroughput': {
                    'ReadCapacityUnits': 5,
                    'WriteCapacityUnits': 5
                }
            },
        ],
        ProvisionedThroughput={
            'ReadCapacityUnits': 5,
            'WriteCapacityUnits': 5
        }
    )
    print(f"Created table {Config.DYNAMODB_SYSTEM_LOGS_TABLE}. Waiting for it to become active...")
    table.meta.client.get_waiter('table_exists').wait(TableName=Config.DYNAMODB_SYSTEM_LOGS_TABLE)
    print(f"Table {Config.DYNAMODB_SYSTEM_LOGS_TABLE} is now active.")
    return table

def load_sample_data():
    """Load sample data into the DynamoDB tables"""
    # Load sample patents
    patents_table = dynamodb.Table(Config.DYNAMODB_PATENTS_TABLE)
    sample_data_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'sample_data', 'sample_patents.json')
    
    try:
        with open(sample_data_path, 'r') as file:
            patents = json.load(file)
            
        print(f"Loading {len(patents)} sample patents into DynamoDB...")
        for patent in patents:
            patents_table.put_item(Item=patent)
        print("Sample patents loaded successfully.")
    except Exception as e:
        print(f"Error loading sample patents: {str(e)}")
    
    # Create sample users
    users_table = dynamodb.Table(Config.DYNAMODB_USERS_TABLE)
    sample_users = [
        {
            'user_id': 'user-001',
            'email': 'john.smith@example.com',
            'password_hash': 'bcrypt_hash_would_go_here',  # In a real system, this would be a proper bcrypt hash
            'first_name': 'John',
            'last_name': 'Smith',
            'role': 'admin',
            'created_at': datetime.now().isoformat(),
            'last_login': datetime.now().isoformat(),
            'status': 'active'
        },
        {
            'user_id': 'user-002',
            'email': 'maria.rodriguez@example.com',
            'password_hash': 'bcrypt_hash_would_go_here',  # In a real system, this would be a proper bcrypt hash
            'first_name': 'Maria',
            'last_name': 'Rodriguez',
            'role': 'inventor',
            'created_at': datetime.now().isoformat(),
            'last_login': datetime.now().isoformat(),
            'status': 'active'
        },
        {
            'user_id': 'user-003',
            'email': 'robert.johnson@example.com',
            'password_hash': 'bcrypt_hash_would_go_here',  # In a real system, this would be a proper bcrypt hash
            'first_name': 'Robert',
            'last_name': 'Johnson',
            'role': 'analyst',
            'created_at': datetime.now().isoformat(),
            'last_login': datetime.now().isoformat(),
            'status': 'active'
        }
    ]
    
    print("Loading sample users into DynamoDB...")
    for user in sample_users:
        users_table.put_item(Item=user)
    print("Sample users loaded successfully.")
    
    # Create sample domain keywords
    domain_keywords_table = dynamodb.Table(Config.DYNAMODB_DOMAIN_KEYWORDS_TABLE)
    sample_keywords = [
        {
            'keyword_id': 'kw-001',
            'domain': 'AI',
            'keyword': 'neural network',
            'weight': 0.9,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        },
        {
            'keyword_id': 'kw-002',
            'domain': 'AI',
            'keyword': 'machine learning',
            'weight': 0.85,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        },
        {
            'keyword_id': 'kw-003',
            'domain': 'AI',
            'keyword': 'deep learning',
            'weight': 0.8,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        },
        {
            'keyword_id': 'kw-004',
            'domain': 'Biotech',
            'keyword': 'CRISPR',
            'weight': 0.95,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        },
        {
            'keyword_id': 'kw-005',
            'domain': 'Biotech',
            'keyword': 'gene editing',
            'weight': 0.9,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        },
        {
            'keyword_id': 'kw-006',
            'domain': 'Biotech',
            'keyword': 'tissue engineering',
            'weight': 0.85,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        },
        {
            'keyword_id': 'kw-007',
            'domain': 'Electronics',
            'keyword': 'photovoltaic',
            'weight': 0.9,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        },
        {
            'keyword_id': 'kw-008',
            'domain': 'Electronics',
            'keyword': 'quantum dot',
            'weight': 0.85,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        },
        {
            'keyword_id': 'kw-009',
            'domain': 'Electronics',
            'keyword': 'flexible battery',
            'weight': 0.8,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
    ]
    
    print("Loading sample domain keywords into DynamoDB...")
    for keyword in sample_keywords:
        domain_keywords_table.put_item(Item=keyword)
    print("Sample domain keywords loaded successfully.")

def main():
    """Main function to set up DynamoDB tables and load sample data"""
    try:
        print("Setting up DynamoDB tables for PatentAnalyzer...")
        
        # Create tables with error handling for each table
        tables_to_create = [
            ("Users", create_users_table),
            ("Patents", create_patents_table),
            ("Analysis", create_analysis_table),
            ("Domain Keywords", create_domain_keywords_table),
            ("System Logs", create_system_logs_table)
        ]
        
        for table_name, create_function in tables_to_create:
            try:
                create_function()
            except Exception as e:
                if 'ResourceInUseException' in str(e):
                    print(f"Table {table_name} already exists. Skipping creation.")
                else:
                    print(f"Error creating {table_name} table: {str(e)}")
                    raise
        
        # Load sample data
        print("\nLoading sample data...")
        try:
            load_sample_data()
        except Exception as e:
            print(f"Warning: Error loading sample data: {str(e)}")
            print("Continuing with setup...")
        
        print("\nDynamoDB setup completed successfully!")
        
    except Exception as e:
        print(f"Error setting up DynamoDB: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()