"""
Organization models for office hierarchy management.
"""
from django.db import models
import uuid


class Office(models.Model):
    """
    Office/Organizational Unit model.
    Supports hierarchical structure with parent-child relationships.
    """
    OFFICE_TYPE_CHOICES = [
        ('head_office', 'Head Office'),
        ('regional', 'Regional Office'),
        ('branch', 'Branch Office'),
        ('department', 'Department'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    name_nepali = models.CharField(max_length=255, blank=True)
    type = models.CharField(max_length=20, choices=OFFICE_TYPE_CHOICES)
    location = models.CharField(max_length=255, blank=True)
    
    # Hierarchical relationship
    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='children'
    )
    
    # Office head
    head = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='headed_offices'
    )
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'offices'
        verbose_name = 'Office'
        verbose_name_plural = 'Offices'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.code} - {self.name}"
    
    def get_ancestors(self):
        """Get all parent offices up to the root."""
        ancestors = []
        current = self.parent
        while current:
            ancestors.append(current)
            current = current.parent
        return ancestors
    
    def get_descendants(self):
        """Get all child offices recursively."""
        descendants = list(self.children.all())
        for child in self.children.all():
            descendants.extend(child.get_descendants())
        return descendants


class Designation(models.Model):
    """
    Job designations within an office.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    name_nepali = models.CharField(max_length=255, blank=True)
    office = models.ForeignKey(
        Office,
        on_delete=models.CASCADE,
        related_name='designations'
    )
    level = models.IntegerField(default=0, help_text='Hierarchy level (lower = higher authority)')
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'designations'
        verbose_name = 'Designation'
        verbose_name_plural = 'Designations'
        ordering = ['level', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.office.code})"
