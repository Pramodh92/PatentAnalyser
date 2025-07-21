import sys
import os
import json
from datetime import datetime
import unittest.mock as mock

# Add the parent directory to the path so we can import from the services package
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Mock boto3 before importing NotificationService
sys.modules['boto3'] = mock.MagicMock()
sys.modules['boto3.session'] = mock.MagicMock()

from services.notification_service import NotificationService

def test_notification_template():
    # Initialize the notification service with mocked AWS services
    with mock.patch('services.notification_service.boto3'):
        notification_service = NotificationService()
        
        # Mock the SNS client and topic creation
        notification_service.sns_client = mock.MagicMock()
        notification_service.topic_arn = 'mock-topic-arn'
    
        # Create test data
        test_data = {
            'patent_id': 'PAT12345',
            'patent_title': 'Test Patent for Notification Template',
            'user_name': 'Test User',
            'risk_level': 'High',
            'alert_type': 'Test Alert',
            'analysis_summary': 'This is a test analysis summary for the notification template.',
            'risk_factors': [
                'Similar to existing patents',
                'Potential infringement issues',
                'Overlapping claims'
            ],
            'prior_art_matches': [
                {
                    'patent_id': 'PAT98765',
                    'title': 'Similar Test Patent 1',
                    'similarity_score': 85,
                    'key_overlap': 'Claims 1-3 overlap'
                },
                {
                    'patent_id': 'PAT54321',
                    'title': 'Similar Test Patent 2',
                    'similarity_score': 78,
                    'key_overlap': 'Similar technology domain'
                }
            ],
            'dashboard_url': 'http://localhost:3000/dashboard?patent=PAT12345',
            'timestamp': datetime.utcnow().isoformat()
        }
        
        # Test the template rendering
        print("Testing notification template rendering...")
        try:
            # Render the templates without sending
            template_data = notification_service.send_alert_from_template(
                template_name='high_risk_alert',
                data=test_data,
                recipient=None  # Don't actually send the notification
            )
            
            print("\nTemplate rendering successful!")
            print(f"Message ID: {template_data.get('message_id', 'N/A')}")
            print(f"Error: {template_data.get('error', 'None')}")
            
        except Exception as e:
            print(f"\nError testing template: {str(e)}")

if __name__ == "__main__":
    test_notification_template()