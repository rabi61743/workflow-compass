"""
Workflow models for tracking document flow and file management.
"""
from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
import uuid


class WorkflowStep(models.Model):
    """
    Individual workflow step/action.
    Uses GenericForeignKey to work with both Darta and Chalani.
    """
    ACTION_CHOICES = [
        ('forward', 'Forward'),
        ('return', 'Return'),
        ('approve', 'Approve'),
        ('reject', 'Reject'),
        ('delegate', 'Delegate'),
        ('terminate', 'Terminate'),
        ('archive', 'Archive'),
        ('create', 'Create'),
        ('edit', 'Edit'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Generic relation to any document type
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.UUIDField()
    document = GenericForeignKey('content_type', 'object_id')
    
    # Action details
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    from_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='workflow_actions_from'
    )
    to_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='workflow_actions_to'
    )
    remarks = models.TextField(blank=True)
    
    # Timestamps
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'workflow_steps'
        verbose_name = 'Workflow Step'
        verbose_name_plural = 'Workflow Steps'
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.action} by {self.from_user} at {self.timestamp}"


class FileTracker(models.Model):
    """
    File tracking for grouping related documents.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file_number = models.CharField(max_length=100, unique=True)
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True)
    
    # Current status
    current_handler = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='handling_files'
    )
    office = models.ForeignKey(
        'organization.Office',
        on_delete=models.SET_NULL,
        null=True,
        related_name='files'
    )
    
    # Status
    is_active = models.BooleanField(default=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    
    # Audit
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_files'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'file_trackers'
        verbose_name = 'File Tracker'
        verbose_name_plural = 'File Trackers'
    
    def __str__(self):
        return f"{self.file_number} - {self.title[:50]}"


class Attachment(models.Model):
    """
    Document attachments.
    Generic relation to work with any document type.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Generic relation
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.UUIDField()
    document = GenericForeignKey('content_type', 'object_id')
    
    # File info
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to='attachments/%Y/%m/')
    file_type = models.CharField(max_length=100, blank=True)
    file_size = models.BigIntegerField(default=0)
    
    # NGX DMS reference (for future integration)
    ngx_document_id = models.CharField(max_length=255, blank=True)
    
    # Audit
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'attachments'
        verbose_name = 'Attachment'
        verbose_name_plural = 'Attachments'
    
    def __str__(self):
        return self.name


class AuditLog(models.Model):
    """
    Audit log for all system actions.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # User info
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )
    user_email = models.EmailField()  # Store email in case user is deleted
    
    # Action details
    action = models.CharField(max_length=100)
    module = models.CharField(max_length=100)
    
    # Related object
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    object_id = models.UUIDField(null=True, blank=True)
    
    # Details
    details = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    # Timestamp
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'audit_logs'
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.user_email} - {self.action} - {self.timestamp}"
