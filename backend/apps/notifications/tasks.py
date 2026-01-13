"""
Celery tasks for notifications.

Includes email notifications, cleanup, and bulk notification sending.
"""
from celery import shared_task
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


@shared_task
def create_notification(
    user_id: str,
    notification_type: str,
    title: str,
    message: str,
    link_to: str = None
):
    """
    Create an in-app notification asynchronously.
    
    Args:
        user_id: UUID of the user to notify
        notification_type: Type of notification (task, sla_warning, sla_breach, info)
        title: Notification title
        message: Notification message
        link_to: Optional URL to link the notification to
    """
    from apps.notifications.models import Notification
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    
    try:
        user = User.objects.get(id=user_id)
        
        notification = Notification.objects.create(
            user=user,
            type=notification_type,
            title=title,
            message=message,
            link_to=link_to
        )
        
        logger.info(f"Created notification {notification.id} for user {user_id}")
        return str(notification.id)
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found for notification")
        return None
    except Exception as e:
        logger.error(f"Error creating notification: {e}")
        return None


@shared_task
def send_email_notification(
    user_id: str,
    subject: str,
    body: str,
    html_body: str = None
):
    """
    Send an email notification to a user.
    
    Args:
        user_id: UUID of the user to email
        subject: Email subject
        body: Plain text email body
        html_body: Optional HTML email body
    """
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    
    try:
        user = User.objects.get(id=user_id)
        
        if not user.email:
            logger.warning(f"User {user_id} has no email address")
            return False
        
        send_mail(
            subject=subject,
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_body,
            fail_silently=False
        )
        
        logger.info(f"Email sent to {user.email}")
        return True
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found for email")
        return False
    except Exception as e:
        logger.error(f"Error sending email: {e}")
        return False


@shared_task
def send_bulk_notification(
    user_ids: list,
    notification_type: str,
    title: str,
    message: str,
    link_to: str = None
):
    """
    Send notification to multiple users.
    
    Args:
        user_ids: List of user UUIDs
        notification_type: Type of notification
        title: Notification title
        message: Notification message
        link_to: Optional URL
    """
    from apps.notifications.models import Notification
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    created_count = 0
    
    users = User.objects.filter(id__in=user_ids, is_active=True)
    
    notifications = []
    for user in users:
        notifications.append(Notification(
            user=user,
            type=notification_type,
            title=title,
            message=message,
            link_to=link_to
        ))
    
    if notifications:
        Notification.objects.bulk_create(notifications)
        created_count = len(notifications)
    
    logger.info(f"Sent bulk notification to {created_count} users")
    return {'notifications_created': created_count}


@shared_task
def cleanup_old_notifications():
    """
    Clean up read notifications older than 30 days.
    
    Runs weekly to prevent notification table bloat.
    """
    from apps.notifications.models import Notification
    
    threshold = timezone.now() - timedelta(days=30)
    
    deleted_count, _ = Notification.objects.filter(
        is_read=True,
        created_at__lt=threshold
    ).delete()
    
    logger.info(f"Cleaned up {deleted_count} old notifications")
    return {'deleted_count': deleted_count}


@shared_task
def send_sla_breach_email(darta_id: str):
    """
    Send email notification for SLA breach.
    """
    from apps.darta.models import DartaLetter
    
    try:
        darta = DartaLetter.objects.select_related('current_handler', 'office').get(id=darta_id)
        
        if not darta.current_handler or not darta.current_handler.email:
            logger.warning(f"No handler email for Darta {darta_id}")
            return False
        
        subject = f'[URGENT] SLA Breach: {darta.darta_number}'
        body = f"""
Dear {darta.current_handler.get_full_name()},

This is an urgent notification that the following document has exceeded its SLA deadline:

Document Number: {darta.darta_number}
Subject: {darta.subject}
Priority: {darta.get_priority_display()}
Sender: {darta.sender_name} ({darta.sender_org})
Received: {darta.received_date}
SLA Deadline: {darta.sla_deadline}

Please take immediate action on this document.

Best regards,
Workflow Management System
"""
        
        send_mail(
            subject=subject,
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[darta.current_handler.email],
            fail_silently=False
        )
        
        logger.info(f"SLA breach email sent for Darta {darta_id}")
        return True
    except DartaLetter.DoesNotExist:
        logger.error(f"Darta {darta_id} not found for SLA email")
        return False
    except Exception as e:
        logger.error(f"Error sending SLA breach email: {e}")
        return False


@shared_task
def send_daily_digest_email(user_id: str):
    """
    Send daily digest email to a user.
    """
    from django.contrib.auth import get_user_model
    from apps.darta.models import DartaLetter
    from apps.chalani.models import ChalaniLetter
    
    User = get_user_model()
    now = timezone.now()
    
    try:
        user = User.objects.get(id=user_id)
        
        if not user.email:
            return False
        
        # Get pending items
        pending_darta = DartaLetter.objects.filter(
            current_handler=user,
            status__in=['pending', 'in_review']
        )
        
        overdue_darta = pending_darta.filter(sla_deadline__lt=now)
        
        # Build email
        subject = f'Daily Digest - {now.strftime("%B %d, %Y")}'
        body = f"""
Dear {user.get_full_name()},

Here is your daily summary:

Pending Documents: {pending_darta.count()}
Overdue Documents: {overdue_darta.count()}

"""
        
        if overdue_darta.exists():
            body += "Overdue Items:\n"
            for darta in overdue_darta[:5]:
                body += f"- {darta.darta_number}: {darta.subject}\n"
            if overdue_darta.count() > 5:
                body += f"... and {overdue_darta.count() - 5} more\n"
        
        body += """
Please log in to the Workflow Management System to take action.

Best regards,
Workflow Management System
"""
        
        send_mail(
            subject=subject,
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False
        )
        
        return True
    except Exception as e:
        logger.error(f"Error sending daily digest: {e}")
        return False
