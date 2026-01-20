"""
Serializers for workflow app.
"""
from rest_framework import serializers
from .models import WorkflowStep, FileTracker, Attachment, AuditLog


class WorkflowStepSerializer(serializers.ModelSerializer):
    """Serializer for workflow steps."""
    from_user_name = serializers.CharField(source='from_user.name', read_only=True)
    to_user_name = serializers.CharField(source='to_user.name', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = WorkflowStep
        fields = [
            'id', 'action', 'action_display',
            'from_user', 'from_user_name',
            'to_user', 'to_user_name',
            'remarks', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']


class WorkflowStepCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating workflow steps."""
    document_type = serializers.CharField(write_only=True)
    document_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = WorkflowStep
        fields = ['document_type', 'document_id', 'action', 'to_user', 'remarks']
    
    def create(self, validated_data):
        from django.contrib.contenttypes.models import ContentType
        
        document_type = validated_data.pop('document_type')
        document_id = validated_data.pop('document_id')
        
        # Get content type
        if document_type == 'darta':
            from apps.darta.models import DartaLetter
            content_type = ContentType.objects.get_for_model(DartaLetter)
        elif document_type == 'chalani':
            from apps.chalani.models import ChalaniLetter
            content_type = ContentType.objects.get_for_model(ChalaniLetter)
        else:
            raise serializers.ValidationError({'document_type': 'Invalid document type'})
        
        request = self.context.get('request')
        
        return WorkflowStep.objects.create(
            content_type=content_type,
            object_id=document_id,
            from_user=request.user,
            **validated_data
        )


class AttachmentSerializer(serializers.ModelSerializer):
    """Serializer for attachments."""
    uploaded_by_name = serializers.CharField(source='uploaded_by.name', read_only=True)
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Attachment
        fields = [
            'id', 'name', 'file', 'file_url', 'file_type', 'file_size',
            'ngx_document_id', 'uploaded_by', 'uploaded_by_name', 'uploaded_at'
        ]
        read_only_fields = ['id', 'file_size', 'uploaded_at']
    
    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


class AttachmentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating attachments."""
    document_type = serializers.CharField(write_only=True)
    document_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = Attachment
        fields = ['document_type', 'document_id', 'name', 'file']
    
    def create(self, validated_data):
        from django.contrib.contenttypes.models import ContentType
        
        document_type = validated_data.pop('document_type')
        document_id = validated_data.pop('document_id')
        
        if document_type == 'darta':
            from apps.darta.models import DartaLetter
            content_type = ContentType.objects.get_for_model(DartaLetter)
        elif document_type == 'chalani':
            from apps.chalani.models import ChalaniLetter
            content_type = ContentType.objects.get_for_model(ChalaniLetter)
        else:
            raise serializers.ValidationError({'document_type': 'Invalid document type'})
        
        request = self.context.get('request')
        file_obj = validated_data.get('file')
        
        return Attachment.objects.create(
            content_type=content_type,
            object_id=document_id,
            file_type=file_obj.content_type if file_obj else '',
            file_size=file_obj.size if file_obj else 0,
            uploaded_by=request.user,
            **validated_data
        )


class FileTrackerListSerializer(serializers.ModelSerializer):
    """Serializer for file tracker list."""
    current_handler_name = serializers.CharField(source='current_handler.name', read_only=True)
    office_name = serializers.CharField(source='office.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    darta_count = serializers.SerializerMethodField()
    chalani_count = serializers.SerializerMethodField()
    
    class Meta:
        model = FileTracker
        fields = [
            'id', 'file_number', 'title', 'description',
            'current_handler', 'current_handler_name',
            'office', 'office_name',
            'is_active', 'darta_count', 'chalani_count',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
    
    def get_darta_count(self, obj):
        return obj.darta_letters.count()
    
    def get_chalani_count(self, obj):
        return obj.chalani_letters.count()


class FileTrackerDetailSerializer(serializers.ModelSerializer):
    """Serializer for file tracker detail."""
    current_handler_name = serializers.CharField(source='current_handler.name', read_only=True)
    office_name = serializers.CharField(source='office.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    darta_letters = serializers.SerializerMethodField()
    chalani_letters = serializers.SerializerMethodField()
    linked_documents = serializers.SerializerMethodField()
    darta_count = serializers.SerializerMethodField()
    chalani_count = serializers.SerializerMethodField()
    
    class Meta:
        model = FileTracker
        fields = [
            'id', 'file_number', 'title', 'description',
            'current_handler', 'current_handler_name',
            'office', 'office_name',
            'is_active', 'closed_at',
            'darta_letters', 'chalani_letters', 'linked_documents',
            'darta_count', 'chalani_count',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_darta_letters(self, obj):
        from apps.darta.serializers import DartaListSerializer
        return DartaListSerializer(obj.darta_letters.all(), many=True).data
    
    def get_chalani_letters(self, obj):
        from apps.chalani.serializers import ChalaniListSerializer
        return ChalaniListSerializer(obj.chalani_letters.all(), many=True).data
    
    def get_linked_documents(self, obj):
        """Get linked documents in frontend-expected format."""
        documents = []
        
        for darta in obj.darta_letters.all():
            documents.append({
                'type': 'darta',
                'id': str(darta.id),
                'number': darta.darta_number,
                'subject': darta.subject
            })
        
        for chalani in obj.chalani_letters.all():
            documents.append({
                'type': 'chalani',
                'id': str(chalani.id),
                'number': chalani.chalani_number or 'Draft',
                'subject': chalani.subject
            })
        
        return documents
    
    def get_darta_count(self, obj):
        return obj.darta_letters.count()
    
    def get_chalani_count(self, obj):
        return obj.chalani_letters.count()


class FileTrackerCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating file trackers."""
    
    class Meta:
        model = FileTracker
        fields = ['title', 'description', 'office']
    
    def create(self, validated_data):
        request = self.context.get('request')
        
        # Generate file number
        from django.utils import timezone
        year = timezone.now().year
        last_file = FileTracker.objects.filter(
            file_number__startswith=f"FILE-{year}"
        ).order_by('-file_number').first()
        
        if last_file:
            try:
                num = int(last_file.file_number.split('-')[-1]) + 1
            except:
                num = 1
        else:
            num = 1
        
        file_number = f"FILE-{year}-{num:05d}"
        
        return FileTracker.objects.create(
            file_number=file_number,
            current_handler=request.user,
            created_by=request.user,
            **validated_data
        )


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer for audit logs (read-only)."""
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_email', 'user_name', 'action', 'module',
            'details', 'ip_address', 'user_agent', 'timestamp'
        ]
        read_only_fields = fields
    
    def get_user_name(self, obj):
        if obj.user:
            return obj.user.name
        return obj.user_email.split('@')[0] if obj.user_email else 'Unknown'


class FileTrackerUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating file trackers."""
    
    class Meta:
        model = FileTracker
        fields = ['title', 'description', 'current_handler', 'office']
