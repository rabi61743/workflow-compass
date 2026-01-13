"""
Celery tasks for workflow management.

Includes SLA monitoring, deadline alerts, and workflow automation.
"""
from celery import shared_task
from django.utils import timezone
from django.conf import settings
from django.db.models import Q
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def check_sla_breaches(self):
    """
    Check for SLA breaches and create notifications.
    
    Runs every hour to detect documents that have exceeded their SLA deadline.
    """
    from apps.darta.models import DartaLetter
    from apps.chalani.models import ChalaniLetter
    from apps.notifications.models import Notification
    
    now = timezone.now()
    breached_count = 0
    
    # Check Darta letters
    overdue_darta = DartaLetter.objects.filter(
        sla_deadline__lt=now,
        status__in=['pending', 'in_review'],
        is_sla_breached=False
    )
    
    for darta in overdue_darta:
        darta.is_sla_breached = True
        darta.save(update_fields=['is_sla_breached'])
        
        # Create notification for current handler
        if darta.current_handler:
            Notification.objects.create(
                user=darta.current_handler,
                type='sla_breach',
                title=f'SLA Breach: {darta.darta_number}',
                message=f'Letter "{darta.subject}" has exceeded the SLA deadline.',
                link_to=f'/darta/{darta.id}'
            )
        
        breached_count += 1
        logger.warning(f"SLA breach detected for Darta {darta.darta_number}")
    
    # Check Chalani letters (pending approval)
    overdue_chalani = ChalaniLetter.objects.filter(
        sla_deadline__lt=now,
        status='pending',
        is_sla_breached=False
    )
    
    for chalani in overdue_chalani:
        chalani.is_sla_breached = True
        chalani.save(update_fields=['is_sla_breached'])
        
        # Notify creator
        if chalani.created_by:
            Notification.objects.create(
                user=chalani.created_by,
                type='sla_breach',
                title=f'SLA Breach: {chalani.chalani_number or "Draft"}',
                message=f'Letter "{chalani.subject}" approval has exceeded the SLA deadline.',
                link_to=f'/chalani/{chalani.id}'
            )
        
        breached_count += 1
        logger.warning(f"SLA breach detected for Chalani {chalani.id}")
    
    logger.info(f"SLA breach check completed. Found {breached_count} breaches.")
    return {'breaches_found': breached_count}


@shared_task(bind=True, max_retries=3)
def check_sla_warnings(self):
    """
    Send warnings for documents approaching SLA deadline.
    
    Sends notifications when documents are within warning threshold (4 hours).
    """
    from apps.darta.models import DartaLetter
    from apps.notifications.models import Notification
    
    now = timezone.now()
    warning_threshold = now + timedelta(hours=4)
    warnings_sent = 0
    
    # Find documents approaching deadline (within 4 hours)
    approaching_deadline = DartaLetter.objects.filter(
        sla_deadline__gt=now,
        sla_deadline__lte=warning_threshold,
        status__in=['pending', 'in_review'],
        is_sla_breached=False
    )
    
    for darta in approaching_deadline:
        # Check if warning already sent
        existing_warning = Notification.objects.filter(
            user=darta.current_handler,
            type='sla_warning',
            link_to=f'/darta/{darta.id}',
            created_at__gte=now - timedelta(hours=4)
        ).exists()
        
        if not existing_warning and darta.current_handler:
            hours_remaining = (darta.sla_deadline - now).total_seconds() / 3600
            Notification.objects.create(
                user=darta.current_handler,
                type='sla_warning',
                title=f'SLA Warning: {darta.darta_number}',
                message=f'Letter "{darta.subject}" has {int(hours_remaining)} hours until SLA deadline.',
                link_to=f'/darta/{darta.id}'
            )
            warnings_sent += 1
    
    logger.info(f"SLA warning check completed. Sent {warnings_sent} warnings.")
    return {'warnings_sent': warnings_sent}


@shared_task(bind=True, max_retries=3)
def send_daily_summary(self):
    """
    Send daily summary email to users with pending tasks.
    
    Runs at 8 AM daily.
    """
    from django.contrib.auth import get_user_model
    from apps.darta.models import DartaLetter
    from apps.chalani.models import ChalaniLetter
    from apps.notifications.models import Notification
    
    User = get_user_model()
    now = timezone.now()
    summaries_sent = 0
    
    # Get active users with pending tasks
    active_users = User.objects.filter(is_active=True)
    
    for user in active_users:
        # Count pending Darta
        pending_darta = DartaLetter.objects.filter(
            current_handler=user,
            status__in=['pending', 'in_review']
        ).count()
        
        # Count pending Chalani approvals (for approving authorities)
        pending_chalani = 0
        if user.has_role('approving_authority') or user.has_role('administrator'):
            pending_chalani = ChalaniLetter.objects.filter(
                status='pending',
                office=user.office
            ).count()
        
        # Count overdue items
        overdue_count = DartaLetter.objects.filter(
            current_handler=user,
            sla_deadline__lt=now,
            status__in=['pending', 'in_review']
        ).count()
        
        # Only send if there are pending items
        if pending_darta > 0 or pending_chalani > 0:
            message_parts = []
            if pending_darta > 0:
                message_parts.append(f'{pending_darta} pending letters')
            if pending_chalani > 0:
                message_parts.append(f'{pending_chalani} pending approvals')
            if overdue_count > 0:
                message_parts.append(f'{overdue_count} overdue items')
            
            Notification.objects.create(
                user=user,
                type='info',
                title='Daily Summary',
                message=f'You have: {", ".join(message_parts)}',
                link_to='/dashboard'
            )
            summaries_sent += 1
    
    logger.info(f"Daily summary sent to {summaries_sent} users.")
    return {'summaries_sent': summaries_sent}


@shared_task
def notify_on_forward(darta_id: str, from_user_id: str, to_user_id: str, remarks: str = ''):
    """
    Send notification when a document is forwarded.
    """
    from apps.darta.models import DartaLetter
    from apps.notifications.models import Notification
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    
    try:
        darta = DartaLetter.objects.get(id=darta_id)
        from_user = User.objects.get(id=from_user_id)
        to_user = User.objects.get(id=to_user_id)
        
        Notification.objects.create(
            user=to_user,
            type='task',
            title=f'New Task: {darta.darta_number}',
            message=f'{from_user.get_full_name()} forwarded "{darta.subject}" to you.',
            link_to=f'/darta/{darta.id}'
        )
        
        logger.info(f"Forward notification sent for Darta {darta_id}")
    except Exception as e:
        logger.error(f"Error sending forward notification: {e}")


@shared_task
def notify_on_approval(document_type: str, document_id: str, approved_by_id: str, is_approved: bool):
    """
    Send notification when a document is approved/rejected.
    """
    from apps.notifications.models import Notification
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    
    try:
        approved_by = User.objects.get(id=approved_by_id)
        
        if document_type == 'chalani':
            from apps.chalani.models import ChalaniLetter
            document = ChalaniLetter.objects.get(id=document_id)
            doc_number = document.chalani_number or 'Draft'
        else:
            from apps.darta.models import DartaLetter
            document = DartaLetter.objects.get(id=document_id)
            doc_number = document.darta_number
        
        status_text = 'approved' if is_approved else 'rejected'
        
        if document.created_by:
            Notification.objects.create(
                user=document.created_by,
                type='info',
                title=f'Document {status_text.title()}: {doc_number}',
                message=f'Your document "{document.subject}" has been {status_text} by {approved_by.get_full_name()}.',
                link_to=f'/{document_type}/{document_id}'
            )
        
        logger.info(f"Approval notification sent for {document_type} {document_id}")
    except Exception as e:
        logger.error(f"Error sending approval notification: {e}")


@shared_task
def calculate_user_statistics(user_id: str, period_days: int = 30):
    """
    Calculate performance statistics for a user.
    """
    from django.contrib.auth import get_user_model
    from apps.workflow.models import WorkflowStep
    
    User = get_user_model()
    now = timezone.now()
    start_date = now - timedelta(days=period_days)
    
    try:
        user = User.objects.get(id=user_id)
        
        # Actions performed
        actions = WorkflowStep.objects.filter(
            from_user=user,
            timestamp__gte=start_date
        )
        
        stats = {
            'user_id': user_id,
            'period_days': period_days,
            'total_actions': actions.count(),
            'forwards': actions.filter(action='forward').count(),
            'approvals': actions.filter(action='approve').count(),
            'returns': actions.filter(action='return').count(),
            'rejections': actions.filter(action='reject').count(),
        }
        
        logger.info(f"Calculated statistics for user {user_id}: {stats}")
        return stats
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found for statistics calculation")
        return None
