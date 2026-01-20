"""
ViewSets for darta app.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q
from django.contrib.contenttypes.models import ContentType

from .models import DartaLetter, DartaRecipient, DocumentType
from .serializers import (
    DartaListSerializer, DartaDetailSerializer, DartaCreateSerializer,
    DartaUpdateSerializer, DartaRecipientSerializer, DocumentTypeSerializer
)
from apps.accounts.permissions import IsAdministrator, IsClerk, ReadOnlyForAuditor, HasModulePermission
from apps.workflow.models import WorkflowStep


class DartaLetterViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Darta (incoming) letters.
    
    list: Get all darta letters (filtered by user access)
    retrieve: Get darta details with workflow history
    create: Register new darta (clerk/admin)
    update: Update darta metadata
    forward: Forward to another user
    return_back: Return to previous handler
    """
    queryset = DartaLetter.objects.select_related(
        'current_handler', 'document_type', 'office', 'created_by', 'file_id'
    ).prefetch_related('recipients')
    lookup_field = 'darta_number'
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'priority', 'confidentiality', 'fiscal_year', 'office', 'current_handler']
    search_fields = ['darta_number', 'subject', 'sender_name', 'sender_org']
    ordering_fields = ['created_at', 'received_date', 'darta_number', 'priority']
    ordering = ['-created_at']
    module_name = 'darta'
    
    def get_serializer_class(self):
        if self.action == 'list':
            return DartaListSerializer
        elif self.action == 'create':
            return DartaCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return DartaUpdateSerializer
        return DartaDetailSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated(), HasModulePermission()]
        elif self.action == 'destroy':
            return [IsAdministrator()]
        return [permissions.IsAuthenticated(), ReadOnlyForAuditor()]
    
    def get_queryset(self):
        """Filter queryset based on user role and office."""
        user = self.request.user
        qs = super().get_queryset()
        
        # Admins see everything
        if user.has_role('administrator'):
            return qs
        
        # Auditors see everything (read-only enforced by permission)
        if user.has_role('auditor'):
            return qs
        
        # Others see only their office's darta or where they are handler/recipient
        return qs.filter(
            Q(office=user.office) |
            Q(current_handler=user) |
            Q(recipients__user=user) |
            Q(created_by=user)
        ).distinct()
    
    @action(detail=False, methods=['get'])
    def my_inbox(self, request):
        """Get darta letters where current user is the handler."""
        queryset = self.get_queryset().filter(
            current_handler=request.user,
            status__in=['pending', 'in_review']
        )
        serializer = DartaListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get overdue darta letters."""
        from django.utils import timezone
        queryset = self.get_queryset().filter(
            sla_deadline__lt=timezone.now(),
            status__in=['pending', 'in_review']
        )
        serializer = DartaListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def forward(self, request, *args, **kwargs):
        """Forward darta to another user."""
        darta = self.get_object()
        to_user_id = request.data.get('to_user')
        remarks = request.data.get('remarks', '')
        
        if not to_user_id:
            return Response(
                {'error': 'to_user is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        try:
            to_user = User.objects.get(id=to_user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Create workflow step
        content_type = ContentType.objects.get_for_model(darta)
        WorkflowStep.objects.create(
            content_type=content_type,
            object_id=darta.id,
            action='forward',
            from_user=request.user,
            to_user=to_user,
            remarks=remarks
        )
        
        # Update darta
        darta.current_handler = to_user
        darta.status = 'in_review'
        darta.save()
        
        return Response(DartaDetailSerializer(darta).data)
    
    @action(detail=True, methods=['post'])
    def return_back(self, request, *args, **kwargs):
        """Return darta to previous handler."""
        darta = self.get_object()
        remarks = request.data.get('remarks', '')
        
        # Get previous handler from workflow
        content_type = ContentType.objects.get_for_model(darta)
        last_step = WorkflowStep.objects.filter(
            content_type=content_type,
            object_id=darta.id,
            to_user=request.user
        ).order_by('-timestamp').first()
        
        if not last_step or not last_step.from_user:
            return Response(
                {'error': 'Cannot find previous handler'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create workflow step
        WorkflowStep.objects.create(
            content_type=content_type,
            object_id=darta.id,
            action='return',
            from_user=request.user,
            to_user=last_step.from_user,
            remarks=remarks
        )
        
        # Update darta
        darta.current_handler = last_step.from_user
        darta.save()
        
        return Response(DartaDetailSerializer(darta).data)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, *args, **kwargs):
        """Approve darta."""
        darta = self.get_object()
        remarks = request.data.get('remarks', '')
        
        content_type = ContentType.objects.get_for_model(darta)
        WorkflowStep.objects.create(
            content_type=content_type,
            object_id=darta.id,
            action='approve',
            from_user=request.user,
            remarks=remarks
        )
        
        darta.status = 'approved'
        darta.save()
        
        return Response(DartaDetailSerializer(darta).data)
    
    @action(detail=True, methods=['post'])
    def terminate(self, request, *args, **kwargs):
        """Terminate/close darta."""
        darta = self.get_object()
        remarks = request.data.get('remarks', '')
        
        content_type = ContentType.objects.get_for_model(darta)
        WorkflowStep.objects.create(
            content_type=content_type,
            object_id=darta.id,
            action='terminate',
            from_user=request.user,
            remarks=remarks
        )
        
        darta.status = 'terminated'
        darta.save()
        
        return Response(DartaDetailSerializer(darta).data)

    @action(detail=True, methods=['get'])
    def workflow(self, request, darta_number=None):
        """Get workflow history for this darta."""
        darta = self.get_object()
        serializer = DartaDetailSerializer(darta)
        return Response(serializer.data.get('workflow_steps', []))


class DocumentTypeViewSet(viewsets.ModelViewSet):
    """ViewSet for managing document types."""
    queryset = DocumentType.objects.all()
    serializer_class = DocumentTypeSerializer
    filter_backends = [SearchFilter]
    search_fields = ['name', 'code']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdministrator()]
        return [permissions.IsAuthenticated()]
