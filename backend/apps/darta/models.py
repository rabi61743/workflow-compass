"""
Darta (Incoming Letter) models.
"""
from django.db import models
from django.conf import settings
import uuid


class DartaLetter(models.Model):
    """
    Incoming letter registration (Darta).
    """
    PRIORITY_CHOICES = [
        ('normal', 'Normal'),
        ('urgent', 'Urgent'),
        ('confidential', 'Confidential'),
    ]
    
    CONFIDENTIALITY_CHOICES = [
        ('public', 'Public'),
        ('internal', 'Internal'),
        ('confidential', 'Confidential'),
        ('secret', 'Secret'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_review', 'In Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('closed', 'Closed'),
        ('terminated', 'Terminated'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Registration info
    darta_number = models.CharField(max_length=50, unique=True)
    fiscal_year = models.CharField(max_length=10)  # e.g., "2080/81"
    
    # Sender info
    sender_name = models.CharField(max_length=255)
    sender_org = models.CharField(max_length=255, blank=True)
    sender_address = models.TextField(blank=True)
    
    # Letter details
    letter_date = models.DateField()
    received_date = models.DateField()
    subject = models.CharField(max_length=500)
    reference_number = models.CharField(max_length=100, blank=True)
    
    # Classification
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='normal')
    confidentiality = models.CharField(max_length=20, choices=CONFIDENTIALITY_CHOICES, default='public')
    document_type = models.ForeignKey(
        'DocumentType',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    # Workflow status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    current_handler = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='handling_darta'
    )
    
    # Office assignment
    office = models.ForeignKey(
        'organization.Office',
        on_delete=models.SET_NULL,
        null=True,
        related_name='darta_letters'
    )
    
    # File tracking
    file_id = models.ForeignKey(
        'workflow.FileTracker',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='darta_letters'
    )
    
    # Audit
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_darta'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # SLA tracking
    sla_deadline = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'darta_letters'
        verbose_name = 'Darta Letter'
        verbose_name_plural = 'Darta Letters'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.darta_number} - {self.subject[:50]}"


class DartaRecipient(models.Model):
    """
    Recipients (primary and CC) for a Darta letter.
    """
    RECIPIENT_TYPE_CHOICES = [
        ('primary', 'Primary'),
        ('cc', 'CC (Bodhartha)'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    darta = models.ForeignKey(
        DartaLetter,
        on_delete=models.CASCADE,
        related_name='recipients'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_darta'
    )
    recipient_type = models.CharField(max_length=20, choices=RECIPIENT_TYPE_CHOICES, default='primary')
    received_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'darta_recipients'
        unique_together = ['darta', 'user']


class DocumentType(models.Model):
    """
    Document type classification.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    name_nepali = models.CharField(max_length=100, blank=True)
    code = models.CharField(max_length=20, unique=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'document_types'
        verbose_name = 'Document Type'
        verbose_name_plural = 'Document Types'
    
    def __str__(self):
        return self.name
