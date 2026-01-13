"""
Serializers for chalani app.
"""
from rest_framework import serializers
from django.utils import timezone

from .models import ChalaniLetter, ChalaniRecipient, LetterTemplate


class LetterTemplateSerializer(serializers.ModelSerializer):
    """Serializer for letter templates."""
    
    class Meta:
        model = LetterTemplate
        fields = ['id', 'name', 'name_nepali', 'content', 'category', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class ChalaniRecipientSerializer(serializers.ModelSerializer):
    """Serializer for chalani CC recipients."""
    office_name = serializers.CharField(source='office.name', read_only=True)
    
    class Meta:
        model = ChalaniRecipient
        fields = ['id', 'name', 'organization', 'is_internal', 'office', 'office_name']
        read_only_fields = ['id']


class ChalaniListSerializer(serializers.ModelSerializer):
    """Serializer for chalani list view."""
    receiver_office_name = serializers.CharField(source='receiver_office.name', read_only=True)
    office_name = serializers.CharField(source='office.name', read_only=True)
    reference_darta_number = serializers.CharField(source='reference_darta.darta_number', read_only=True)
    
    class Meta:
        model = ChalaniLetter
        fields = [
            'id', 'chalani_number', 'fiscal_year', 'receiver_name', 'receiver_org',
            'receiver_type', 'receiver_office', 'receiver_office_name',
            'subject', 'priority', 'status',
            'office', 'office_name',
            'reference_darta', 'reference_darta_number',
            'dispatched_at', 'created_at'
        ]


class ChalaniDetailSerializer(serializers.ModelSerializer):
    """Serializer for chalani detail view."""
    receiver_office_name = serializers.CharField(source='receiver_office.name', read_only=True)
    office_name = serializers.CharField(source='office.name', read_only=True)
    reference_darta_number = serializers.CharField(source='reference_darta.darta_number', read_only=True)
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    dispatched_by_name = serializers.CharField(source='dispatched_by.name', read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True)
    cc_recipients = ChalaniRecipientSerializer(many=True, read_only=True)
    file_number = serializers.CharField(source='file_id.file_number', read_only=True)
    workflow_steps = serializers.SerializerMethodField()
    attachments = serializers.SerializerMethodField()
    
    class Meta:
        model = ChalaniLetter
        fields = [
            'id', 'chalani_number', 'fiscal_year',
            'receiver_name', 'receiver_org', 'receiver_address',
            'receiver_type', 'receiver_office', 'receiver_office_name',
            'subject', 'content', 'priority', 'status',
            'template', 'template_name',
            'reference_darta', 'reference_darta_number',
            'office', 'office_name', 'file_id', 'file_number',
            'cc_recipients', 'workflow_steps', 'attachments',
            'dispatched_at', 'dispatched_by', 'dispatched_by_name',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'chalani_number', 'created_at', 'updated_at', 'dispatched_at', 'dispatched_by']
    
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


class ChalaniCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating chalani."""
    cc_recipients = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = ChalaniLetter
        fields = [
            'receiver_name', 'receiver_org', 'receiver_address',
            'receiver_type', 'receiver_office',
            'subject', 'content', 'priority',
            'template', 'reference_darta', 'office',
            'cc_recipients'
        ]
    
    def create(self, validated_data):
        cc_recipients_data = validated_data.pop('cc_recipients', [])
        request = self.context.get('request')
        
        # Get fiscal year
        fiscal_year = self._get_fiscal_year()
        
        # Create chalani (no number yet - assigned on dispatch)
        chalani = ChalaniLetter.objects.create(
            fiscal_year=fiscal_year,
            status='draft',
            created_by=request.user,
            **validated_data
        )
        
        # Create CC recipients
        for recipient_data in cc_recipients_data:
            ChalaniRecipient.objects.create(
                chalani=chalani,
                name=recipient_data.get('name'),
                organization=recipient_data.get('organization', ''),
                is_internal=recipient_data.get('is_internal', False),
                office_id=recipient_data.get('office_id')
            )
        
        return chalani
    
    def _get_fiscal_year(self):
        """Get current Nepali fiscal year."""
        now = timezone.now()
        if now.month >= 7:
            return f"{now.year}/{str(now.year + 1)[-2:]}"
        return f"{now.year - 1}/{str(now.year)[-2:]}"


class ChalaniUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating chalani."""
    
    class Meta:
        model = ChalaniLetter
        fields = [
            'receiver_name', 'receiver_org', 'receiver_address',
            'subject', 'content', 'priority', 'template'
        ]
