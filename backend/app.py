from flask import Flask, request, jsonify
from flask_cors import CORS
import boto3
import json
import uuid
import os
import logging
from datetime import datetime
from werkzeug.utils import secure_filename
from config import Config
from services.auth_service import AuthService
from services.patent_service import PatentService
from services.analysis_service import AnalysisService
from services.notification_service import NotificationService
from services.system_logs_service import SystemLogsService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)

# Enable CORS
CORS(app, resources={r"/*": {"origins": app.config['ALLOWED_ORIGINS']}})

# Initialize services
auth_service = AuthService()
patent_service = PatentService()
analysis_service = AnalysisService()
notification_service = NotificationService()
system_logs_service = SystemLogsService()

# Create upload folder if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    })

# Authentication endpoints
@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.json
        result = auth_service.register_user(
            data.get('email'),
            data.get('password'),
            data.get('name'),
            data.get('role', 'inventor')
        )
        return jsonify(result)
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return jsonify({'error': str(e)}), 400

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.json
        result = auth_service.login_user(
            data.get('email'),
            data.get('password')
        )
        return jsonify(result)
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({'error': str(e)}), 401

# Patent submission endpoint
@app.route('/api/patents/submit', methods=['POST'])
def submit_patent():
    try:
        # Check if the post request has the file part
        if 'file' in request.files:
            file = request.files['file']
            if file.filename == '':
                return jsonify({'error': 'No selected file'}), 400
            
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(file_path)
                
                # Get form data
                patent_data = json.loads(request.form.get('data'))
                patent_data['file_path'] = file_path
                
                # Process the patent submission
                result = patent_service.submit_patent(patent_data)
                
                # Trigger analysis
                analysis_job = analysis_service.start_analysis(result['patent_id'])
                
                return jsonify({
                    'success': True,
                    'patent_id': result['patent_id'],
                    'analysis_job_id': analysis_job['job_id'],
                    'message': 'Patent submitted successfully and analysis started'
                })
            else:
                return jsonify({'error': 'File type not allowed'}), 400
        else:
            # Handle text submission
            patent_data = request.json
            result = patent_service.submit_patent(patent_data)
            
            # Trigger analysis
            analysis_job = analysis_service.start_analysis(result['patent_id'])
            
            return jsonify({
                'success': True,
                'patent_id': result['patent_id'],
                'analysis_job_id': analysis_job['job_id'],
                'message': 'Patent submitted successfully and analysis started'
            })
    except Exception as e:
        logger.error(f"Patent submission error: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Get patent details
@app.route('/api/patents/<patent_id>', methods=['GET'])
def get_patent(patent_id):
    try:
        result = patent_service.get_patent(patent_id)
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error retrieving patent {patent_id}: {str(e)}")
        return jsonify({'error': str(e)}), 404

# Get user's patents
@app.route('/api/patents/user/<user_id>', methods=['GET'])
def get_user_patents(user_id):
    try:
        result = patent_service.get_user_patents(user_id)
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error retrieving patents for user {user_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Get analysis results
@app.route('/api/analysis/<patent_id>', methods=['GET'])
def get_analysis(patent_id):
    try:
        result = analysis_service.get_analysis_results(patent_id)
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error retrieving analysis for patent {patent_id}: {str(e)}")
        return jsonify({'error': str(e)}), 404

# Get analysis status
@app.route('/api/analysis/status/<job_id>', methods=['GET'])
def get_analysis_status(job_id):
    try:
        result = analysis_service.get_analysis_status(job_id)
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error retrieving analysis status for job {job_id}: {str(e)}")
        return jsonify({'error': str(e)}), 404

# Admin endpoints
@app.route('/api/admin/users', methods=['GET'])
def get_users():
    try:
        # Check admin authorization here
        result = auth_service.get_all_users()
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error retrieving users: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/system-health', methods=['GET'])
def get_system_health():
    try:
        # Check admin authorization here
        # This would be implemented to get actual system metrics
        # For now, return mock data
        return jsonify({
            'cpu': 35,
            'memory': 42,
            'storage': 28,
            'apiLatency': 120,
            'dbConnections': 8,
            'activeUsers': 12,
            'uptime': '5d 7h 22m',
            'lastRestart': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error retrieving system health: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/domain-keywords', methods=['GET'])
def get_domain_keywords():
    try:
        # Check admin authorization here
        result = analysis_service.get_domain_keywords()
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error retrieving domain keywords: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/domain-keywords', methods=['POST'])
def update_domain_keywords():
    try:
        # Check admin authorization here
        data = request.json
        result = analysis_service.update_domain_keywords(data)
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error updating domain keywords: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/system-logs', methods=['GET'])
def get_system_logs():
    try:
        # Check admin authorization here
        filters = {}
        
        # Get query parameters for filtering
        if request.args.get('level'):
            filters['level'] = request.args.get('level')
        if request.args.get('service'):
            filters['service'] = request.args.get('service')
        if request.args.get('start_date'):
            filters['start_date'] = request.args.get('start_date')
        if request.args.get('end_date'):
            filters['end_date'] = request.args.get('end_date')
        
        # Get limit parameter
        limit = int(request.args.get('limit', 100))
        
        logs = system_logs_service.get_logs(filters, limit)
        return jsonify(logs)
    except Exception as e:
        logger.error(f"Error retrieving system logs: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/system-logs', methods=['POST'])
def add_system_log():
    try:
        # Check admin authorization here
        data = request.json
        
        if not data or not data.get('message') or not data.get('level') or not data.get('service'):
            return jsonify({'error': 'Missing required fields: message, level, service'}), 400
        
        log_id = system_logs_service.log_event(
            data.get('level'),
            data.get('message'),
            data.get('service'),
            data.get('additional_data')
        )
        
        return jsonify({'log_id': log_id})
    except Exception as e:
        logger.error(f"Error adding system log: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/system-logs/clear', methods=['POST'])
def clear_system_logs():
    try:
        # Check admin authorization here
        data = request.json
        older_than = data.get('older_than') if data else None
        
        count = system_logs_service.clear_logs(older_than)
        return jsonify({'deleted_count': count})
    except Exception as e:
        logger.error(f"Error clearing system logs: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Helper functions
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=app.config['DEBUG'])