"""
Serializers for Paperless-ngx integration.
"""
from rest_framework import serializers


class PaperlessDocumentSerializer(serializers.Serializer):
    """Serializer for Paperless document response."""
    id = serializers.IntegerField(read_only=True)
    correspondent = serializers.IntegerField(allow_null=True)
    document_type = serializers.IntegerField(allow_null=True)
    storage_path = serializers.IntegerField(allow_null=True)
    title = serializers.CharField()
    content = serializers.CharField(allow_blank=True)
    tags = serializers.ListField(child=serializers.IntegerField())
    created = serializers.DateTimeField()
    created_date = serializers.DateField()
    modified = serializers.DateTimeField()
    added = serializers.DateTimeField()
    archive_serial_number = serializers.IntegerField(allow_null=True)
    original_file_name = serializers.CharField()
    archived_file_name = serializers.CharField(allow_null=True)
    owner = serializers.IntegerField(allow_null=True)


class PaperlessCorrespondentSerializer(serializers.Serializer):
    """Serializer for Paperless correspondent."""
    id = serializers.IntegerField(read_only=True)
    slug = serializers.CharField(read_only=True)
    name = serializers.CharField(max_length=255)
    match = serializers.CharField(max_length=255, required=False, allow_blank=True)
    matching_algorithm = serializers.IntegerField(default=1)
    is_insensitive = serializers.BooleanField(default=True)
    document_count = serializers.IntegerField(read_only=True)


class PaperlessDocumentTypeSerializer(serializers.Serializer):
    """Serializer for Paperless document type."""
    id = serializers.IntegerField(read_only=True)
    slug = serializers.CharField(read_only=True)
    name = serializers.CharField(max_length=255)
    match = serializers.CharField(max_length=255, required=False, allow_blank=True)
    matching_algorithm = serializers.IntegerField(default=1)
    is_insensitive = serializers.BooleanField(default=True)
    document_count = serializers.IntegerField(read_only=True)


class PaperlessTagSerializer(serializers.Serializer):
    """Serializer for Paperless tag."""
    id = serializers.IntegerField(read_only=True)
    slug = serializers.CharField(read_only=True)
    name = serializers.CharField(max_length=255)
    color = serializers.CharField(max_length=7, required=False)
    is_inbox_tag = serializers.BooleanField(default=False)
    document_count = serializers.IntegerField(read_only=True)


class DocumentUploadSerializer(serializers.Serializer):
    """Serializer for document upload request."""
    file = serializers.FileField()
    title = serializers.CharField(max_length=255, required=False)
    correspondent = serializers.IntegerField(required=False)
    document_type = serializers.IntegerField(required=False)
    tags = serializers.ListField(child=serializers.IntegerField(), required=False)
    created = serializers.DateTimeField(required=False)


class DocumentSearchSerializer(serializers.Serializer):
    """Serializer for document search request."""
    query = serializers.CharField(max_length=255)
    correspondent = serializers.IntegerField(required=False)
    document_type = serializers.IntegerField(required=False)
    tags = serializers.ListField(child=serializers.IntegerField(), required=False)
    page = serializers.IntegerField(default=1, min_value=1)
    page_size = serializers.IntegerField(default=25, min_value=1, max_value=100)


class BulkEditSerializer(serializers.Serializer):
    """Serializer for bulk edit operations."""
    documents = serializers.ListField(child=serializers.IntegerField(), min_length=1)
    method = serializers.ChoiceField(choices=[
        'set_correspondent',
        'set_document_type',
        'add_tag',
        'remove_tag',
        'modify_tags',
        'delete'
    ])
    correspondent = serializers.IntegerField(required=False)
    document_type = serializers.IntegerField(required=False)
    tags = serializers.ListField(child=serializers.IntegerField(), required=False)


class PaperlessStatisticsSerializer(serializers.Serializer):
    """Serializer for Paperless statistics."""
    documents_total = serializers.IntegerField()
    documents_inbox = serializers.IntegerField()
    inbox_tag = serializers.IntegerField(allow_null=True)
    document_file_type_counts = serializers.ListField()
    character_count = serializers.IntegerField()
