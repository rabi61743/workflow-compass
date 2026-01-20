"""
User and Role models for the WMS.
Roles are stored in a separate table to prevent privilege escalation.
"""
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone
from datetime import timedelta
import uuid
import secrets


class UserManager(BaseUserManager):
    """Custom user manager for email-based authentication."""
    
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    Custom User model for WMS.
    Uses email as the primary identifier instead of username.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = None  # Remove username field
    email = models.EmailField('email address', unique=True)
    name = models.CharField(max_length=255)
    designation = models.CharField(max_length=255, blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    
    # Office relationship
    office = models.ForeignKey(
        'organization.Office',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='employees'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return f"{self.name} ({self.email})"
    
    def get_full_name(self):
        """Return the user's full name."""
        return self.name
    
    def get_roles(self):
        """Get all roles for this user."""
        return [ur.role for ur in self.user_roles.all()]
    
    def has_role(self, role_name):
        """Check if user has a specific role."""
        return self.user_roles.filter(role=role_name).exists()


class UserRole(models.Model):
    """
    User roles stored in a separate table for security.
    This prevents privilege escalation attacks.
    """
    ROLE_CHOICES = [
        ('administrator', 'Administrator'),
        ('clerk', 'Clerk/Registrar'),
        ('department_officer', 'Department Officer'),
        ('approving_authority', 'Approving Authority'),
        ('general_staff', 'General Staff'),
        ('auditor', 'Auditor'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='user_roles'
    )
    role = models.CharField(max_length=50, choices=ROLE_CHOICES)
    assigned_at = models.DateTimeField(auto_now_add=True)
    assigned_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='roles_assigned'
    )
    
    class Meta:
        db_table = 'user_roles'
        unique_together = ['user', 'role']
        verbose_name = 'User Role'
        verbose_name_plural = 'User Roles'
    
    def __str__(self):
        return f"{self.user.name} - {self.role}"


class Permission(models.Model):
    """
    Module-level permissions for fine-grained access control.
    """
    ACTION_CHOICES = [
        ('view', 'View'),
        ('create', 'Create'),
        ('edit', 'Edit'),
        ('delete', 'Delete'),
        ('approve', 'Approve'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='module_permissions'
    )
    module = models.CharField(max_length=100)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    
    class Meta:
        db_table = 'user_permissions'
        unique_together = ['user', 'module', 'action']
        verbose_name = 'Permission'
        verbose_name_plural = 'Permissions'
    
    def __str__(self):
        return f"{self.user.name} - {self.module}:{self.action}"


class PasswordResetToken(models.Model):
    """
    Token for password reset functionality.
    Tokens expire after PASSWORD_RESET_TIMEOUT hours (default 24).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='password_reset_tokens'
    )
    token = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    used_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'password_reset_tokens'
        verbose_name = 'Password Reset Token'
        verbose_name_plural = 'Password Reset Tokens'
    
    def __str__(self):
        return f"Reset token for {self.user.email}"
    
    @classmethod
    def create_for_user(cls, user):
        """Create a new password reset token for a user."""
        # Invalidate any existing unused tokens
        cls.objects.filter(user=user, used_at__isnull=True).delete()
        
        # Generate secure token
        token = secrets.token_urlsafe(32)
        
        return cls.objects.create(user=user, token=token)
    
    def is_valid(self):
        """Check if the token is still valid."""
        if self.used_at:
            return False
        
        from django.conf import settings
        timeout_hours = getattr(settings, 'PASSWORD_RESET_TIMEOUT', 24)
        expiry_time = self.created_at + timedelta(hours=timeout_hours)
        
        return timezone.now() < expiry_time
    
    def use(self):
        """Mark the token as used."""
        self.used_at = timezone.now()
        self.save(update_fields=['used_at'])
