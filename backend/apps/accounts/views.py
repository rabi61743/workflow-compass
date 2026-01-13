"""
ViewSets for accounts app.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model, authenticate
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import UserRole, Permission
from .serializers import (
    UserListSerializer, UserDetailSerializer, UserCreateSerializer,
    UserUpdateSerializer, UserRoleSerializer, PermissionSerializer,
    ChangePasswordSerializer, CurrentUserSerializer, LoginSerializer
)
from .permissions import IsAdministrator, IsOwnerOrAdmin

User = get_user_model()


# ============ Authentication Views ============

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT serializer that includes user data in response."""
    
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add user data to response
        user_serializer = CurrentUserSerializer(self.user)
        data['user'] = user_serializer.data
        
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom login view that returns JWT tokens and user data."""
    serializer_class = CustomTokenObtainPairSerializer


class LoginView(APIView):
    """
    User login endpoint.
    
    POST /api/auth/login/
    
    Request:
        {
            "email": "user@example.com",
            "password": "password123"
        }
    
    Response:
        {
            "access": "jwt_access_token",
            "refresh": "jwt_refresh_token",
            "user": { ... user data ... }
        }
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        
        user = authenticate(request, email=email, password=password)
        
        if user is None:
            return Response(
                {'error': 'Invalid email or password'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if not user.is_active:
            return Response(
                {'error': 'Account is deactivated'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': CurrentUserSerializer(user).data
        })


class LogoutView(APIView):
    """
    User logout endpoint.
    
    POST /api/auth/logout/
    
    Optionally blacklists the refresh token.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            # Token might already be blacklisted or invalid
            pass
        
        return Response({'message': 'Successfully logged out'})


class CurrentUserView(APIView):
    """
    Get current authenticated user profile.
    
    GET /api/auth/me/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = CurrentUserSerializer(request.user)
        return Response(serializer.data)
    
    def patch(self, request):
        """Update current user profile."""
        serializer = UserUpdateSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(CurrentUserSerializer(request.user).data)


class PasswordResetRequestView(APIView):
    """Request password reset email."""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response(
                {'error': 'Email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user exists
        try:
            user = User.objects.get(email=email, is_active=True)
            # TODO: Send password reset email
            # For now, just acknowledge the request
        except User.DoesNotExist:
            pass  # Don't reveal if email exists
        
        return Response({
            'message': 'If an account with that email exists, a password reset link has been sent.'
        })


# ============ User Management ViewSet ============


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
