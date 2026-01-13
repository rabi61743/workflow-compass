"""
ViewSets for accounts app.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import UserRole, Permission
from .serializers import (
    UserListSerializer, UserDetailSerializer, UserCreateSerializer,
    UserUpdateSerializer, UserRoleSerializer, PermissionSerializer,
    ChangePasswordSerializer, CurrentUserSerializer
)
from .permissions import IsAdministrator, IsOwnerOrAdmin

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing users.
    
    list: Get all users (admin only)
    retrieve: Get user details
    create: Create new user (admin only)
    update: Update user (admin only)
    destroy: Deactivate user (admin only)
    """
    queryset = User.objects.select_related('office').prefetch_related('user_roles')
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['office', 'is_active']
    search_fields = ['email', 'name', 'designation']
    ordering_fields = ['name', 'created_at', 'email']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return UserListSerializer
        elif self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserDetailSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [IsAdministrator()]
        elif self.action in ['update', 'partial_update']:
            return [IsOwnerOrAdmin()]
        return [permissions.IsAuthenticated()]
    
    def destroy(self, request, *args, **kwargs):
        """Soft delete - deactivate instead of delete."""
        user = self.get_object()
        user.is_active = False
        user.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=['get', 'patch'])
    def me(self, request):
        """Get or update current user profile."""
        if request.method == 'GET':
            serializer = CurrentUserSerializer(request.user)
            return Response(serializer.data)
        else:
            serializer = UserUpdateSerializer(
                request.user,
                data=request.data,
                partial=True
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(CurrentUserSerializer(request.user).data)
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """Change current user password."""
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({'message': 'Password changed successfully.'})
    
    @action(detail=True, methods=['get'])
    def roles(self, request, pk=None):
        """Get user roles."""
        user = self.get_object()
        roles = user.user_roles.all()
        serializer = UserRoleSerializer(roles, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdministrator])
    def assign_role(self, request, pk=None):
        """Assign a role to user."""
        user = self.get_object()
        role = request.data.get('role')
        
        if role not in dict(UserRole.ROLE_CHOICES):
            return Response(
                {'error': 'Invalid role'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user_role, created = UserRole.objects.get_or_create(
            user=user,
            role=role,
            defaults={'assigned_by': request.user}
        )
        
        if not created:
            return Response(
                {'error': 'User already has this role'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response(UserRoleSerializer(user_role).data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['delete'], permission_classes=[IsAdministrator])
    def remove_role(self, request, pk=None):
        """Remove a role from user."""
        user = self.get_object()
        role = request.data.get('role')
        
        deleted, _ = UserRole.objects.filter(user=user, role=role).delete()
        
        if not deleted:
            return Response(
                {'error': 'User does not have this role'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserRoleViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user roles (admin only)."""
    queryset = UserRole.objects.select_related('user', 'assigned_by')
    serializer_class = UserRoleSerializer
    permission_classes = [IsAdministrator]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['user', 'role']


class PermissionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user permissions (admin only)."""
    queryset = Permission.objects.select_related('user')
    serializer_class = PermissionSerializer
    permission_classes = [IsAdministrator]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['user', 'module', 'action']
