# Notification Templates

## Overview

This directory contains templates used by the PatentAnalyzer notification system. The templates are used to format notifications sent via Amazon SNS to users about patent analysis results.

## Template Structure

The notification templates are stored in JSON format and support multiple delivery channels:

- **Default**: A simple text message used as a fallback
- **Email**: Contains both text and HTML versions of the email
- **SMS**: A short message format for SMS notifications

## Template Variables

The templates use Jinja2 syntax for variable substitution. The following variables are available:

| Variable | Description |
|----------|-------------|
| `user_name` | The name of the user receiving the notification |
| `patent_id` | The ID of the patent being analyzed |
| `patent_title` | The title of the patent |
| `risk_level` | The risk level determined by analysis (High, Medium, Low) |
| `alert_type` | The type of alert being sent |
| `analysis_summary` | A summary of the analysis results |
| `dashboard_url` | URL to view the full analysis in the dashboard |
| `timestamp` | The time the notification was generated |

### Conditional Sections

The templates also support conditional sections for:

- `prior_art_matches`: List of similar patents found during analysis
- `infringement_risks`: List of potential infringement risks identified

## Usage

The templates are loaded and rendered by the `NotificationService` class in `services/notification_service.py`. The service uses Jinja2 for template rendering and sends the formatted messages via Amazon SNS.

## Example

To send a notification using a template:

```python
from services.notification_service import NotificationService

# Initialize the notification service
notification_service = NotificationService()

# Prepare the data for the template
data = {
    'patent_id': 'PAT12345',
    'title': 'Example Patent',
    'user_name': 'John Doe',
    'risk_level': 'High',
    # ... other data
}

# Send the notification using the template
notification_service.send_alert_from_template(
    template_name='high_risk_alert',
    data=data,
    recipient='user@example.com'
)
```

## Testing

You can test the template rendering using the test script:

```bash
python scripts/test_notification_template.py
```

This will render the templates with sample data without actually sending notifications.