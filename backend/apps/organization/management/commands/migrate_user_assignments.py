"""
Management command to migrate existing user.office FK to UserOfficeAssignment.
Usage: python manage.py migrate_user_assignments
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.organization.models import UserOfficeAssignment, Designation

User = get_user_model()


class Command(BaseCommand):
    help = 'Migrate existing User.office foreign key data into UserOfficeAssignment records'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be created without making changes',
        )
        parser.add_argument(
            '--skip-existing',
            action='store_true',
            default=True,
            help='Skip users who already have a primary assignment (default: True)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        skip_existing = options['skip_existing']
        created = 0
        skipped = 0
        errors = 0

        users_with_office = User.objects.filter(office__isnull=False).select_related('office')

        self.stdout.write(f'Found {users_with_office.count()} users with office assignments')

        for user in users_with_office:
            # Check if primary assignment already exists
            if skip_existing:
                existing = UserOfficeAssignment.objects.filter(
                    user=user,
                    office=user.office,
                    assignment_type='primary',
                ).exists()
                if existing:
                    skipped += 1
                    continue

            # Try to find a matching designation
            designation = None
            if hasattr(user, 'designation') and user.designation:
                designation = Designation.objects.filter(
                    name__iexact=user.designation,
                    office=user.office,
                ).first()
                if not designation:
                    # Try global designations
                    designation = Designation.objects.filter(
                        name__iexact=user.designation,
                        is_global=True,
                    ).first()

            try:
                if not dry_run:
                    UserOfficeAssignment.objects.create(
                        user=user,
                        office=user.office,
                        designation=designation,
                        assignment_type='primary',
                        is_office_head=(user.office.head_id == user.id if user.office.head_id else False),
                        is_active=user.is_active,
                    )
                created += 1
                self.stdout.write(
                    f'  {"[DRY] " if dry_run else ""}Created assignment: '
                    f'{user.name} -> {user.office.name} ({user.designation or "no designation"})'
                )
            except Exception as e:
                errors += 1
                self.stderr.write(f'  Error for {user.name}: {e}')

        self.stdout.write('')
        prefix = '[DRY RUN] ' if dry_run else ''
        self.stdout.write(self.style.SUCCESS(f'{prefix}Created: {created}'))
        self.stdout.write(f'{prefix}Skipped (existing): {skipped}')
        if errors:
            self.stdout.write(self.style.ERROR(f'{prefix}Errors: {errors}'))
