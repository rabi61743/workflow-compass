"""
Serializers for accounts app.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserRole, Permission

User = get_user_model()


class PermissionSerializer(serializers.ModelSerializer):
    """Serializer for user permissions."""
    
    class Meta:
        model = Permission
        fields = ['id', 'module', 'action']
        read_only_fields = ['id']


class UserRoleSerializer(serializers.ModelSerializer):
    """Serializer for user roles."""
    assigned_by_name = serializers.CharField(source='assigned_by.name', read_only=True)
    
    class Meta:
        model = UserRole
        fields = ['id', 'role', 'assigned_at', 'assigned_by', 'assigned_by_name']
        read_only_fields = ['id', 'assigned_at']


class UserListSerializer(serializers.ModelSerializer):
    """Serializer for user list view."""
    office_name = serializers.CharField(source='office.name', read_only=True)
    roles = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'name', 'designation', 'avatar',
            'office', 'office_name', 'roles', 'is_active', 'created_at'
        ]
    
    def get_roles(self, obj):
        return obj.get_roles()


class UserDetailSerializer(serializers.ModelSerializer):
    """Serializer for user detail view."""
    office_name = serializers.CharField(source='office.name', read_only=True)
    user_roles = UserRoleSerializer(many=True, read_only=True)
    permissions = PermissionSerializer(source='module_permissions', many=True, read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'name', 'designation', 'avatar',
            'office', 'office_name', 'user_roles', 'permissions',
            'is_active', 'created_at', 'updated_at', 'last_login'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_login']


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating users."""
    password = serializers.CharField(write_only=True, min_length=8)
    roles = serializers.ListField(
        child=serializers.ChoiceField(choices=[r[0] for r in UserRole.ROLE_CHOICES]),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = User
        fields = ['email', 'name', 'designation', 'office', 'password', 'roles']
    
    def create(self, validated_data):
        roles = validated_data.pop('roles', [])
        password = validated_data.pop('password')
        
        user = User.objects.create_user(password=password, **validated_data)
        
        # Assign roles
        request = self.context.get('request')
        for role in roles:
            UserRole.objects.create(
                user=user,
                role=role,
                assigned_by=request.user if request else None
            )
        
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating users."""
    
    class Meta:
        model = User
        fields = ['name', 'designation', 'office', 'avatar', 'is_active']


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change."""
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value


class CurrentUserSerializer(serializers.ModelSerializer):
    """Serializer for current user profile."""
    office_name = serializers.CharField(source='office.name', read_only=True)
    roles = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'name', 'designation', 'avatar',
            'office', 'office_name', 'roles', 'permissions'
        ]
    
    def get_roles(self, obj):
        return obj.get_roles()
    
    def get_permissions(self, obj):
        return list(obj.module_permissions.values('module', 'action'))


class LoginSerializer(serializers.Serializer):
    """Serializer for login request."""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
