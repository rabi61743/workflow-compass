"""
ViewSets for organization app.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q

from .models import Office, Designation, UserOfficeAssignment, ReportingStructure
from .serializers import (
    OfficeListSerializer, OfficeDetailSerializer, OfficeCreateUpdateSerializer,
    OfficeTreeSerializer, DesignationSerializer,
    UserOfficeAssignmentSerializer, ReportingStructureSerializer,
    OfficeMemberSerializer, RecipientSearchSerializer,
)
from apps.accounts.permissions import IsAdministrator, ReadOnlyForAuditor


class OfficeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing offices.
    """
    queryset = Office.objects.select_related('parent', 'head').prefetch_related('children', 'designations')
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['type', 'parent', 'is_active']
    search_fields = ['code', 'name', 'name_nepali', 'location']
    ordering_fields = ['name', 'code', 'order', 'created_at']
    ordering = ['order', 'name']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return OfficeListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return OfficeCreateUpdateSerializer
        elif self.action == 'tree':
            return OfficeTreeSerializer
        return OfficeDetailSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdministrator()]
        return [permissions.IsAuthenticated(), ReadOnlyForAuditor()]
    
    @action(detail=False, methods=['get'])
    def tree(self, request):
        """Get hierarchical office tree starting from root offices."""
        root_offices = Office.objects.filter(
            parent__isnull=True,
            is_active=True
        ).select_related('head').prefetch_related('children', 'user_assignments')
        serializer = OfficeTreeSerializer(root_offices, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """Get all members assigned to this office."""
        office = self.get_object()
        include_children = request.query_params.get('include_children', 'false').lower() == 'true'
        
        if include_children:
            # Get all descendant office IDs
            office_ids = [office.id] + [d.id for d in office.get_descendants()]
            assignments = UserOfficeAssignment.objects.filter(
                office_id__in=office_ids, is_active=True
            ).select_related('user', 'office', 'designation', 'reporting_to')
        else:
            assignments = office.user_assignments.filter(
                is_active=True
            ).select_related('user', 'designation', 'reporting_to')
        
        serializer = UserOfficeAssignmentSerializer(assignments, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def descendants(self, request, pk=None):
        """Get all descendant offices."""
        office = self.get_object()
        descendants = office.get_descendants()
        serializer = OfficeListSerializer(descendants, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def ancestors(self, request, pk=None):
        """Get all ancestor offices."""
        office = self.get_object()
        ancestors = office.get_ancestors()
        serializer = OfficeListSerializer(ancestors, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def search_recipients(self, request):
        """
        Smart search for recipients (users, offices, designations).
        Query params:
        - q: Search term
        - office_id: Filter by office
        - include_children: Include sub-offices
        - type: 'user', 'office', or 'all' (default: 'all')
        - role: Filter by user role
        """
        q = request.query_params.get('q', '').strip()
        office_id = request.query_params.get('office_id')
        include_children = request.query_params.get('include_children', 'false').lower() == 'true'
        result_type = request.query_params.get('type', 'all')
        
        results = []
        
        # Search offices
        if result_type in ('all', 'office'):
            office_qs = Office.objects.filter(is_active=True)
            if q:
                office_qs = office_qs.filter(
                    Q(name__icontains=q) | Q(code__icontains=q) | Q(name_nepali__icontains=q)
                )
            if office_id:
                if include_children:
                    try:
                        parent = Office.objects.get(id=office_id)
                        desc_ids = [d.id for d in parent.get_descendants()]
                        office_qs = office_qs.filter(id__in=desc_ids)
                    except Office.DoesNotExist:
                        office_qs = office_qs.none()
                else:
                    office_qs = office_qs.filter(parent_id=office_id)
            
            for office in office_qs[:20]:
                results.append({
                    'id': office.id,
                    'type': 'office',
                    'name': office.name,
                    'subtitle': f"{office.get_type_display()} • {office.location}" if office.location else office.get_type_display(),
                    'office_id': office.id,
                    'office_name': office.name,
                    'office_code': office.code,
                    'user_id': None,
                    'designation': '',
                    'is_office_head': False,
                })
        
        # Search users (via assignments)
        if result_type in ('all', 'user'):
            assignment_qs = UserOfficeAssignment.objects.filter(
                is_active=True, user__is_active=True
            ).select_related('user', 'office', 'designation')
            
            if q:
                assignment_qs = assignment_qs.filter(
                    Q(user__name__icontains=q) | Q(user__email__icontains=q) |
                    Q(designation__name__icontains=q)
                )
            if office_id:
                if include_children:
                    try:
                        parent = Office.objects.get(id=office_id)
                        office_ids = [office_id] + [str(d.id) for d in parent.get_descendants()]
                        assignment_qs = assignment_qs.filter(office_id__in=office_ids)
                    except Office.DoesNotExist:
                        assignment_qs = assignment_qs.none()
                else:
                    assignment_qs = assignment_qs.filter(office_id=office_id)
            
            seen_users = set()
            for a in assignment_qs[:30]:
                if a.user_id in seen_users:
                    continue
                seen_users.add(a.user_id)
                results.append({
                    'id': a.id,
                    'type': 'user',
                    'name': a.user.name,
                    'subtitle': f"{a.designation.name if a.designation else ''} • {a.office.name}".strip(' •'),
                    'office_id': a.office_id,
                    'office_name': a.office.name,
                    'office_code': a.office.code,
                    'user_id': a.user_id,
                    'designation': a.designation.name if a.designation else '',
                    'is_office_head': a.is_office_head,
                })

        serializer = RecipientSearchSerializer(results, many=True)
        return Response(serializer.data)


class DesignationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing designations."""
    queryset = Designation.objects.select_related('office')
    serializer_class = DesignationSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['office', 'is_active', 'is_global', 'can_approve']
    search_fields = ['name', 'name_nepali']
    ordering_fields = ['level', 'name']
    ordering = ['level', 'name']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdministrator()]
        return [permissions.IsAuthenticated()]


class UserOfficeAssignmentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user-office assignments."""
    queryset = UserOfficeAssignment.objects.select_related(
        'user', 'office', 'designation', 'reporting_to'
    )
    serializer_class = UserOfficeAssignmentSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['user', 'office', 'assignment_type', 'is_active', 'is_office_head']
    search_fields = ['user__name', 'user__email', 'office__name']
    ordering_fields = ['assignment_type', 'created_at']
    ordering = ['assignment_type']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdministrator()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['get'])
    def by_user(self, request):
        """Get all office assignments for a specific user."""
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response(
                {'error': 'user_id query parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        assignments = self.queryset.filter(user_id=user_id, is_active=True)
        serializer = self.get_serializer(assignments, many=True)
        return Response(serializer.data)


class ReportingStructureViewSet(viewsets.ModelViewSet):
    """ViewSet for managing reporting structures."""
    queryset = ReportingStructure.objects.select_related('subordinate', 'supervisor')
    serializer_class = ReportingStructureSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['subordinate', 'supervisor', 'is_primary']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdministrator()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['get'])
    def chain(self, request):
        """Get reporting chain for a user (all supervisors up the chain)."""
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response(
                {'error': 'user_id query parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        chain = []
        visited = set()
        current_id = user_id
        
        while current_id and current_id not in visited:
            visited.add(current_id)
            try:
                rel = ReportingStructure.objects.select_related('supervisor').get(
                    subordinate_id=current_id,
                    is_primary=True,
                    effective_to__isnull=True,
                )
                chain.append({
                    'id': rel.supervisor.id,
                    'name': rel.supervisor.name,
                    'email': rel.supervisor.email,
                })
                current_id = str(rel.supervisor_id)
            except ReportingStructure.DoesNotExist:
                break
        
        return Response(chain)
