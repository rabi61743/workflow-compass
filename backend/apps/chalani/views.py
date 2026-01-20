"""
ViewSets for chalani app.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from rest_framework import status as http_status

from .models import ChalaniLetter, ChalaniRecipient, LetterTemplate
from .serializers import (
    ChalaniListSerializer, ChalaniDetailSerializer, ChalaniCreateSerializer,
    ChalaniUpdateSerializer, ChalaniRecipientSerializer, LetterTemplateSerializer
)
from apps.accounts.permissions import IsAdministrator, ReadOnlyForAuditor, HasModulePermission, CanApprove
from apps.workflow.models import WorkflowStep


class ChalaniLetterViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Chalani (outgoing) letters.
    
    list: Get all chalani letters (filtered by user access)
    retrieve: Get chalani details with workflow history
    create: Create new chalani draft
    update: Update chalani (only drafts)
    submit: Submit for approval
    approve: Approve chalani
    dispatch: Dispatch chalani (generates chalani number)
    """
    queryset = ChalaniLetter.objects.select_related(
        'receiver_office', 'office', 'created_by', 'dispatched_by',
        'template', 'reference_darta', 'file_id'
    ).prefetch_related('cc_recipients')
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'priority', 'receiver_type', 'fiscal_year', 'office']
    search_fields = ['chalani_number', 'subject', 'receiver_name', 'receiver_org']
    ordering_fields = ['created_at', 'dispatched_at', 'chalani_number']
    ordering = ['-created_at']
    module_name = 'chalani'
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ChalaniListSerializer
        elif self.action == 'create':
            return ChalaniCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ChalaniUpdateSerializer
        return ChalaniDetailSerializer
    
    def get_permissions(self):
        if self.action == 'destroy':
            return [IsAdministrator()]
        elif self.action == 'approve':
            return [permissions.IsAuthenticated(), CanApprove()]
        return [permissions.IsAuthenticated(), ReadOnlyForAuditor()]
    
    def get_queryset(self):
        """Filter queryset based on user role and office."""
        user = self.request.user
        qs = super().get_queryset()
        
        if user.has_role('administrator') or user.has_role('auditor'):
            return qs
        
        return qs.filter(
            Q(office=user.office) |
            Q(created_by=user)
        ).distinct()
    
    def update(self, request, *args, **kwargs):
        """Only allow updating drafts."""
        instance = self.get_object()
        if instance.status != 'draft':
            return Response(
                {'error': 'Only draft chalani can be edited'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().update(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def my_drafts(self, request):
        """Get user's draft chalani letters."""
        queryset = self.get_queryset().filter(
            created_by=request.user,
            status='draft'
        )
        serializer = ChalaniListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pending_approval(self, request):
        """Get chalani letters pending approval."""
        queryset = self.get_queryset().filter(
            status='pending'
        )
        serializer = ChalaniListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Submit chalani for approval."""
        chalani = self.get_object()
        
        if chalani.status != 'draft':
            return Response(
                {'error': 'Only drafts can be submitted'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        content_type = ContentType.objects.get_for_model(chalani)
        WorkflowStep.objects.create(
            content_type=content_type,
            object_id=chalani.id,
            action='forward',
            from_user=request.user,
            remarks='Submitted for approval'
        )
        
        chalani.status = 'pending'
        chalani.save()
        
        return Response(ChalaniDetailSerializer(chalani).data)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve chalani."""
        chalani = self.get_object()
        remarks = request.data.get('remarks', '')
        
        if chalani.status not in ['pending', 'in_review']:
            return Response(
                {'error': 'Chalani is not pending approval'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        content_type = ContentType.objects.get_for_model(chalani)
        WorkflowStep.objects.create(
            content_type=content_type,
            object_id=chalani.id,
            action='approve',
            from_user=request.user,
            remarks=remarks
        )
        
        chalani.status = 'approved'
        chalani.save()
        
        return Response(ChalaniDetailSerializer(chalani).data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject chalani."""
        chalani = self.get_object()
        remarks = request.data.get('remarks', '')
        
        if not remarks:
            return Response(
                {'error': 'Rejection reason is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        content_type = ContentType.objects.get_for_model(chalani)
        WorkflowStep.objects.create(
            content_type=content_type,
            object_id=chalani.id,
            action='reject',
            from_user=request.user,
            remarks=remarks
        )
        
        chalani.status = 'rejected'
        chalani.save()
        
        return Response(ChalaniDetailSerializer(chalani).data)
    
    @action(detail=True, methods=['post'])
    def dispatch(self, request, pk=None):
        """Dispatch chalani (assign number and mark as sent)."""
        chalani = self.get_object()
        
        if chalani.status != 'approved':
            return Response(
                {'error': 'Only approved chalani can be dispatched'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        content_type = ContentType.objects.get_for_model(chalani)
        WorkflowStep.objects.create(
            content_type=content_type,
            object_id=chalani.id,
            action='archive',
            from_user=request.user,
            remarks='Dispatched'
        )
        
        chalani.status = 'dispatched'
        chalani.dispatched_at = timezone.now()
        chalani.dispatched_by = request.user
        chalani.save()  # This will auto-generate chalani_number
        
        # If internal receiver, create corresponding Darta
        if chalani.receiver_type == 'internal' and chalani.receiver_office:
            self._create_auto_darta(chalani)
        
        return Response(ChalaniDetailSerializer(chalani).data)
    
    def _create_auto_darta(self, chalani):
        """Create Darta in receiving office when internal Chalani is dispatched."""
        from apps.darta.models import DartaLetter
        from django.conf import settings
        from datetime import timedelta
        
        fiscal_year = chalani.fiscal_year
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
        
        DartaLetter.objects.create(
            darta_number=darta_number,
            fiscal_year=fiscal_year,
            sender_name=chalani.office.name if chalani.office else 'Internal',
            sender_org=chalani.office.name if chalani.office else '',
            letter_date=chalani.dispatched_at.date(),
            received_date=chalani.dispatched_at.date(),
            subject=chalani.subject,
            reference_number=chalani.chalani_number,
            priority=chalani.priority,
            status='pending',
            office=chalani.receiver_office,
            current_handler=chalani.receiver_office.head,
            sla_deadline=timezone.now() + timedelta(hours=settings.DEFAULT_SLA_HOURS),
            created_by=chalani.dispatched_by
        )


class LetterTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for managing letter templates."""
    queryset = LetterTemplate.objects.all()
    serializer_class = LetterTemplateSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['category', 'is_active']
    search_fields = ['name', 'content']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdministrator()]
        return [permissions.IsAuthenticated()]
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get list of template categories."""
        categories = LetterTemplate.objects.values_list('category', flat=True).distinct()
        # Filter out empty strings and None
        categories = [c for c in categories if c]
        
        # Add default categories if not present
        default_categories = [
            'General',
            'Administrative',
            'Financial',
            'Legal',
            'Correspondence',
            'Reports',
            'Notices',
            'Circulars'
        ]
        
        all_categories = list(set(list(categories) + default_categories))
        all_categories.sort()
        
        return Response(all_categories)
    
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Duplicate an existing template."""
        original = self.get_object()
        
        # Create a copy with modified name
        new_template = LetterTemplate.objects.create(
            name=f"{original.name} (Copy)",
            name_nepali=f"{original.name_nepali} (प्रतिलिपि)" if original.name_nepali else '',
            content=original.content,
            category=original.category,
            is_active=True
        )
        
        return Response(LetterTemplateSerializer(new_template).data, status=status.HTTP_201_CREATED)
