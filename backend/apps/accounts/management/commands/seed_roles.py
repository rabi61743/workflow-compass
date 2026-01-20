"""
Management command to seed default role permissions.

Usage: python manage.py seed_roles
"""
from django.core.management.base import BaseCommand
from apps.accounts.models import User, UserRole, Permission


class Command(BaseCommand):
    help = 'Seed default role-based permissions for the WMS'

    # Define default permissions for each role
    ROLE_PERMISSIONS = {
        'administrator': {
            'darta': ['view', 'create', 'edit', 'delete', 'approve'],
            'chalani': ['view', 'create', 'edit', 'delete', 'approve'],
            'workflow': ['view', 'create', 'edit', 'delete', 'approve'],
            'users': ['view', 'create', 'edit', 'delete'],
            'organization': ['view', 'create', 'edit', 'delete'],
            'reports': ['view', 'create'],
            'audit': ['view'],
            'templates': ['view', 'create', 'edit', 'delete'],
            'files': ['view', 'create', 'edit', 'delete'],
            'notifications': ['view', 'create'],
        },
        'clerk': {
            'darta': ['view', 'create', 'edit'],
            'chalani': ['view', 'create', 'edit'],
            'workflow': ['view', 'create'],
            'files': ['view', 'create', 'edit'],
            'templates': ['view'],
            'notifications': ['view'],
        },
        'department_officer': {
            'darta': ['view', 'edit'],
            'chalani': ['view', 'create', 'edit'],
            'workflow': ['view', 'create'],
            'files': ['view', 'create'],
            'templates': ['view'],
            'reports': ['view'],
            'notifications': ['view'],
        },
        'approving_authority': {
            'darta': ['view', 'edit', 'approve'],
            'chalani': ['view', 'edit', 'approve'],
            'workflow': ['view', 'create', 'approve'],
            'files': ['view'],
            'reports': ['view'],
            'notifications': ['view'],
        },
        'general_staff': {
            'darta': ['view'],
            'chalani': ['view'],
            'workflow': ['view'],
            'files': ['view'],
            'notifications': ['view'],
        },
        'auditor': {
            'darta': ['view'],
            'chalani': ['view'],
            'workflow': ['view'],
            'files': ['view'],
            'reports': ['view'],
            'audit': ['view'],
            'notifications': ['view'],
        },
    }

    def add_arguments(self, parser):
        parser.add_argument(
            '--user-id',
            type=str,
            help='Apply permissions to a specific user by ID',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes',
        )

    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        user_id = options.get('user_id')

        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN - No changes will be made'))

        if user_id:
            # Apply to specific user
            try:
                user = User.objects.get(id=user_id)
                self.apply_permissions_for_user(user, dry_run)
            except User.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'User with ID {user_id} not found'))
                return
        else:
            # Apply to all users with roles
            users_with_roles = User.objects.filter(user_roles__isnull=False).distinct()
            
            for user in users_with_roles:
                self.apply_permissions_for_user(user, dry_run)
        
        self.stdout.write(self.style.SUCCESS('Role permissions seeding completed!'))

    def apply_permissions_for_user(self, user, dry_run=False):
        """Apply permissions based on user's roles."""
        roles = user.get_roles()
        
        if not roles:
            self.stdout.write(f'  Skipping {user.email} - no roles assigned')
            return
        
        self.stdout.write(f'\nProcessing: {user.email}')
        self.stdout.write(f'  Roles: {", ".join(roles)}')
        
        # Collect all permissions from all roles
        all_permissions = {}
        for role in roles:
            role_perms = self.ROLE_PERMISSIONS.get(role, {})
            for module, actions in role_perms.items():
                if module not in all_permissions:
                    all_permissions[module] = set()
                all_permissions[module].update(actions)
        
        # Create permissions
        created_count = 0
        existing_count = 0
        
        for module, actions in all_permissions.items():
            for action in actions:
                if dry_run:
                    self.stdout.write(f'  Would create: {module}:{action}')
                    created_count += 1
                else:
                    perm, created = Permission.objects.get_or_create(
                        user=user,
                        module=module,
                        action=action
                    )
                    if created:
                        created_count += 1
                    else:
                        existing_count += 1
        
        self.stdout.write(
            f'  Created: {created_count}, Already existed: {existing_count}'
        )
