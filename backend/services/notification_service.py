import boto3
import json
import logging
import os
from botocore.exceptions import ClientError
from jinja2 import Template, Environment, FileSystemLoader
from config import Config

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self):
        self.sns = boto3.client('sns', region_name=Config.AWS_REGION)
        self.topic_arn = Config.SNS_TOPIC_ARN
        
        # Create SNS topic if it doesn't exist
        if not self.topic_arn:
            self._create_sns_topic()
            
        # Initialize template environment
        self.template_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'templates')
        self.template_env = Environment(loader=FileSystemLoader(self.template_dir))
        
        # Load alert template
        self.alert_template = self._load_alert_template()
    
    def _create_sns_topic(self):
        """Create an SNS topic for notifications"""
        try:
            response = self.sns.create_topic(Name='PatentAnalyzer-Notifications')
            self.topic_arn = response['TopicArn']
            logger.info(f"Created SNS topic: {self.topic_arn}")
        except Exception as e:
            logger.error(f"Error creating SNS topic: {str(e)}")
            raise
    
    def send_notification(self, subject, message, recipient=None):
        """Send a notification via SNS with simple text message"""
        try:
            # If recipient is provided, publish to that specific endpoint
            if recipient and self._is_valid_email(recipient):
                # First check if the email is subscribed
                subscription_arn = self._get_subscription_arn(recipient)
                
                # If not subscribed, subscribe the email
                if not subscription_arn:
                    self._subscribe_email(recipient)
            
            # Publish the message to the topic
            response = self.sns.publish(
                TopicArn=self.topic_arn,
                Message=message,
                Subject=subject
            )
            
            logger.info(f"Notification sent: {subject}")
            return {'message_id': response['MessageId']}
            
        except Exception as e:
            logger.error(f"Error sending notification: {str(e)}")
            return {'error': str(e)}
            
    def send_notification_with_structure(self, message_structure, recipient=None):
        """Send a notification via SNS with structured message for different platforms"""
        try:
            # If recipient is provided, publish to that specific endpoint
            if recipient and self._is_valid_email(recipient):
                # First check if the email is subscribed
                subscription_arn = self._get_subscription_arn(recipient)
                
                # If not subscribed, subscribe the email
                if not subscription_arn:
                    self._subscribe_email(recipient)
            
            # Publish the message to the topic with message structure
            response = self.sns.publish(
                TopicArn=self.topic_arn,
                Message=json.dumps(message_structure),
                MessageStructure='json'
            )
            
            logger.info(f"Structured notification sent")
            return {'message_id': response['MessageId']}
            
        except Exception as e:
            logger.error(f"Error sending structured notification: {str(e)}")
            return {'error': str(e)}
    
    def _is_valid_email(self, email):
        """Check if the recipient is a valid email address"""
        # Simple validation - in a real app, use a more robust method
        return '@' in email and '.' in email.split('@')[1]
    
    def _get_subscription_arn(self, email):
        """Get the subscription ARN for an email address"""
        try:
            response = self.sns.list_subscriptions_by_topic(TopicArn=self.topic_arn)
            
            for subscription in response['Subscriptions']:
                if subscription['Protocol'] == 'email' and subscription['Endpoint'] == email:
                    return subscription['SubscriptionArn']
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting subscription ARN: {str(e)}")
            return None
    
    def _subscribe_email(self, email):
        """Subscribe an email address to the SNS topic"""
        try:
            response = self.sns.subscribe(
                TopicArn=self.topic_arn,
                Protocol='email',
                Endpoint=email
            )
            
            logger.info(f"Subscribed email {email} to topic {self.topic_arn}")
            return response['SubscriptionArn']
            
        except Exception as e:
            logger.error(f"Error subscribing email: {str(e)}")
            return None
    
    def _load_alert_template(self):
        """Load the SNS alert template from the JSON file"""
        try:
            template_path = os.path.join(self.template_dir, 'sns_alert_template.json')
            with open(template_path, 'r') as file:
                template_data = json.load(file)
                logger.info(f"Loaded alert template from {template_path}")
                return template_data
        except Exception as e:
            logger.error(f"Error loading alert template: {str(e)}")
            # Return a basic template as fallback
            return {
                "default": "PatentAnalyzer Alert",
                "email": {
                    "subject": "PatentAnalyzer Alert",
                    "body": {
                        "text": "Patent Alert for {{patent_id}}",
                        "html": "<html><body>Patent Alert for {{patent_id}}</body></html>"
                    }
                },
                "sms": "PatentAnalyzer Alert for {{patent_id}}"
            }
    
    def create_alert_template(self, template_name, template_content):
        """Create or update an alert template"""
        # In a real application, you might store templates in DynamoDB or S3
        # For this example, we'll just log the template creation
        logger.info(f"Created alert template: {template_name}")
        return {'template_name': template_name, 'status': 'created'}
    
    def send_alert_from_template(self, template_name, data, recipient=None):
        """Send an alert using a template"""
        try:
            # Prepare template data with defaults for missing values
            template_data = {
                'user_name': data.get('user_name', 'Patent Owner'),
                'patent_id': data.get('patent_id', 'N/A'),
                'patent_title': data.get('patent_title', data.get('title', 'N/A')),
                'risk_level': data.get('risk_level', 'Unknown'),
                'alert_type': data.get('alert_type', 'Analysis Complete'),
                'analysis_summary': data.get('analysis_summary', 'Patent analysis has been completed.'),
                'dashboard_url': data.get('dashboard_url', '#'),
                'timestamp': data.get('timestamp', ''),
            }
            
            # Add prior art matches if available
            if 'prior_art_matches' in data and data['prior_art_matches']:
                template_data['prior_art_matches'] = data['prior_art_matches']
            elif 'similar_patents' in data and data['similar_patents']:
                template_data['prior_art_matches'] = [{
                    'title': p.get('title', 'Unknown Patent'),
                    'patent_id': p.get('patent_id', 'N/A'),
                    'similarity_score': round(p.get('similarity', 0) * 100, 1),
                    'key_overlap': p.get('key_overlap', 'N/A')
                } for p in data['similar_patents']]
            
            # Add risk factors if available
            if 'infringement_risks' in data and data['infringement_risks']:
                template_data['infringement_risks'] = data['infringement_risks']
            elif 'risk_factors' in data and data['risk_factors']:
                template_data['infringement_risks'] = [{
                    'title': 'Potential Infringement Risk',
                    'patent_id': 'N/A',
                    'risk_score': 'High',
                    'critical_factors': factor
                } for factor in data['risk_factors']]
            
            # Render email subject
            subject_template = Template(self.alert_template['email']['subject'])
            subject = subject_template.render(template_data)
            
            # Determine message format based on recipient type
            # For this implementation, we'll use HTML for email and text for other channels
            html_template = Template(self.alert_template['email']['body']['html'])
            text_template = Template(self.alert_template['email']['body']['text'])
            sms_template = Template(self.alert_template['sms'])
            
            # Create message structure for SNS
            message_structure = {
                'default': self.alert_template['default'],
                'email': json.dumps({
                    'subject': subject,
                    'body': {
                        'text': text_template.render(template_data),
                        'html': html_template.render(template_data)
                    }
                }),
                'sms': sms_template.render(template_data)
            }
            
            # Send the notification with message structure
            return self.send_notification_with_structure(
                message_structure=message_structure,
                recipient=recipient
            )
            
        except Exception as e:
            logger.error(f"Error sending alert from template: {str(e)}")
            # Fallback to simple notification
            subject = f"Patent Alert: {data.get('title', 'Alert')}"
            message = f"""Patent Alert
            
            Patent ID: {data.get('patent_id', 'N/A')}
            Title: {data.get('title', 'N/A')}
            Risk Level: {data.get('risk_level', 'N/A')}
            
            Risk Factors:
            {self._format_list(data.get('risk_factors', []))}
            
            Similar Patents:
            {self._format_similar_patents(data.get('similar_patents', []))}
            
            Please review this patent in the PatentAnalyzer system.
            """
            
            return self.send_notification(subject, message, recipient)
    
    def _format_list(self, items):
        """Format a list as a string with bullet points"""
        if not items:
            return "None"
        
        return '\n'.join([f"- {item}" for item in items])
    
    def _format_similar_patents(self, patents):
        """Format similar patents as a string"""
        if not patents:
            return "None"
        
        lines = []
        for patent in patents:
            similarity_percent = f"{patent.get('similarity', 0) * 100:.1f}%"
            lines.append(f"- {patent.get('title', 'N/A')} (ID: {patent.get('patent_id', 'N/A')}, Similarity: {similarity_percent})")
        
        return '\n'.join(lines)