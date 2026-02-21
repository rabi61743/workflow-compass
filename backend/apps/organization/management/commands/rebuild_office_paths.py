"""
Management command to rebuild materialized paths for all offices.
Usage: python manage.py rebuild_office_paths
"""
from django.core.management.base import BaseCommand
from apps.organization.models import Office


class Command(BaseCommand):
    help = 'Rebuild materialized paths and depth for all offices in the hierarchy'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be updated without making changes',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        updated = 0

        # Start from root offices (no parent)
        roots = Office.objects.filter(parent__isnull=True).order_by('order', 'name')

        for root in roots:
            updated += self._rebuild_recursive(root, path=root.code, depth=0, dry_run=dry_run)

        if dry_run:
            self.stdout.write(self.style.WARNING(f'[DRY RUN] Would update {updated} offices'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Successfully rebuilt paths for {updated} offices'))

    def _rebuild_recursive(self, office, path, depth, dry_run):
        count = 0
        needs_update = office.path != path or office.depth != depth

        if needs_update:
            if not dry_run:
                Office.objects.filter(pk=office.pk).update(path=path, depth=depth)
            self.stdout.write(f'  {"[DRY] " if dry_run else ""}Updated: {office.code} -> path={path}, depth={depth}')
            count = 1

        children = Office.objects.filter(parent=office).order_by('order', 'name')
        for child in children:
            child_path = f'{path}/{child.code}'
            count += self._rebuild_recursive(child, child_path, depth + 1, dry_run)

        return count
