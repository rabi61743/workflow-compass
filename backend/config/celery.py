"""
Celery configuration for WMS project.

This module sets up Celery for asynchronous task processing,
including SLA monitoring, notifications, and email delivery.
"""
import os
from celery import Celery
from celery.schedules import crontab

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('wms')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

# Celery Beat schedule for periodic tasks
app.conf.beat_schedule = {
    # Check SLA breaches every hour
    'check-sla-every-hour': {
        'task': 'apps.workflow.tasks.check_sla_breaches',
        'schedule': crontab(minute=0),  # Every hour at minute 0
    },
    # Send SLA warning notifications every 30 minutes
    'check-sla-warnings': {
        'task': 'apps.workflow.tasks.check_sla_warnings',
        'schedule': crontab(minute='*/30'),  # Every 30 minutes
    },
    # Daily summary report at 8 AM
    'daily-summary-report': {
        'task': 'apps.workflow.tasks.send_daily_summary',
        'schedule': crontab(hour=8, minute=0),
    },
    # Clean old notifications weekly
    'cleanup-old-notifications': {
        'task': 'apps.notifications.tasks.cleanup_old_notifications',
        'schedule': crontab(day_of_week=0, hour=2, minute=0),  # Sunday at 2 AM
    },
}

app.conf.timezone = 'Asia/Kathmandu'


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Debug task for testing Celery setup."""
    print(f'Request: {self.request!r}')
