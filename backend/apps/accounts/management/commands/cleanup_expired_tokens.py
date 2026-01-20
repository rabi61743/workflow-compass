"""
Management command to cleanup expired password reset tokens.

Usage: python manage.py cleanup_expired_tokens
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.conf import settings
from datetime import timedelta
from apps.accounts.models import PasswordResetToken


class Command(BaseCommand):
    help = 'Clean up expired password reset tokens'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )

    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        
        # Get token expiry time from settings
        timeout_hours = getattr(settings, 'PASSWORD_RESET_TIMEOUT', 24)
        expiry_threshold = timezone.now() - timedelta(hours=timeout_hours)
        
        # Find expired tokens
        expired_tokens = PasswordResetToken.objects.filter(
            created_at__lt=expiry_threshold
        )
        
        # Also include used tokens
        used_tokens = PasswordResetToken.objects.filter(
            used_at__isnull=False
        )
        
        total_expired = expired_tokens.count()
        total_used = used_tokens.count()
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN - No changes will be made'))
            self.stdout.write(f'Would delete {total_expired} expired tokens')
            self.stdout.write(f'Would delete {total_used} used tokens')
        else:
            # Delete expired tokens
            expired_deleted, _ = expired_tokens.delete()
            
            # Delete used tokens (that weren't already deleted above)
            used_deleted, _ = PasswordResetToken.objects.filter(
                used_at__isnull=False
            ).delete()
            
            self.stdout.write(self.style.SUCCESS(
                f'Deleted {expired_deleted} expired tokens and {used_deleted} used tokens'
            ))
