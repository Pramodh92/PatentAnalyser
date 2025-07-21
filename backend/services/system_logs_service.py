import boto3
import uuid
import logging
from datetime import datetime
from botocore.exceptions import ClientError
from config import Config

# Configure logging
logger = logging.getLogger(__name__)

class SystemLogsService:
    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb', region_name=Config.AWS_REGION)
        self.logs_table = self.dynamodb.Table(Config.DYNAMODB_SYSTEM_LOGS_TABLE)
        
        # Ensure the table exists
        self._create_logs_table_if_not_exists()
    
    def _create_logs_table_if_not_exists(self):
        """Create the system logs table if it doesn't exist"""
        try:
            # Check if table exists
            self.dynamodb.meta.client.describe_table(TableName=Config.DYNAMODB_SYSTEM_LOGS_TABLE)
            logger.info(f"Table {Config.DYNAMODB_SYSTEM_LOGS_TABLE} already exists")
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                # Table will be created by setup_dynamodb.py script
                logger.warning(f"Table {Config.DYNAMODB_SYSTEM_LOGS_TABLE} does not exist. Run setup_dynamodb.py to create it.")
            else:
                logger.error(f"Error checking table existence: {str(e)}")
                raise
    
    def log_event(self, level, message, service, additional_data=None):
        """Log an event to the system logs table"""
        try:
            timestamp = datetime.now().isoformat()
            log_id = str(uuid.uuid4())
            
            log_item = {
                'log_id': log_id,
                'timestamp': timestamp,
                'log_level': level.upper(),
                'message': message,
                'service': service
            }
            
            # Add any additional data if provided
            if additional_data and isinstance(additional_data, dict):
                log_item['additional_data'] = additional_data
            
            self.logs_table.put_item(Item=log_item)
            return log_id
        except Exception as e:
            logger.error(f"Error logging event: {str(e)}")
            # Don't raise the exception to prevent disrupting the main application flow
            return None
    
    def get_logs(self, filters=None, limit=100):
        """Get system logs with optional filtering"""
        try:
            scan_kwargs = {
                'Limit': limit
            }
            
            # Apply filters if provided
            filter_expressions = []
            expression_attribute_values = {}
            expression_attribute_names = {}
            
            if filters:
                if 'level' in filters:
                    filter_expressions.append('#level = :level')
                    expression_attribute_names['#level'] = 'log_level'
                    expression_attribute_values[':level'] = filters['level'].upper()
                
                if 'service' in filters:
                    filter_expressions.append('#service = :service')
                    expression_attribute_names['#service'] = 'service'
                    expression_attribute_values[':service'] = filters['service']
                
                if 'start_date' in filters:
                    filter_expressions.append('#timestamp >= :start_date')
                    expression_attribute_names['#timestamp'] = 'timestamp'
                    expression_attribute_values[':start_date'] = filters['start_date']
                
                if 'end_date' in filters:
                    filter_expressions.append('#timestamp <= :end_date')
                    expression_attribute_names['#timestamp'] = 'timestamp'
                    expression_attribute_values[':end_date'] = filters['end_date']
            
            if filter_expressions:
                scan_kwargs['FilterExpression'] = ' AND '.join(filter_expressions)
                scan_kwargs['ExpressionAttributeValues'] = expression_attribute_values
                scan_kwargs['ExpressionAttributeNames'] = expression_attribute_names
            
            response = self.logs_table.scan(**scan_kwargs)
            logs = response.get('Items', [])
            
            # Sort logs by timestamp (newest first)
            logs.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
            
            return logs
        except Exception as e:
            logger.error(f"Error retrieving logs: {str(e)}")
            raise
    
    def clear_logs(self, older_than=None):
        """Clear logs, optionally only those older than a specified date"""
        try:
            if older_than:
                # Scan for logs older than the specified date
                scan_kwargs = {
                    'FilterExpression': '#timestamp < :older_than',
                    'ExpressionAttributeNames': {'#timestamp': 'timestamp'},
                    'ExpressionAttributeValues': {':older_than': older_than}
                }
                
                response = self.logs_table.scan(**scan_kwargs)
                logs_to_delete = response.get('Items', [])
                
                # Delete each log item
                with self.logs_table.batch_writer() as batch:
                    for log in logs_to_delete:
                        batch.delete_item(Key={'log_id': log['log_id']})
                
                return len(logs_to_delete)
            else:
                # This is a dangerous operation that deletes all logs
                # In a production environment, this should require additional confirmation
                # or be restricted to specific roles
                
                # Scan all logs
                response = self.logs_table.scan()
                logs_to_delete = response.get('Items', [])
                
                # Delete each log item
                with self.logs_table.batch_writer() as batch:
                    for log in logs_to_delete:
                        batch.delete_item(Key={'log_id': log['log_id']})
                
                return len(logs_to_delete)
        except Exception as e:
            logger.error(f"Error clearing logs: {str(e)}")
            raise