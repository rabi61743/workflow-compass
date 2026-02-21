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
        indexes = [
            models.Index(fields=['path']),
            models.Index(fields=['parent', 'is_active']),
            models.Index(fields=['type', 'is_active']),
        ]
    
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

    def get_all_members(self):
        """Get all users assigned to this office (via UserOfficeAssignment)."""
        return self.user_assignments.filter(is_active=True).select_related('user', 'designation')


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
        null=True,
        blank=True,
        related_name='designations'
    )
    level = models.IntegerField(default=0, help_text='Hierarchy level (lower = higher authority)')
    can_approve = models.BooleanField(default=False, help_text='Whether this designation can approve documents')
    can_dispatch = models.BooleanField(default=False, help_text='Whether this designation can dispatch Chalani')
    is_global = models.BooleanField(default=False, help_text='If True, designation applies across all offices')
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'designations'
        verbose_name = 'Designation'
        verbose_name_plural = 'Designations'
        ordering = ['level', 'name']
    
    def __str__(self):
        if self.office:
            return f"{self.name} ({self.office.code})"
        return f"{self.name} (Global)"


class UserOfficeAssignment(models.Model):
    """
    Many-to-many relationship between users and offices with metadata.
    Allows users to belong to multiple offices with different designations.
    """
    ASSIGNMENT_TYPE_CHOICES = [
        ('primary', 'Primary Assignment'),
        ('secondary', 'Secondary Assignment'),
        ('deputation', 'Deputation'),
        ('acting', 'Acting/Temporary'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='office_assignments'
    )
    office = models.ForeignKey(
        Office,
        on_delete=models.CASCADE,
        related_name='user_assignments'
    )
    designation = models.ForeignKey(
        Designation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assignments'
    )
    assignment_type = models.CharField(
        max_length=20,
        choices=ASSIGNMENT_TYPE_CHOICES,
        default='primary'
    )
    is_office_head = models.BooleanField(default=False)
    reporting_to = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='direct_reports'
    )
    start_date = models.DateField(auto_now_add=True)
    end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_office_assignments'
        verbose_name = 'User Office Assignment'
        verbose_name_plural = 'User Office Assignments'
        unique_together = ['user', 'office', 'assignment_type']
        ordering = ['assignment_type', 'office__name']

    def __str__(self):
        return f"{self.user.name} → {self.office.name} ({self.get_assignment_type_display()})"


class ReportingStructure(models.Model):
    """
    Define reporting chains independent of office structure.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subordinate = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='reporting_to_relations'
    )
    supervisor = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='supervising_relations'
    )
    is_primary = models.BooleanField(default=True)
    effective_from = models.DateField(auto_now_add=True)
    effective_to = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'reporting_structures'
        verbose_name = 'Reporting Structure'
        verbose_name_plural = 'Reporting Structures'
        unique_together = ['subordinate', 'supervisor']

    def __str__(self):
        return f"{self.subordinate.name} reports to {self.supervisor.name}"
