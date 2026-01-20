"""
Management command to seed document types.

Usage: python manage.py seed_document_types
"""
from django.core.management.base import BaseCommand
from apps.darta.models import DocumentType


class Command(BaseCommand):
    help = 'Seed default document types for the WMS'

    DOCUMENT_TYPES = [
        {'code': 'LTR', 'name': 'Letter', 'name_nepali': 'पत्र'},
        {'code': 'APP', 'name': 'Application', 'name_nepali': 'निवेदन'},
        {'code': 'REP', 'name': 'Report', 'name_nepali': 'प्रतिवेदन'},
        {'code': 'NOT', 'name': 'Notice', 'name_nepali': 'सूचना'},
        {'code': 'CIR', 'name': 'Circular', 'name_nepali': 'परिपत्र'},
        {'code': 'MOM', 'name': 'Minutes of Meeting', 'name_nepali': 'बैठक माइन्युट'},
        {'code': 'ORD', 'name': 'Order', 'name_nepali': 'आदेश'},
        {'code': 'DIR', 'name': 'Directive', 'name_nepali': 'निर्देशन'},
        {'code': 'AGR', 'name': 'Agreement', 'name_nepali': 'सम्झौता'},
        {'code': 'CON', 'name': 'Contract', 'name_nepali': 'ठेक्का'},
        {'code': 'INV', 'name': 'Invoice', 'name_nepali': 'बिजक'},
        {'code': 'REC', 'name': 'Receipt', 'name_nepali': 'रसिद'},
        {'code': 'REQ', 'name': 'Requisition', 'name_nepali': 'माग पत्र'},
        {'code': 'PRO', 'name': 'Proposal', 'name_nepali': 'प्रस्ताव'},
        {'code': 'CER', 'name': 'Certificate', 'name_nepali': 'प्रमाणपत्र'},
        {'code': 'LIC', 'name': 'License', 'name_nepali': 'इजाजतपत्र'},
        {'code': 'PER', 'name': 'Permit', 'name_nepali': 'अनुमति पत्र'},
        {'code': 'COM', 'name': 'Complaint', 'name_nepali': 'उजुरी'},
        {'code': 'RTI', 'name': 'RTI Request', 'name_nepali': 'सूचनाको हक अनुरोध'},
        {'code': 'OTH', 'name': 'Other', 'name_nepali': 'अन्य'},
    ]

    def handle(self, *args, **options):
        created_count = 0
        existing_count = 0
        
        for doc_type in self.DOCUMENT_TYPES:
            obj, created = DocumentType.objects.get_or_create(
                code=doc_type['code'],
                defaults={
                    'name': doc_type['name'],
                    'name_nepali': doc_type['name_nepali'],
                    'is_active': True,
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"  Created: {doc_type['name']}"))
            else:
                existing_count += 1
        
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(
            f'Done! Created: {created_count}, Already existed: {existing_count}'
        ))
