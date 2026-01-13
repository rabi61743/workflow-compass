"""
ViewSets for organization app.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Office, Designation
from .serializers import (
    OfficeListSerializer, OfficeDetailSerializer, OfficeCreateUpdateSerializer,
    OfficeTreeSerializer, DesignationSerializer
)
from apps.accounts.permissions import IsAdministrator, ReadOnlyForAuditor


class OfficeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing offices.
    
    list: Get all offices
    retrieve: Get office details with employees and children
    create: Create new office (admin only)
    update: Update office (admin only)
    tree: Get hierarchical office tree
    """
    queryset = Office.objects.select_related('parent', 'head').prefetch_related('children', 'designations')
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['type', 'parent', 'is_active']
    search_fields = ['code', 'name', 'location']
    ordering_fields = ['name', 'code', 'created_at']
    ordering = ['name']
    
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
        ).prefetch_related('children')
        serializer = OfficeTreeSerializer(root_offices, many=True)
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


class DesignationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing designations."""
    queryset = Designation.objects.select_related('office')
    serializer_class = DesignationSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['office', 'is_active']
    search_fields = ['name']
    ordering_fields = ['level', 'name']
    ordering = ['level', 'name']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdministrator()]
        return [permissions.IsAuthenticated()]
