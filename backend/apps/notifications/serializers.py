"""
Serializers for notifications app.
"""
from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for notifications."""
    
    class Meta:
        model = Notification
        fields = [
            'id', 'type', 'title', 'message', 'link_to',
            'is_read', 'read_at', 'created_at'
        ]
        read_only_fields = ['id', 'type', 'title', 'message', 'link_to', 'created_at']


class NotificationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating notifications (internal use)."""
    
    class Meta:
        model = Notification
        fields = ['user', 'type', 'title', 'message', 'link_to']
