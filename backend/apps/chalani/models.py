"""
Chalani (Outgoing Letter) models.
"""
from django.db import models
from django.conf import settings
import uuid


class ChalaniLetter(models.Model):
    """
    Outgoing letter (Chalani).
    """
    PRIORITY_CHOICES = [
        ('normal', 'Normal'),
        ('urgent', 'Urgent'),
        ('confidential', 'Confidential'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending Approval'),
        ('in_review', 'In Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('dispatched', 'Dispatched'),
    ]
    
    RECEIVER_TYPE_CHOICES = [
        ('internal', 'Internal'),
        ('external', 'External'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Registration info
    chalani_number = models.CharField(max_length=50, unique=True, null=True, blank=True)
    fiscal_year = models.CharField(max_length=10)
    
    # Receiver info
    receiver_name = models.CharField(max_length=255)
    receiver_org = models.CharField(max_length=255, blank=True)
    receiver_address = models.TextField(blank=True)
    receiver_type = models.CharField(max_length=20, choices=RECEIVER_TYPE_CHOICES, default='external')
    
    # For internal receivers
    receiver_office = models.ForeignKey(
        'organization.Office',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='received_chalani'
    )
    
    # Letter details
    subject = models.CharField(max_length=500)
    content = models.TextField()
    reference_darta = models.ForeignKey(
        'darta.DartaLetter',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='response_chalani'
    )
    
    # Classification
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='normal')
    
    # Template
    template = models.ForeignKey(
        'LetterTemplate',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    # Workflow status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Office
    office = models.ForeignKey(
        'organization.Office',
        on_delete=models.SET_NULL,
        null=True,
        related_name='chalani_letters'
    )
    
    # File tracking
    file_id = models.ForeignKey(
        'workflow.FileTracker',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='chalani_letters'
    )
    
    # Dispatch info
    dispatched_at = models.DateTimeField(null=True, blank=True)
    dispatched_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='dispatched_chalani'
    )
    
    # Audit
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_chalani'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'chalani_letters'
        verbose_name = 'Chalani Letter'
        verbose_name_plural = 'Chalani Letters'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.chalani_number or 'Draft'} - {self.subject[:50]}"
    
    def save(self, *args, **kwargs):
        # Auto-generate Chalani number on dispatch
        if self.status == 'dispatched' and not self.chalani_number:
            # Generate next Chalani number
            last = ChalaniLetter.objects.filter(
                fiscal_year=self.fiscal_year,
                chalani_number__isnull=False
            ).order_by('-chalani_number').first()
            
            if last and last.chalani_number:
                try:
                    num = int(last.chalani_number.split('-')[-1]) + 1
                except:
                    num = 1
            else:
                num = 1
            
            self.chalani_number = f"CH-{self.fiscal_year}-{num:05d}"
        
        super().save(*args, **kwargs)


class ChalaniRecipient(models.Model):
    """
    CC recipients for a Chalani letter.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    chalani = models.ForeignKey(
        ChalaniLetter,
        on_delete=models.CASCADE,
        related_name='cc_recipients'
    )
    name = models.CharField(max_length=255)
    organization = models.CharField(max_length=255, blank=True)
    is_internal = models.BooleanField(default=False)
    office = models.ForeignKey(
        'organization.Office',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    class Meta:
        db_table = 'chalani_recipients'


class LetterTemplate(models.Model):
    """
    Letter templates for Chalani.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    name_nepali = models.CharField(max_length=255, blank=True)
    content = models.TextField()
    category = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'letter_templates'
        verbose_name = 'Letter Template'
        verbose_name_plural = 'Letter Templates'
    
    def __str__(self):
        return self.name
