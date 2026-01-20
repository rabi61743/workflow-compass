"""
ViewSets for workflow app.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q, Count, Avg, F
from django.db.models.functions import TruncMonth, TruncDate
from django.utils import timezone
from django.conf import settings
from datetime import timedelta
from collections import defaultdict

from .models import WorkflowStep, FileTracker, Attachment, AuditLog
from .serializers import (
    WorkflowStepSerializer, WorkflowStepCreateSerializer,
    AttachmentSerializer, AttachmentCreateSerializer,
    FileTrackerListSerializer, FileTrackerDetailSerializer, 
    FileTrackerCreateSerializer, FileTrackerUpdateSerializer,
    AuditLogSerializer
)
from apps.accounts.permissions import IsAdministrator, IsAuditor, ReadOnlyForAuditor
from apps.darta.models import DartaLetter
from apps.chalani.models import ChalaniLetter


# ============ Dashboard & Statistics Views ============

class DashboardStatsView(APIView):
    """
    Dashboard statistics endpoint.
    
    GET /api/workflow/dashboard/stats/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=today_start.weekday())
        
        # Get counts for current user or office
        if user.has_role('administrator') or user.has_role('auditor'):
            darta_qs = DartaLetter.objects.all()
            chalani_qs = ChalaniLetter.objects.all()
        else:
            darta_qs = DartaLetter.objects.filter(
                Q(current_handler=user) | Q(office=user.office)
            )
            chalani_qs = ChalaniLetter.objects.filter(
                Q(created_by=user) | Q(office=user.office)
            )
        
        # Pending tasks for current user
        pending_tasks = DartaLetter.objects.filter(
            current_handler=user,
            status__in=['pending', 'in_review']
        ).count()
        
        # Completed today
        completed_today = WorkflowStep.objects.filter(
            from_user=user,
            action__in=['approve', 'forward'],
            timestamp__gte=today_start
        ).count()
        
        # Overdue tasks
        overdue_tasks = DartaLetter.objects.filter(
            current_handler=user,
            sla_deadline__lt=now,
            status__in=['pending', 'in_review']
        ).count()
        
        # SLA breaches this week
        sla_breaches_week = DartaLetter.objects.filter(
            is_sla_breached=True,
            updated_at__gte=week_start
        ).count()
        
        # Document counts by status
        darta_by_status = dict(
            darta_qs.values('status').annotate(count=Count('id')).values_list('status', 'count')
        )
        
        chalani_by_status = dict(
            chalani_qs.values('status').annotate(count=Count('id')).values_list('status', 'count')
        )
        
        return Response({
            'pending_tasks': pending_tasks,
            'completed_today': completed_today,
            'overdue_tasks': overdue_tasks,
            'sla_breaches_this_week': sla_breaches_week,
            'total_darta': darta_qs.count(),
            'total_chalani': chalani_qs.count(),
            'darta_by_status': darta_by_status,
            'chalani_by_status': chalani_by_status,
        })


class MyTasksView(APIView):
    """
    Get current user's pending tasks.
    
    GET /api/workflow/my-tasks/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        status_filter = request.query_params.get('status', 'pending')
        priority = request.query_params.get('priority')
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        
        # Get assigned Darta letters
        tasks = DartaLetter.objects.filter(
            current_handler=user
        ).select_related('document_type', 'office')
        
        if status_filter == 'pending':
            tasks = tasks.filter(status__in=['pending', 'in_review'])
        elif status_filter == 'completed':
            tasks = tasks.filter(status__in=['approved', 'closed', 'terminated'])
        
        if priority:
            tasks = tasks.filter(priority=priority)
        
        # Order by priority and SLA deadline
        tasks = tasks.order_by(
            '-priority',  # urgent first
            'sla_deadline'  # closest deadline first
        )
        
        # Paginate
        total = tasks.count()
        start = (page - 1) * page_size
        end = start + page_size
        tasks = tasks[start:end]
        
        # Build response
        results = []
        now = timezone.now()
        for task in tasks:
            # Get who forwarded it
            last_step = WorkflowStep.objects.filter(
                object_id=task.id,
                to_user=user
            ).order_by('-timestamp').first()
            
            results.append({
                'id': str(task.id),
                'document_id': str(task.id),
                'document_type': 'darta',
                'document_number': task.darta_number,
                'subject': task.subject,
                'assigned_at': last_step.timestamp.isoformat() if last_step else task.created_at.isoformat(),
                'due_at': task.sla_deadline.isoformat() if task.sla_deadline else None,
                'priority': task.priority,
                'is_overdue': task.sla_deadline < now if task.sla_deadline else False,
                'from_user': {
                    'id': str(last_step.from_user.id) if last_step and last_step.from_user else None,
                    'name': last_step.from_user.name if last_step and last_step.from_user else 'System'
                }
            })
        
        return Response({
            'count': total,
            'results': results
        })


class GlobalSearchView(APIView):
    """
    Global search across all documents.
    
    GET /api/workflow/search/?q=query&module=darta
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        query = request.query_params.get('q', '')
        module = request.query_params.get('module', 'all')
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        
        if not query or len(query) < 2:
            return Response({'results': [], 'count': 0})
        
        user = request.user
        results = []
        
        # Search Darta
        if module in ['all', 'darta']:
            darta_qs = DartaLetter.objects.filter(
                Q(darta_number__icontains=query) |
                Q(subject__icontains=query) |
                Q(sender_name__icontains=query) |
                Q(sender_org__icontains=query)
            )
            
            # Apply access control
            if not user.has_role('administrator') and not user.has_role('auditor'):
                darta_qs = darta_qs.filter(
                    Q(office=user.office) | Q(current_handler=user) | Q(created_by=user)
                )
            
            for d in darta_qs[:10]:
                results.append({
                    'id': str(d.id),
                    'type': 'darta',
                    'number': d.darta_number,
                    'subject': d.subject,
                    'status': d.status,
                    'priority': d.priority,
                    'date': d.received_date.isoformat() if d.received_date else None,
                    'url': f'/darta/{d.id}'
                })
        
        # Search Chalani
        if module in ['all', 'chalani']:
            chalani_qs = ChalaniLetter.objects.filter(
                Q(chalani_number__icontains=query) |
                Q(subject__icontains=query) |
                Q(receiver_name__icontains=query) |
                Q(receiver_org__icontains=query)
            )
            
            if not user.has_role('administrator') and not user.has_role('auditor'):
                chalani_qs = chalani_qs.filter(
                    Q(office=user.office) | Q(created_by=user)
                )
            
            for c in chalani_qs[:10]:
                results.append({
                    'id': str(c.id),
                    'type': 'chalani',
                    'number': c.chalani_number or 'Draft',
                    'subject': c.subject,
                    'status': c.status,
                    'priority': c.priority,
                    'date': c.created_at.isoformat(),
                    'url': f'/chalani/{c.id}'
                })
        
        # Search Files
        if module in ['all', 'files']:
            files_qs = FileTracker.objects.filter(
                Q(file_number__icontains=query) |
                Q(title__icontains=query) |
                Q(description__icontains=query)
            )
            
            if not user.has_role('administrator') and not user.has_role('auditor'):
                files_qs = files_qs.filter(
                    Q(office=user.office) | Q(current_handler=user) | Q(created_by=user)
                )
            
            for f in files_qs[:10]:
                results.append({
                    'id': str(f.id),
                    'type': 'file',
                    'number': f.file_number,
                    'subject': f.title,
                    'status': 'active' if f.is_active else 'closed',
                    'priority': 'normal',
                    'date': f.created_at.isoformat(),
                    'url': f'/files/{f.id}'
                })
        
        return Response({
            'count': len(results),
            'results': results
        })


class ReportsView(APIView):
    """
    Reports and analytics endpoint.
    
    GET /api/workflow/reports/?type=monthly-summary
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        report_type = request.query_params.get('type', 'monthly-summary')
        from_date = request.query_params.get('from_date')
        to_date = request.query_params.get('to_date')
        office_id = request.query_params.get('office_id')
        
        # Default date range: last 6 months
        now = timezone.now()
        if not from_date:
            from_date = (now - timedelta(days=180)).date()
        if not to_date:
            to_date = now.date()
        
        # Build base querysets
        darta_qs = DartaLetter.objects.filter(created_at__date__gte=from_date, created_at__date__lte=to_date)
        chalani_qs = ChalaniLetter.objects.filter(created_at__date__gte=from_date, created_at__date__lte=to_date)
        
        if office_id:
            darta_qs = darta_qs.filter(office_id=office_id)
            chalani_qs = chalani_qs.filter(office_id=office_id)
        
        if report_type == 'monthly-summary':
            return self._monthly_summary(darta_qs, chalani_qs)
        elif report_type == 'status-distribution':
            return self._status_distribution(darta_qs, chalani_qs)
        elif report_type == 'department-workload':
            return self._department_workload(darta_qs, chalani_qs)
        elif report_type == 'sla-compliance':
            return self._sla_compliance(darta_qs)
        elif report_type == 'user-performance':
            return self._user_performance(request.user, from_date, to_date)
        
        return Response({'error': 'Invalid report type'}, status=400)
    
    def _monthly_summary(self, darta_qs, chalani_qs):
        """Monthly document counts."""
        darta_monthly = list(
            darta_qs.annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )
        
        chalani_monthly = list(
            chalani_qs.annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )
        
        return Response({
            'darta': [{'month': m['month'].strftime('%Y-%m'), 'count': m['count']} for m in darta_monthly],
            'chalani': [{'month': m['month'].strftime('%Y-%m'), 'count': m['count']} for m in chalani_monthly]
        })
    
    def _status_distribution(self, darta_qs, chalani_qs):
        """Document counts by status."""
        darta_status = list(darta_qs.values('status').annotate(count=Count('id')))
        chalani_status = list(chalani_qs.values('status').annotate(count=Count('id')))
        
        return Response({
            'darta': darta_status,
            'chalani': chalani_status
        })
    
    def _department_workload(self, darta_qs, chalani_qs):
        """Document counts by office."""
        from apps.organization.models import Office
        
        offices = Office.objects.filter(is_active=True)
        workload = []
        
        for office in offices:
            workload.append({
                'office_id': str(office.id),
                'office_name': office.name,
                'darta_count': darta_qs.filter(office=office).count(),
                'chalani_count': chalani_qs.filter(office=office).count(),
                'pending_count': darta_qs.filter(office=office, status__in=['pending', 'in_review']).count()
            })
        
        return Response(workload)
    
    def _sla_compliance(self, darta_qs):
        """SLA compliance statistics."""
        total = darta_qs.count()
        if total == 0:
            return Response({
                'total': 0,
                'compliant': 0,
                'breached': 0,
                'compliance_rate': 0
            })
        
        breached = darta_qs.filter(is_sla_breached=True).count()
        compliant = total - breached
        
        return Response({
            'total': total,
            'compliant': compliant,
            'breached': breached,
            'compliance_rate': round((compliant / total) * 100, 2)
        })
    
    def _user_performance(self, user, from_date, to_date):
        """User performance metrics."""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        users = User.objects.filter(is_active=True)[:20]  # Top 20 users
        performance = []
        
        for u in users:
            actions = WorkflowStep.objects.filter(
                from_user=u,
                timestamp__date__gte=from_date,
                timestamp__date__lte=to_date
            )
            
            performance.append({
                'user_id': str(u.id),
                'user_name': u.name,
                'total_actions': actions.count(),
                'forwards': actions.filter(action='forward').count(),
                'approvals': actions.filter(action='approve').count(),
                'rejections': actions.filter(action='reject').count()
            })
        
        # Sort by total actions
        performance.sort(key=lambda x: x['total_actions'], reverse=True)
        
        return Response(performance)


class WorkflowActionView(APIView):
    """
    Perform workflow action on a document.
    
    POST /api/workflow/action/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        from django.contrib.contenttypes.models import ContentType
        
        document_type = request.data.get('document_type')  # 'darta' or 'chalani'
        document_id = request.data.get('document_id')
        action = request.data.get('action')
        to_user_id = request.data.get('to_user_id')
        remarks = request.data.get('remarks', '')
        
        # Validate
        if document_type not in ['darta', 'chalani']:
            return Response({'error': 'Invalid document type'}, status=400)
        
        valid_actions = ['forward', 'return', 'approve', 'reject', 'delegate', 'terminate', 'archive']
        if action not in valid_actions:
            return Response({'error': 'Invalid action'}, status=400)
        
        # Get document
        if document_type == 'darta':
            try:
                document = DartaLetter.objects.get(id=document_id)
            except DartaLetter.DoesNotExist:
                return Response({'error': 'Document not found'}, status=404)
            content_type = ContentType.objects.get_for_model(DartaLetter)
        else:
            try:
                document = ChalaniLetter.objects.get(id=document_id)
            except ChalaniLetter.DoesNotExist:
                return Response({'error': 'Document not found'}, status=404)
            content_type = ContentType.objects.get_for_model(ChalaniLetter)
        
        # Get target user if needed
        to_user = None
        if action in ['forward', 'delegate'] and to_user_id:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                to_user = User.objects.get(id=to_user_id)
            except User.DoesNotExist:
                return Response({'error': 'Target user not found'}, status=404)
        
        # Create workflow step
        step = WorkflowStep.objects.create(
            content_type=content_type,
            object_id=document.id,
            action=action,
            from_user=request.user,
            to_user=to_user,
            remarks=remarks
        )
        
        # Update document status based on action
        if action == 'forward' and to_user:
            if hasattr(document, 'current_handler'):
                document.current_handler = to_user
            document.status = 'in_review'
        elif action == 'approve':
            document.status = 'approved'
        elif action == 'reject':
            document.status = 'rejected'
        elif action == 'terminate':
            document.status = 'terminated'
        elif action == 'archive':
            document.status = 'closed'
        
        document.save()
        
        return Response(WorkflowStepSerializer(step).data, status=201)


class SlaStatusView(APIView):
    """
    Get SLA status for a document.
    
    GET /api/workflow/sla-status/darta/{id}/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, document_type, document_id):
        now = timezone.now()
        
        if document_type == 'darta':
            try:
                document = DartaLetter.objects.get(id=document_id)
            except DartaLetter.DoesNotExist:
                return Response({'error': 'Document not found'}, status=404)
        else:
            try:
                document = ChalaniLetter.objects.get(id=document_id)
            except ChalaniLetter.DoesNotExist:
                return Response({'error': 'Document not found'}, status=404)
        
        deadline = getattr(document, 'sla_deadline', None)
        
        if not deadline:
            return Response({
                'deadline': None,
                'hours_remaining': None,
                'is_overdue': False,
                'is_warning': False
            })
        
        hours_remaining = (deadline - now).total_seconds() / 3600
        
        return Response({
            'deadline': deadline.isoformat(),
            'hours_remaining': round(hours_remaining, 1),
            'is_overdue': hours_remaining < 0,
            'is_warning': 0 <= hours_remaining <= 4
        })


# ============ Original ViewSets ============


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
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get list of file categories."""
        categories = [
            'General',
            'Administrative',
            'Financial',
            'Legal',
            'Personnel',
            'Projects',
            'Correspondence',
            'Reports',
            'Other'
        ]
        return Response(categories)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get file tracker statistics."""
        user = request.user
        qs = self.get_queryset()
        
        total = qs.count()
        open_files = qs.filter(is_active=True).count()
        closed = qs.filter(is_active=False).count()
        
        # Count linked documents
        from apps.darta.models import DartaLetter
        from apps.chalani.models import ChalaniLetter
        
        total_linked_docs = (
            DartaLetter.objects.filter(file_id__isnull=False).count() +
            ChalaniLetter.objects.filter(file_id__isnull=False).count()
        )
        
        return Response({
            'total': total,
            'open': open_files,
            'closed': closed,
            'total_linked_docs': total_linked_docs
        })
    
    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        """Close a file tracker."""
        file_tracker = self.get_object()
        file_tracker.is_active = False
        file_tracker.closed_at = timezone.now()
        file_tracker.save()
        return Response(FileTrackerDetailSerializer(file_tracker).data)
    
    @action(detail=True, methods=['post'])
    def reopen(self, request, pk=None):
        """Reopen a closed file tracker."""
        file_tracker = self.get_object()
        file_tracker.is_active = True
        file_tracker.closed_at = None
        file_tracker.save()
        return Response(FileTrackerDetailSerializer(file_tracker).data)
    
    @action(detail=True, methods=['post'])
    def link(self, request, pk=None):
        """Link a document (Darta or Chalani) to this file."""
        from apps.darta.models import DartaLetter
        from apps.chalani.models import ChalaniLetter
        
        file_tracker = self.get_object()
        document_type = request.data.get('document_type')
        document_id = request.data.get('document_id')
        
        if document_type == 'darta':
            try:
                document = DartaLetter.objects.get(id=document_id)
                document.file_id = file_tracker
                document.save()
                return Response(FileTrackerDetailSerializer(file_tracker).data)
            except DartaLetter.DoesNotExist:
                return Response({'error': 'Darta not found'}, status=status.HTTP_404_NOT_FOUND)
        elif document_type == 'chalani':
            try:
                document = ChalaniLetter.objects.get(id=document_id)
                document.file_id = file_tracker
                document.save()
                return Response(FileTrackerDetailSerializer(file_tracker).data)
            except ChalaniLetter.DoesNotExist:
                return Response({'error': 'Chalani not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({'error': 'Invalid document type'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def unlink(self, request, pk=None):
        """Unlink a document from this file."""
        from apps.darta.models import DartaLetter
        from apps.chalani.models import ChalaniLetter
        
        file_tracker = self.get_object()
        document_type = request.data.get('document_type')
        document_id = request.data.get('document_id')
        
        if document_type == 'darta':
            try:
                document = DartaLetter.objects.get(id=document_id, file_id=file_tracker)
                document.file_id = None
                document.save()
                return Response(FileTrackerDetailSerializer(file_tracker).data)
            except DartaLetter.DoesNotExist:
                return Response({'error': 'Darta not found or not linked'}, status=status.HTTP_404_NOT_FOUND)
        elif document_type == 'chalani':
            try:
                document = ChalaniLetter.objects.get(id=document_id, file_id=file_tracker)
                document.file_id = None
                document.save()
                return Response(FileTrackerDetailSerializer(file_tracker).data)
            except ChalaniLetter.DoesNotExist:
                return Response({'error': 'Chalani not found or not linked'}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({'error': 'Invalid document type'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def link_darta(self, request, pk=None):
        """Link a Darta letter to this file (legacy endpoint)."""
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
        """Link a Chalani letter to this file (legacy endpoint)."""
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
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get audit log statistics."""
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        total_today = AuditLog.objects.filter(timestamp__gte=today_start).count()
        document_actions = AuditLog.objects.filter(
            timestamp__gte=today_start,
            module__in=['darta', 'chalani']
        ).count()
        user_logins = AuditLog.objects.filter(
            timestamp__gte=today_start,
            action='login'
        ).count()
        failed_attempts = AuditLog.objects.filter(
            timestamp__gte=today_start,
            action='login_failed'
        ).count()
        
        return Response({
            'total_today': total_today,
            'document_actions': document_actions,
            'user_logins': user_logins,
            'failed_attempts': failed_attempts
        })
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        """Export audit logs as JSON."""
        import json
        from django.http import HttpResponse
        
        # Get filter parameters
        action = request.query_params.get('action')
        module = request.query_params.get('module')
        user_id = request.query_params.get('user_id')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        
        qs = self.get_queryset()
        
        if action:
            qs = qs.filter(action=action)
        if module:
            qs = qs.filter(module=module)
        if user_id:
            qs = qs.filter(user_id=user_id)
        if date_from:
            qs = qs.filter(timestamp__date__gte=date_from)
        if date_to:
            qs = qs.filter(timestamp__date__lte=date_to)
        
        # Limit to last 1000 entries for performance
        logs = qs[:1000]
        
        data = []
        for log in logs:
            data.append({
                'id': str(log.id),
                'user_email': log.user_email,
                'action': log.action,
                'module': log.module,
                'details': log.details,
                'ip_address': log.ip_address,
                'timestamp': log.timestamp.isoformat()
            })
        
        response = HttpResponse(
            json.dumps(data, indent=2),
            content_type='application/json'
        )
        response['Content-Disposition'] = 'attachment; filename="audit_logs.json"'
        return response
