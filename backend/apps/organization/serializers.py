"""
Serializers for organization app.
"""
from rest_framework import serializers
from .models import Office, Designation


class DesignationSerializer(serializers.ModelSerializer):
    """Serializer for designations."""
    
    class Meta:
        model = Designation
        fields = ['id', 'name', 'name_nepali', 'office', 'level', 'is_active']
        read_only_fields = ['id']


class OfficeListSerializer(serializers.ModelSerializer):
    """Serializer for office list view."""
    head_name = serializers.CharField(source='head.name', read_only=True)
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    employee_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Office
        fields = [
            'id', 'code', 'name', 'name_nepali', 'type', 'location',
            'parent', 'parent_name', 'head', 'head_name',
            'employee_count', 'is_active'
        ]
    
    def get_employee_count(self, obj):
        return obj.employees.filter(is_active=True).count()


class OfficeDetailSerializer(serializers.ModelSerializer):
    """Serializer for office detail view."""
    head_name = serializers.CharField(source='head.name', read_only=True)
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    designations = DesignationSerializer(many=True, read_only=True)
    children = serializers.SerializerMethodField()
    employees = serializers.SerializerMethodField()
    
    class Meta:
        model = Office
        fields = [
            'id', 'code', 'name', 'name_nepali', 'type', 'location',
            'parent', 'parent_name', 'head', 'head_name',
            'designations', 'children', 'employees',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_children(self, obj):
        children = obj.children.filter(is_active=True)
        return OfficeListSerializer(children, many=True).data
    
    def get_employees(self, obj):
        from apps.accounts.serializers import UserListSerializer
        employees = obj.employees.filter(is_active=True)[:10]
        return UserListSerializer(employees, many=True).data


class OfficeCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating offices."""
    
    class Meta:
        model = Office
        fields = [
            'code', 'name', 'name_nepali', 'type', 'location',
            'parent', 'head', 'is_active'
        ]
    
    def validate_code(self, value):
        """Ensure code is unique."""
        instance = self.instance
        if Office.objects.filter(code=value).exclude(pk=instance.pk if instance else None).exists():
            raise serializers.ValidationError('Office code already exists.')
        return value
    
    def validate(self, data):
        """Validate parent-child relationship."""
        parent = data.get('parent')
        if parent and self.instance:
            # Prevent circular reference
            if parent == self.instance:
                raise serializers.ValidationError(
                    {'parent': 'Office cannot be its own parent.'}
                )
            # Check if parent is a descendant
            if parent in self.instance.get_descendants():
                raise serializers.ValidationError(
                    {'parent': 'Cannot set a child office as parent.'}
                )
        return data


class OfficeTreeSerializer(serializers.ModelSerializer):
    """Serializer for hierarchical office tree."""
    children = serializers.SerializerMethodField()
    
    class Meta:
        model = Office
        fields = ['id', 'code', 'name', 'type', 'is_active', 'children']
    
    def get_children(self, obj):
        children = obj.children.filter(is_active=True)
        return OfficeTreeSerializer(children, many=True).data
