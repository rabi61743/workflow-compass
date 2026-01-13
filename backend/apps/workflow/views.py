"""
ViewSets for workflow app.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q
from django.utils import timezone

from .models import WorkflowStep, FileTracker, Attachment, AuditLog
from .serializers import (
    WorkflowStepSerializer, WorkflowStepCreateSerializer,
    AttachmentSerializer, AttachmentCreateSerializer,
    FileTrackerListSerializer, FileTrackerDetailSerializer, FileTrackerCreateSerializer,
    AuditLogSerializer
)
from apps.accounts.permissions import IsAdministrator, IsAuditor, ReadOnlyForAuditor


class WorkflowStepViewSet(viewsets.ModelViewSet):
    """ViewSet for workflow steps."""
    queryset = WorkflowStep.objects.select_related('from_user', 'to_user')
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['action', 'from_user', 'to_user']
    ordering = ['-timestamp']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return WorkflowStepCreateSerializer
        return WorkflowStepSerializer
    
    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAdministrator()]
        return [permissions.IsAuthenticated(), ReadOnlyForAuditor()]


class AttachmentViewSet(viewsets.ModelViewSet):
    """ViewSet for attachments."""
    queryset = Attachment.objects.select_related('uploaded_by')
    parser_classes = [MultiPartParser, FormParser]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['name']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return AttachmentCreateSerializer
        return AttachmentSerializer
    
    def get_permissions(self):
        if self.action == 'destroy':
            return [IsAdministrator()]
        return [permissions.IsAuthenticated()]


class FileTrackerViewSet(viewsets.ModelViewSet):
    """
    ViewSet for file tracking.
    
    Files group related Darta and Chalani documents.
    """
    queryset = FileTracker.objects.select_related(
        'current_handler', 'office', 'created_by'
    ).prefetch_related('darta_letters', 'chalani_letters')
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['office', 'is_active', 'current_handler']
    search_fields = ['file_number', 'title', 'description']
    ordering_fields = ['created_at', 'file_number']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return FileTrackerListSerializer
        elif self.action == 'create':
            return FileTrackerCreateSerializer
        return FileTrackerDetailSerializer
    
    def get_permissions(self):
        if self.action == 'destroy':
            return [IsAdministrator()]
        return [permissions.IsAuthenticated(), ReadOnlyForAuditor()]
    
    def get_queryset(self):
        """Filter by user's office."""
        user = self.request.user
        qs = super().get_queryset()
        
        if user.has_role('administrator') or user.has_role('auditor'):
            return qs
        
        return qs.filter(
            Q(office=user.office) |
            Q(current_handler=user) |
            Q(created_by=user)
        ).distinct()
    
    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        """Close a file tracker."""
        file_tracker = self.get_object()
        file_tracker.is_active = False
        file_tracker.closed_at = timezone.now()
        file_tracker.save()
        return Response(FileTrackerDetailSerializer(file_tracker).data)
    
    @action(detail=True, methods=['post'])
    def link_darta(self, request, pk=None):
        """Link a Darta letter to this file."""
        from apps.darta.models import DartaLetter
        
        file_tracker = self.get_object()
        darta_id = request.data.get('darta_id')
        
        try:
            darta = DartaLetter.objects.get(id=darta_id)
            darta.file_id = file_tracker
            darta.save()
            return Response({'message': 'Darta linked successfully'})
        except DartaLetter.DoesNotExist:
            return Response(
                {'error': 'Darta not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def link_chalani(self, request, pk=None):
        """Link a Chalani letter to this file."""
        from apps.chalani.models import ChalaniLetter
        
        file_tracker = self.get_object()
        chalani_id = request.data.get('chalani_id')
        
        try:
            chalani = ChalaniLetter.objects.get(id=chalani_id)
            chalani.file_id = file_tracker
            chalani.save()
            return Response({'message': 'Chalani linked successfully'})
        except ChalaniLetter.DoesNotExist:
            return Response(
                {'error': 'Chalani not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for audit logs (read-only).
    Only administrators and auditors can view.
    """
    queryset = AuditLog.objects.select_related('user')
    serializer_class = AuditLogSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['user', 'action', 'module']
    search_fields = ['user_email', 'action', 'details']
    ordering = ['-timestamp']
    
    def get_permissions(self):
        return [permissions.IsAuthenticated(), IsAdministrator() | IsAuditor()]
