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
        ('section', 'Section'),
        ('unit', 'Unit'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    name_nepali = models.CharField(max_length=255, blank=True)
    type = models.CharField(max_length=20, choices=OFFICE_TYPE_CHOICES)
    location = models.CharField(max_length=255, blank=True)
    order = models.IntegerField(default=0, help_text='Sort order within the same parent office')
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    path = models.CharField(max_length=500, blank=True)
    depth = models.IntegerField(default=0, editable=False)
    
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
        ordering = ['order', 'name']
    
    def __str__(self):
        return f"{self.code} - {self.name}"

    def save(self, *args, **kwargs):
        if self.parent:
            self.depth = (self.parent.depth or 0) + 1
            parent_path = self.parent.path or self.parent.code
            self.path = f"{parent_path}/{self.code}"
        else:
            self.depth = 0
            self.path = self.code
        super().save(*args, **kwargs)
    
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
