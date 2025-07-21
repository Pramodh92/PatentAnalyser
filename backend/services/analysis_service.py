import boto3
import uuid
import logging
import json
import os
import re
from datetime import datetime
from botocore.exceptions import ClientError
from config import Config
from services.notification_service import NotificationService

logger = logging.getLogger(__name__)

class AnalysisService:
    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb', region_name=Config.AWS_REGION)
        self.comprehend = boto3.client('comprehend', region_name=Config.AWS_REGION)
        self.s3 = boto3.client('s3', region_name=Config.AWS_REGION)
        self.analysis_table = self.dynamodb.Table(Config.DYNAMODB_ANALYSIS_TABLE)
        self.patents_table = self.dynamodb.Table(Config.DYNAMODB_PATENTS_TABLE)
        self.domain_keywords_table = self.dynamodb.Table(Config.DYNAMODB_DOMAIN_KEYWORDS_TABLE)
        self.notification_service = NotificationService()
        self.similarity_threshold = Config.SIMILARITY_THRESHOLD
        
        # Ensure the tables exist
        self._create_analysis_table_if_not_exists()
        self._create_domain_keywords_table_if_not_exists()
        
        # Initialize domain keywords if empty
        self._initialize_domain_keywords()
    
    def _create_analysis_table_if_not_exists(self):
        """Create the analysis table if it doesn't exist"""
        try:
            # Check if table exists
            self.dynamodb.meta.client.describe_table(TableName=Config.DYNAMODB_ANALYSIS_TABLE)
            logger.info(f"Table {Config.DYNAMODB_ANALYSIS_TABLE} already exists")
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                # Create the table
                table = self.dynamodb.create_table(
                    TableName=Config.DYNAMODB_ANALYSIS_TABLE,
                    KeySchema=[
                        {'AttributeName': 'analysis_id', 'KeyType': 'HASH'}
                    ],
                    AttributeDefinitions=[
                        {'AttributeName': 'analysis_id', 'AttributeType': 'S'},
                        {'AttributeName': 'patent_id', 'AttributeType': 'S'}
                    ],
                    GlobalSecondaryIndexes=[
                        {
                            'IndexName': 'patent-id-index',
                            'KeySchema': [
                                {'AttributeName': 'patent_id', 'KeyType': 'HASH'}
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
                table.meta.client.get_waiter('table_exists').wait(TableName=Config.DYNAMODB_ANALYSIS_TABLE)
                logger.info(f"Created table {Config.DYNAMODB_ANALYSIS_TABLE}")
            else:
                logger.error(f"Error checking/creating table: {e}")
                raise
    
    def _create_domain_keywords_table_if_not_exists(self):
        """Create the domain keywords table if it doesn't exist"""
        try:
            # Check if table exists
            self.dynamodb.meta.client.describe_table(TableName=Config.DYNAMODB_DOMAIN_KEYWORDS_TABLE)
            logger.info(f"Table {Config.DYNAMODB_DOMAIN_KEYWORDS_TABLE} already exists")
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                # Create the table
                table = self.dynamodb.create_table(
                    TableName=Config.DYNAMODB_DOMAIN_KEYWORDS_TABLE,
                    KeySchema=[
                        {'AttributeName': 'domain_id', 'KeyType': 'HASH'}
                    ],
                    AttributeDefinitions=[
                        {'AttributeName': 'domain_id', 'AttributeType': 'S'}
                    ],
                    ProvisionedThroughput={
                        'ReadCapacityUnits': 5,
                        'WriteCapacityUnits': 5
                    }
                )
                # Wait for the table to be created
                table.meta.client.get_waiter('table_exists').wait(TableName=Config.DYNAMODB_DOMAIN_KEYWORDS_TABLE)
                logger.info(f"Created table {Config.DYNAMODB_DOMAIN_KEYWORDS_TABLE}")
            else:
                logger.error(f"Error checking/creating table: {e}")
                raise
    
    def _initialize_domain_keywords(self):
        """Initialize domain keywords if the table is empty"""
        response = self.domain_keywords_table.scan(Limit=1)
        if not response.get('Items'):
            # Table is empty, initialize with default domains
            default_domains = [
                {
                    'domain_id': 'ai',
                    'domain': 'AI',
                    'keywords': ['machine learning', 'neural network', 'deep learning', 'natural language processing', 'computer vision']
                },
                {
                    'domain_id': 'biotech',
                    'domain': 'Biotech',
                    'keywords': ['genome', 'protein', 'enzyme', 'cell culture', 'antibody', 'therapeutic']
                },
                {
                    'domain_id': 'electronics',
                    'domain': 'Electronics',
                    'keywords': ['circuit', 'semiconductor', 'transistor', 'microprocessor', 'sensor']
                }
            ]
            
            for domain in default_domains:
                self.domain_keywords_table.put_item(Item=domain)
            
            logger.info("Initialized domain keywords with default values")
    
    def start_analysis(self, patent_id):
        """Start the analysis process for a patent"""
        try:
            # Get the patent
            response = self.patents_table.get_item(Key={'patent_id': patent_id})
            patent = response.get('Item')
            
            if not patent:
                raise ValueError(f"Patent with ID {patent_id} not found")
            
            # Generate a unique ID for the analysis job
            analysis_id = str(uuid.uuid4())
            job_id = f"job-{analysis_id}"
            
            # Create an analysis record
            analysis_item = {
                'analysis_id': analysis_id,
                'patent_id': patent_id,
                'job_id': job_id,
                'status': 'in_progress',
                'start_time': datetime.utcnow().isoformat(),
                'end_time': None,
                'results': None,
                'error': None
            }
            
            # Save to DynamoDB
            self.analysis_table.put_item(Item=analysis_item)
            
            # Update patent status
            self.patents_table.update_item(
                Key={'patent_id': patent_id},
                UpdateExpression="set #status = :status",
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={':status': 'analyzing'}
            )
            
            # In a real application, you would start an asynchronous job here
            # For this example, we'll perform the analysis synchronously
            self._perform_analysis(patent, analysis_id, job_id)
            
            return {
                'analysis_id': analysis_id,
                'job_id': job_id,
                'status': 'in_progress'
            }
            
        except Exception as e:
            logger.error(f"Error starting analysis for patent {patent_id}: {str(e)}")
            raise
    
    def _perform_analysis(self, patent, analysis_id, job_id):
        """Perform the analysis on the patent"""
        try:
            # Extract text from the patent
            text = self._extract_text(patent)
            
            # Get domain keywords
            domain_keywords = self._get_domain_keywords(patent.get('technology_domain'))
            
            # Use Amazon Comprehend for NLP analysis
            entities = self._extract_entities(text)
            key_phrases = self._extract_key_phrases(text)
            sentiment = self._analyze_sentiment(text)
            syntax = self._analyze_syntax(text)
            
            # Perform similarity check with existing patents
            similar_patents = self._find_similar_patents(patent, key_phrases, entities)
            
            # Calculate risk levels
            risk_assessment = self._assess_risk(similar_patents)
            
            # Prepare results
            results = {
                'entities': entities,
                'key_phrases': key_phrases,
                'sentiment': sentiment,
                'syntax': syntax,
                'domain_keywords': domain_keywords,
                'similar_patents': similar_patents,
                'risk_assessment': risk_assessment
            }
            
            # Update the analysis record
            self.analysis_table.update_item(
                Key={'analysis_id': analysis_id},
                UpdateExpression="set #status = :status, results = :results, end_time = :end_time",
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={
                    ':status': 'completed',
                    ':results': results,
                    ':end_time': datetime.utcnow().isoformat()
                }
            )
            
            # Update patent status
            self.patents_table.update_item(
                Key={'patent_id': patent['patent_id']},
                UpdateExpression="set #status = :status",
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={':status': 'analyzed'}
            )
            
            # Send notifications if high risk
            if risk_assessment['overall_risk'] == 'high':
                self._send_high_risk_notification(patent, risk_assessment, similar_patents)
            
            logger.info(f"Analysis completed for patent {patent['patent_id']}")
            
        except Exception as e:
            logger.error(f"Error performing analysis: {str(e)}")
            
            # Update the analysis record with the error
            self.analysis_table.update_item(
                Key={'analysis_id': analysis_id},
                UpdateExpression="set #status = :status, error = :error, end_time = :end_time",
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={
                    ':status': 'failed',
                    ':error': str(e),
                    ':end_time': datetime.utcnow().isoformat()
                }
            )
            
            # Update patent status
            self.patents_table.update_item(
                Key={'patent_id': patent['patent_id']},
                UpdateExpression="set #status = :status",
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={':status': 'analysis_failed'}
            )
    
    def _extract_text(self, patent):
        """Extract text from the patent for analysis"""
        text_parts = []
        
        # Add title
        if patent.get('title'):
            text_parts.append(patent['title'])
        
        # Add abstract
        if patent.get('abstract'):
            text_parts.append(patent['abstract'])
        
        # Add claims
        if patent.get('claims'):
            text_parts.append(patent['claims'])
        
        # Add description
        if patent.get('description'):
            text_parts.append(patent['description'])
        
        # If there's a file path, we would extract text from the file
        # This would require additional processing based on file type
        # For this example, we'll just use the text fields
        
        return ' '.join(text_parts)
    
    def _get_domain_keywords(self, domain):
        """Get keywords for a specific domain"""
        # Scan the domain keywords table
        response = self.domain_keywords_table.scan()
        domains = response.get('Items', [])
        
        # Find the matching domain
        for d in domains:
            if d.get('domain', '').lower() == domain.lower():
                return d.get('keywords', [])
        
        # If no match, return empty list
        return []
    
    def _extract_entities(self, text):
        """Extract entities from text using Amazon Comprehend"""
        # Limit text length to Comprehend's maximum (5000 bytes)
        text = text[:5000]
        
        try:
            response = self.comprehend.detect_entities(
                Text=text,
                LanguageCode='en'
            )
            
            # Filter entities by confidence threshold
            entities = [e for e in response.get('Entities', []) 
                       if e.get('Score', 0) >= Config.COMPREHEND_MIN_CONFIDENCE]
            
            # Group entities by type
            grouped_entities = {}
            for entity in entities:
                entity_type = entity.get('Type')
                if entity_type not in grouped_entities:
                    grouped_entities[entity_type] = []
                
                grouped_entities[entity_type].append({
                    'text': entity.get('Text'),
                    'score': entity.get('Score')
                })
            
            return grouped_entities
            
        except Exception as e:
            logger.error(f"Error extracting entities: {str(e)}")
            return {}
    
    def _extract_key_phrases(self, text):
        """Extract key phrases from text using Amazon Comprehend"""
        # Limit text length to Comprehend's maximum (5000 bytes)
        text = text[:5000]
        
        try:
            response = self.comprehend.detect_key_phrases(
                Text=text,
                LanguageCode='en'
            )
            
            # Filter key phrases by confidence threshold
            key_phrases = [{
                'text': kp.get('Text'),
                'score': kp.get('Score')
            } for kp in response.get('KeyPhrases', []) 
              if kp.get('Score', 0) >= Config.COMPREHEND_MIN_CONFIDENCE]
            
            # Sort by score (highest first)
            key_phrases.sort(key=lambda x: x.get('score', 0), reverse=True)
            
            return key_phrases
            
        except Exception as e:
            logger.error(f"Error extracting key phrases: {str(e)}")
            return []
    
    def _analyze_sentiment(self, text):
        """Analyze sentiment of text using Amazon Comprehend"""
        # Limit text length to Comprehend's maximum (5000 bytes)
        text = text[:5000]
        
        try:
            response = self.comprehend.detect_sentiment(
                Text=text,
                LanguageCode='en'
            )
            
            return {
                'sentiment': response.get('Sentiment'),
                'scores': response.get('SentimentScore')
            }
            
        except Exception as e:
            logger.error(f"Error analyzing sentiment: {str(e)}")
            return {'sentiment': 'NEUTRAL', 'scores': {}}
    
    def _analyze_syntax(self, text):
        """Analyze syntax of text using Amazon Comprehend"""
        # Limit text length to Comprehend's maximum (5000 bytes)
        text = text[:5000]
        
        try:
            response = self.comprehend.detect_syntax(
                Text=text,
                LanguageCode='en'
            )
            
            # Group tokens by part of speech
            pos_groups = {}
            for token in response.get('SyntaxTokens', []):
                pos = token.get('PartOfSpeech', {}).get('Tag')
                if pos not in pos_groups:
                    pos_groups[pos] = []
                
                pos_groups[pos].append({
                    'text': token.get('Text'),
                    'score': token.get('PartOfSpeech', {}).get('Score')
                })
            
            return pos_groups
            
        except Exception as e:
            logger.error(f"Error analyzing syntax: {str(e)}")
            return {}
    
    def _find_similar_patents(self, patent, key_phrases, entities):
        """Find patents similar to the given patent"""
        # In a real application, this would use more sophisticated similarity algorithms
        # For this example, we'll use a simple keyword matching approach
        
        # Extract keywords from the patent
        keywords = [kp['text'].lower() for kp in key_phrases[:20]]  # Top 20 key phrases
        
        # Add technical entities
        if 'TECHNICAL' in entities:
            keywords.extend([e['text'].lower() for e in entities['TECHNICAL']])
        
        # Scan the patents table
        response = self.patents_table.scan()
        all_patents = response.get('Items', [])
        
        # Filter out the current patent
        other_patents = [p for p in all_patents if p.get('patent_id') != patent.get('patent_id')]
        
        similar_patents = []
        
        for other_patent in other_patents:
            # Extract text from the other patent
            other_text = self._extract_text(other_patent).lower()
            
            # Count keyword matches
            match_count = sum(1 for kw in keywords if kw in other_text)
            
            # Calculate similarity score (simple version)
            similarity = match_count / len(keywords) if keywords else 0
            
            if similarity >= self.similarity_threshold * 0.5:  # Lower threshold for finding all potential matches
                similar_patents.append({
                    'patent_id': other_patent.get('patent_id'),
                    'title': other_patent.get('title'),
                    'similarity': similarity,
                    'submission_date': other_patent.get('submission_date'),
                    'matching_keywords': [kw for kw in keywords if kw in other_text]
                })
        
        # Sort by similarity (highest first)
        similar_patents.sort(key=lambda x: x.get('similarity', 0), reverse=True)
        
        return similar_patents
    
    def _assess_risk(self, similar_patents):
        """Assess the risk level based on similar patents"""
        # Count patents above the similarity threshold
        high_similarity_count = sum(1 for p in similar_patents if p.get('similarity', 0) >= self.similarity_threshold)
        
        # Determine risk levels
        if high_similarity_count > 2:
            overall_risk = 'high'
            risk_factors = ['Multiple highly similar patents found', 'High potential for infringement']
        elif high_similarity_count > 0:
            overall_risk = 'medium'
            risk_factors = ['One or more similar patents found', 'Moderate potential for infringement']
        else:
            overall_risk = 'low'
            risk_factors = ['No highly similar patents found']
        
        # Calculate average similarity of top matches
        top_similarities = [p.get('similarity', 0) for p in similar_patents[:3]]
        avg_similarity = sum(top_similarities) / len(top_similarities) if top_similarities else 0
        
        return {
            'overall_risk': overall_risk,
            'risk_factors': risk_factors,
            'high_similarity_count': high_similarity_count,
            'average_similarity': avg_similarity
        }
    
    def _send_high_risk_notification(self, patent, risk_assessment, similar_patents):
        """Send notification for high-risk patents"""
        # Prepare the message data
        message_data = {
            'patent_id': patent.get('patent_id'),
            'title': patent.get('title'),
            'user_name': patent.get('user_name', 'Patent Owner'),
            'risk_level': risk_assessment.get('overall_risk'),
            'alert_type': 'High Risk Patent Alert',
            'risk_factors': risk_assessment.get('risk_factors'),
            'analysis_summary': f"Your patent has been analyzed and found to have a {risk_assessment.get('overall_risk')} risk level. "
                               f"We identified {len(risk_assessment.get('risk_factors', []))} risk factors and "
                               f"{risk_assessment.get('high_similarity_count', 0)} similar patents with high similarity.",
            'similar_patents': [
                {
                    'patent_id': p.get('patent_id'),
                    'title': p.get('title'),
                    'similarity': p.get('similarity'),
                    'key_overlap': p.get('key_overlap', 'Similar technology domain')
                } for p in similar_patents[:3]  # Top 3 similar patents
            ],
            'dashboard_url': f"{Config.FRONTEND_URL}/dashboard?patent={patent.get('patent_id')}",
            'timestamp': datetime.utcnow().isoformat()
        }
        
        # Send the notification using the template
        self.notification_service.send_alert_from_template(
            template_name='high_risk_alert',
            data=message_data,
            recipient=patent.get('user_id')
        )
    
    def get_analysis_results(self, patent_id):
        """Get the analysis results for a patent"""
        # Query the analysis table by patent ID
        response = self.analysis_table.query(
            IndexName='patent-id-index',
            KeyConditionExpression=boto3.dynamodb.conditions.Key('patent_id').eq(patent_id)
        )
        
        analyses = response.get('Items', [])
        
        if not analyses:
            raise ValueError(f"No analysis found for patent {patent_id}")
        
        # Sort by start time (newest first)
        analyses.sort(key=lambda x: x.get('start_time', ''), reverse=True)
        
        # Return the most recent analysis
        return analyses[0]
    
    def get_analysis_status(self, job_id):
        """Get the status of an analysis job"""
        # Scan the analysis table for the job ID
        response = self.analysis_table.scan(
            FilterExpression=boto3.dynamodb.conditions.Attr('job_id').eq(job_id)
        )
        
        analyses = response.get('Items', [])
        
        if not analyses:
            raise ValueError(f"No analysis job found with ID {job_id}")
        
        analysis = analyses[0]
        
        return {
            'job_id': job_id,
            'status': analysis.get('status'),
            'start_time': analysis.get('start_time'),
            'end_time': analysis.get('end_time'),
            'error': analysis.get('error')
        }
    
    def get_domain_keywords(self):
        """Get all domain keywords"""
        response = self.domain_keywords_table.scan()
        return response.get('Items', [])
    
    def update_domain_keywords(self, domain_data):
        """Update domain keywords"""
        # Validate required fields
        if 'domain_id' not in domain_data:
            raise ValueError("Missing required field: domain_id")
        
        if 'domain' not in domain_data:
            raise ValueError("Missing required field: domain")
        
        if 'keywords' not in domain_data or not isinstance(domain_data['keywords'], list):
            raise ValueError("Missing or invalid field: keywords (must be a list)")
        
        # Check if domain exists
        response = self.domain_keywords_table.get_item(Key={'domain_id': domain_data['domain_id']})
        exists = 'Item' in response
        
        # Update or create the domain
        self.domain_keywords_table.put_item(Item=domain_data)
        
        return {
            'domain_id': domain_data['domain_id'],
            'action': 'updated' if exists else 'created'
        }
    
    def delete_domain_keywords(self, domain_id):
        """Delete a domain"""
        # Check if domain exists
        response = self.domain_keywords_table.get_item(Key={'domain_id': domain_id})
        if 'Item' not in response:
            raise ValueError(f"Domain with ID {domain_id} not found")
        
        # Delete the domain
        self.domain_keywords_table.delete_item(Key={'domain_id': domain_id})
        
        return {'message': f"Domain {domain_id} deleted successfully"}