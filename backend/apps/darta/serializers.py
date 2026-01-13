"""
Serializers for darta app.
"""
from rest_framework import serializers
from django.utils import timezone
from django.conf import settings
from datetime import timedelta

from .models import DartaLetter, DartaRecipient, DocumentType


class DocumentTypeSerializer(serializers.ModelSerializer):
    """Serializer for document types."""
    
    class Meta:
        model = DocumentType
        fields = ['id', 'name', 'name_nepali', 'code', 'is_active']
        read_only_fields = ['id']


class DartaRecipientSerializer(serializers.ModelSerializer):
    """Serializer for darta recipients."""
    user_name = serializers.CharField(source='user.name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = DartaRecipient
        fields = ['id', 'user', 'user_name', 'user_email', 'recipient_type', 'received_at']
        read_only_fields = ['id', 'received_at']


class DartaListSerializer(serializers.ModelSerializer):
    """Serializer for darta list view."""
    current_handler_name = serializers.CharField(source='current_handler.name', read_only=True)
    document_type_name = serializers.CharField(source='document_type.name', read_only=True)
    office_name = serializers.CharField(source='office.name', read_only=True)
    is_overdue = serializers.SerializerMethodField()
    
    class Meta:
        model = DartaLetter
        fields = [
            'id', 'darta_number', 'fiscal_year', 'sender_name', 'sender_org',
            'subject', 'letter_date', 'received_date', 'priority', 'confidentiality',
            'document_type', 'document_type_name', 'status',
            'current_handler', 'current_handler_name',
            'office', 'office_name', 'sla_deadline', 'is_overdue', 'created_at'
        ]
    
    def get_is_overdue(self, obj):
        if obj.sla_deadline and obj.status not in ['closed', 'terminated']:
            return timezone.now() > obj.sla_deadline
        return False


class DartaDetailSerializer(serializers.ModelSerializer):
    """Serializer for darta detail view."""
    current_handler_name = serializers.CharField(source='current_handler.name', read_only=True)
    document_type_name = serializers.CharField(source='document_type.name', read_only=True)
    office_name = serializers.CharField(source='office.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    recipients = DartaRecipientSerializer(many=True, read_only=True)
    file_number = serializers.CharField(source='file_id.file_number', read_only=True)
    workflow_steps = serializers.SerializerMethodField()
    attachments = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()
    
    class Meta:
        model = DartaLetter
        fields = [
            'id', 'darta_number', 'fiscal_year',
            'sender_name', 'sender_org', 'sender_address',
            'letter_date', 'received_date', 'subject', 'reference_number',
            'priority', 'confidentiality', 'document_type', 'document_type_name',
            'status', 'current_handler', 'current_handler_name',
            'office', 'office_name', 'file_id', 'file_number',
            'recipients', 'workflow_steps', 'attachments',
            'sla_deadline', 'is_overdue',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'darta_number', 'created_at', 'updated_at']
    
    def get_workflow_steps(self, obj):
        from apps.workflow.serializers import WorkflowStepSerializer
        from apps.workflow.models import WorkflowStep
        from django.contrib.contenttypes.models import ContentType
        
        content_type = ContentType.objects.get_for_model(obj)
        steps = WorkflowStep.objects.filter(
            content_type=content_type,
            object_id=obj.id
        ).select_related('from_user', 'to_user')
        return WorkflowStepSerializer(steps, many=True).data
    
    def get_attachments(self, obj):
        from apps.workflow.serializers import AttachmentSerializer
        from apps.workflow.models import Attachment
        from django.contrib.contenttypes.models import ContentType
        
        content_type = ContentType.objects.get_for_model(obj)
        attachments = Attachment.objects.filter(
            content_type=content_type,
            object_id=obj.id
        )
        return AttachmentSerializer(attachments, many=True).data
    
    def get_is_overdue(self, obj):
        if obj.sla_deadline and obj.status not in ['closed', 'terminated']:
            return timezone.now() > obj.sla_deadline
        return False


class DartaCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating darta."""
    recipients = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = DartaLetter
        fields = [
            'sender_name', 'sender_org', 'sender_address',
            'letter_date', 'received_date', 'subject', 'reference_number',
            'priority', 'confidentiality', 'document_type', 'office',
            'recipients'
        ]
    
    def create(self, validated_data):
        recipients_data = validated_data.pop('recipients', [])
        request = self.context.get('request')
        
        # Generate darta number
        fiscal_year = self._get_fiscal_year()
        last_darta = DartaLetter.objects.filter(
            fiscal_year=fiscal_year
        ).order_by('-darta_number').first()
        
        if last_darta:
            try:
                num = int(last_darta.darta_number.split('-')[-1]) + 1
            except:
                num = 1
        else:
            num = 1
        
        darta_number = f"DA-{fiscal_year}-{num:05d}"
        
        # Calculate SLA deadline
        sla_hours = settings.DEFAULT_SLA_HOURS
        if validated_data.get('priority') == 'urgent':
            sla_hours = settings.URGENT_SLA_HOURS
        elif validated_data.get('confidentiality') in ['confidential', 'secret']:
            sla_hours = settings.CONFIDENTIAL_SLA_HOURS
        
        sla_deadline = timezone.now() + timedelta(hours=sla_hours)
        
        # Create darta
        darta = DartaLetter.objects.create(
            darta_number=darta_number,
            fiscal_year=fiscal_year,
            sla_deadline=sla_deadline,
            created_by=request.user,
            current_handler=request.user,
            **validated_data
        )
        
        # Create recipients
        for recipient_data in recipients_data:
            DartaRecipient.objects.create(
                darta=darta,
                user_id=recipient_data.get('user_id'),
                recipient_type=recipient_data.get('type', 'primary')
            )
        
        return darta
    
    def _get_fiscal_year(self):
        """Get current Nepali fiscal year."""
        now = timezone.now()
        # Simplified - should use proper Nepali calendar
        if now.month >= 7:
            return f"{now.year}/{str(now.year + 1)[-2:]}"
        return f"{now.year - 1}/{str(now.year)[-2:]}"


class DartaUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating darta."""
    
    class Meta:
        model = DartaLetter
        fields = [
            'sender_name', 'sender_org', 'sender_address',
            'subject', 'reference_number', 'priority', 'confidentiality',
            'document_type', 'status'
        ]
