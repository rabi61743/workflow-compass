"""
Management command to create demo users for testing.

Usage: python manage.py create_demo_users
"""
from django.core.management.base import BaseCommand
from apps.accounts.models import User, UserRole
from apps.organization.models import Office


class Command(BaseCommand):
    help = 'Create demo users for testing the WMS'

    DEMO_USERS = [
        {
            'email': 'admin@wms.gov.np',
            'name': 'System Administrator',
            'designation': 'IT Administrator',
            'role': 'administrator',
            'password': 'admin123!',
        },
        {
            'email': 'clerk@wms.gov.np',
            'name': 'Ram Bahadur Thapa',
            'designation': 'Darta Chalani Clerk',
            'role': 'clerk',
            'password': 'clerk123!',
        },
        {
            'email': 'officer@wms.gov.np',
            'name': 'Sita Kumari Shrestha',
            'designation': 'Section Officer',
            'role': 'department_officer',
            'password': 'officer123!',
        },
        {
            'email': 'approver@wms.gov.np',
            'name': 'Krishna Prasad Sharma',
            'designation': 'Under Secretary',
            'role': 'approving_authority',
            'password': 'approver123!',
        },
        {
            'email': 'staff@wms.gov.np',
            'name': 'Hari Maya Gurung',
            'designation': 'Assistant',
            'role': 'general_staff',
            'password': 'staff123!',
        },
        {
            'email': 'auditor@wms.gov.np',
            'name': 'Bishnu Lal Yadav',
            'designation': 'Internal Auditor',
            'role': 'auditor',
            'password': 'auditor123!',
        },
    ]

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Overwrite existing demo users',
        )

    def handle(self, *args, **options):
        force = options.get('force', False)
        
        # Get or create a default office
        office, _ = Office.objects.get_or_create(
            code='HQ',
            defaults={
                'name': 'Head Office',
                'name_nepali': 'प्रधान कार्यालय',
                'type': 'head_office',
                'location': 'Kathmandu',
                'is_active': True,
            }
        )
        
        self.stdout.write(f'Using office: {office.name}')
        
        created_count = 0
        updated_count = 0
        skipped_count = 0
        
        for user_data in self.DEMO_USERS:
            email = user_data['email']
            
            try:
                user = User.objects.get(email=email)
                if force:
                    # Update existing user
                    user.name = user_data['name']
                    user.designation = user_data['designation']
                    user.office = office
                    user.set_password(user_data['password'])
                    user.save()
                    
                    # Update role
                    UserRole.objects.filter(user=user).delete()
                    UserRole.objects.create(user=user, role=user_data['role'])
                    
                    updated_count += 1
                    self.stdout.write(f'  Updated: {email}')
                else:
                    skipped_count += 1
                    self.stdout.write(f'  Skipped (exists): {email}')
            except User.DoesNotExist:
                # Create new user
                user = User.objects.create_user(
                    email=email,
                    password=user_data['password'],
                    name=user_data['name'],
                    designation=user_data['designation'],
                    office=office,
                )
                
                # Assign role
                UserRole.objects.create(user=user, role=user_data['role'])
                
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'  Created: {email}'))
        
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(
            f'Done! Created: {created_count}, Updated: {updated_count}, Skipped: {skipped_count}'
        ))
        
        if created_count > 0 or updated_count > 0:
            self.stdout.write('')
            self.stdout.write('Demo user credentials:')
            for user_data in self.DEMO_USERS:
                self.stdout.write(f"  {user_data['email']} / {user_data['password']}")
