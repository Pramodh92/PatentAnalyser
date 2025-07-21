import boto3
import uuid
import logging
import json
from datetime import datetime
from botocore.exceptions import ClientError
from config import Config

logger = logging.getLogger(__name__)

class PatentService:
    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb', region_name=Config.AWS_REGION)
        self.patents_table = self.dynamodb.Table(Config.DYNAMODB_PATENTS_TABLE)
        
        # Ensure the table exists
        self._create_patents_table_if_not_exists()
    
    def _create_patents_table_if_not_exists(self):
        """Create the patents table if it doesn't exist"""
        try:
            # Check if table exists
            self.dynamodb.meta.client.describe_table(TableName=Config.DYNAMODB_PATENTS_TABLE)
            logger.info(f"Table {Config.DYNAMODB_PATENTS_TABLE} already exists")
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                # Create the table
                table = self.dynamodb.create_table(
                    TableName=Config.DYNAMODB_PATENTS_TABLE,
                    KeySchema=[
                        {'AttributeName': 'patent_id', 'KeyType': 'HASH'}
                    ],
                    AttributeDefinitions=[
                        {'AttributeName': 'patent_id', 'AttributeType': 'S'},
                        {'AttributeName': 'user_id', 'AttributeType': 'S'},
                        {'AttributeName': 'submission_date', 'AttributeType': 'S'}
                    ],
                    GlobalSecondaryIndexes=[
                        {
                            'IndexName': 'user-id-index',
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
                        }
                    ],
                    ProvisionedThroughput={
                        'ReadCapacityUnits': 5,
                        'WriteCapacityUnits': 5
                    }
                )
                # Wait for the table to be created
                table.meta.client.get_waiter('table_exists').wait(TableName=Config.DYNAMODB_PATENTS_TABLE)
                logger.info(f"Created table {Config.DYNAMODB_PATENTS_TABLE}")
            else:
                logger.error(f"Error checking/creating table: {e}")
                raise
    
    def submit_patent(self, patent_data):
        """Submit a new patent for analysis"""
        # Validate required fields
        required_fields = ['user_id', 'title', 'inventors', 'technology_domain']
        for field in required_fields:
            if field not in patent_data:
                raise ValueError(f"Missing required field: {field}")
        
        # Generate a unique ID for the patent
        patent_id = str(uuid.uuid4())
        submission_date = datetime.utcnow().isoformat()
        
        # Prepare the patent item
        patent_item = {
            'patent_id': patent_id,
            'user_id': patent_data['user_id'],
            'title': patent_data['title'],
            'inventors': patent_data['inventors'],
            'technology_domain': patent_data['technology_domain'],
            'submission_date': submission_date,
            'status': 'submitted',
            'abstract': patent_data.get('abstract', ''),
            'description': patent_data.get('description', ''),
            'claims': patent_data.get('claims', ''),
            'file_path': patent_data.get('file_path', None),
            'file_type': patent_data.get('file_type', None),
            'metadata': patent_data.get('metadata', {})
        }
        
        # Save to DynamoDB
        self.patents_table.put_item(Item=patent_item)
        
        logger.info(f"Patent {patent_id} submitted successfully")
        
        return {
            'patent_id': patent_id,
            'submission_date': submission_date,
            'status': 'submitted'
        }
    
    def get_patent(self, patent_id):
        """Get a patent by ID"""
        response = self.patents_table.get_item(Key={'patent_id': patent_id})
        patent = response.get('Item')
        
        if not patent:
            raise ValueError(f"Patent with ID {patent_id} not found")
        
        return patent
    
    def update_patent_status(self, patent_id, status, metadata=None):
        """Update the status of a patent"""
        update_expression = "set #status = :status"
        expression_attribute_names = {'#status': 'status'}
        expression_attribute_values = {':status': status}
        
        if metadata:
            update_expression += ", metadata = :metadata"
            expression_attribute_values[':metadata'] = metadata
        
        self.patents_table.update_item(
            Key={'patent_id': patent_id},
            UpdateExpression=update_expression,
            ExpressionAttributeNames=expression_attribute_names,
            ExpressionAttributeValues=expression_attribute_values
        )
        
        logger.info(f"Patent {patent_id} status updated to {status}")
        
        return {'patent_id': patent_id, 'status': status}
    
    def get_user_patents(self, user_id):
        """Get all patents for a user"""
        response = self.patents_table.query(
            IndexName='user-id-index',
            KeyConditionExpression=boto3.dynamodb.conditions.Key('user_id').eq(user_id)
        )
        
        patents = response.get('Items', [])
        
        # Sort by submission date (newest first)
        patents.sort(key=lambda x: x.get('submission_date', ''), reverse=True)
        
        return patents
    
    def search_patents(self, query_params):
        """Search for patents based on various criteria"""
        # This is a simplified implementation
        # In a real application, you would use more sophisticated search techniques
        # such as DynamoDB Query with filter expressions or even ElasticSearch
        
        # For now, we'll just scan the table and filter in memory
        response = self.patents_table.scan()
        patents = response.get('Items', [])
        
        # Apply filters
        if 'technology_domain' in query_params:
            patents = [p for p in patents if p.get('technology_domain') == query_params['technology_domain']]
        
        if 'title_contains' in query_params:
            patents = [p for p in patents if query_params['title_contains'].lower() in p.get('title', '').lower()]
        
        if 'inventor_contains' in query_params:
            patents = [p for p in patents if any(query_params['inventor_contains'].lower() in inv.lower() for inv in p.get('inventors', []))]
        
        if 'date_from' in query_params:
            patents = [p for p in patents if p.get('submission_date', '') >= query_params['date_from']]
        
        if 'date_to' in query_params:
            patents = [p for p in patents if p.get('submission_date', '') <= query_params['date_to']]
        
        # Sort by submission date (newest first)
        patents.sort(key=lambda x: x.get('submission_date', ''), reverse=True)
        
        return patents
    
    def delete_patent(self, patent_id):
        """Delete a patent"""
        # Check if patent exists
        self.get_patent(patent_id)
        
        # Delete the patent
        self.patents_table.delete_item(Key={'patent_id': patent_id})
        
        logger.info(f"Patent {patent_id} deleted successfully")
        
        return {'message': f"Patent {patent_id} deleted successfully"}