"""
Notification models for in-app alerts and external notifications.
"""
from django.db import models
from django.conf import settings
import uuid


class Notification(models.Model):
    """
    In-app notifications.
    """
    TYPE_CHOICES = [
        ('task', 'Task Assignment'),
        ('sla_warning', 'SLA Warning'),
        ('sla_breach', 'SLA Breach'),
        ('approval', 'Approval Request'),
        ('info', 'Information'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    
    # Notification content
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    link_to = models.CharField(max_length=500, blank=True)
    
    # Status
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'notifications'
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.user.email}"
