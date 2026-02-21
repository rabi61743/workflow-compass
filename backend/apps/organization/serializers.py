"""
Serializers for organization app.
"""
from rest_framework import serializers
from .models import Office, Designation, UserOfficeAssignment, ReportingStructure


class DesignationSerializer(serializers.ModelSerializer):
    """Serializer for designations."""
    
    class Meta:
        model = Designation
        fields = [
            'id', 'name', 'name_nepali', 'office', 'level',
            'can_approve', 'can_dispatch', 'is_global', 'is_active'
        ]
        read_only_fields = ['id']


class UserOfficeAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for user-office assignments."""
    user_name = serializers.CharField(source='user.name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_avatar = serializers.ImageField(source='user.avatar', read_only=True)
    office_name = serializers.CharField(source='office.name', read_only=True)
    office_code = serializers.CharField(source='office.code', read_only=True)
    office_type = serializers.CharField(source='office.type', read_only=True)
    designation_name = serializers.CharField(source='designation.name', read_only=True, default='')
    reporting_to_name = serializers.CharField(source='reporting_to.name', read_only=True, default='')

    class Meta:
        model = UserOfficeAssignment
        fields = [
            'id', 'user', 'user_name', 'user_email', 'user_avatar',
            'office', 'office_name', 'office_code', 'office_type',
            'designation', 'designation_name',
            'assignment_type', 'is_office_head',
            'reporting_to', 'reporting_to_name',
            'start_date', 'end_date', 'is_active',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ReportingStructureSerializer(serializers.ModelSerializer):
    """Serializer for reporting structures."""
    subordinate_name = serializers.CharField(source='subordinate.name', read_only=True)
    supervisor_name = serializers.CharField(source='supervisor.name', read_only=True)

    class Meta:
        model = ReportingStructure
        fields = [
            'id', 'subordinate', 'subordinate_name',
            'supervisor', 'supervisor_name',
            'is_primary', 'effective_from', 'effective_to',
        ]
        read_only_fields = ['id']


class OfficeListSerializer(serializers.ModelSerializer):
    """Serializer for office list view."""
    head_name = serializers.CharField(source='head.name', read_only=True, default='')
    parent_name = serializers.CharField(source='parent.name', read_only=True, default='')
    employee_count = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Office
        fields = [
            'id', 'code', 'name', 'name_nepali', 'type', 'location',
            'order', 'email', 'phone', 'path', 'depth',
            'parent', 'parent_name', 'head', 'head_name',
            'employee_count', 'member_count', 'is_active',
        ]
    
    def get_employee_count(self, obj):
        return obj.employees.filter(is_active=True).count()

    def get_member_count(self, obj):
        return obj.user_assignments.filter(is_active=True).count()


class OfficeMemberSerializer(serializers.Serializer):
    """Lightweight serializer for office members (for recipient selectors)."""
    id = serializers.UUIDField(source='user.id')
    name = serializers.CharField(source='user.name')
    email = serializers.CharField(source='user.email')
    avatar = serializers.ImageField(source='user.avatar')
    designation_name = serializers.CharField(source='designation.name', default='')
    designation_level = serializers.IntegerField(source='designation.level', default=0)
    assignment_type = serializers.CharField()
    is_office_head = serializers.BooleanField()


class OfficeDetailSerializer(serializers.ModelSerializer):
    """Serializer for office detail view."""
    head_name = serializers.CharField(source='head.name', read_only=True, default='')
    parent_name = serializers.CharField(source='parent.name', read_only=True, default='')
    designations = DesignationSerializer(many=True, read_only=True)
    children = serializers.SerializerMethodField()
    members = serializers.SerializerMethodField()
    ancestors = serializers.SerializerMethodField()
    
    class Meta:
        model = Office
        fields = [
            'id', 'code', 'name', 'name_nepali', 'type', 'location',
            'order', 'email', 'phone', 'path', 'depth',
            'parent', 'parent_name', 'head', 'head_name',
            'designations', 'children', 'members', 'ancestors',
            'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_children(self, obj):
        children = obj.children.filter(is_active=True).order_by('order', 'name')
        return OfficeListSerializer(children, many=True).data
    
    def get_members(self, obj):
        assignments = obj.user_assignments.filter(
            is_active=True
        ).select_related('user', 'designation').order_by('designation__level', 'user__name')
        return OfficeMemberSerializer(assignments, many=True).data

    def get_ancestors(self, obj):
        ancestors = obj.get_ancestors()
        return [{'id': a.id, 'code': a.code, 'name': a.name, 'type': a.type} for a in reversed(ancestors)]


class OfficeCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating offices."""
    
    class Meta:
        model = Office
        fields = [
            'code', 'name', 'name_nepali', 'type', 'location',
            'order', 'email', 'phone',
            'parent', 'head', 'is_active',
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
            if parent == self.instance:
                raise serializers.ValidationError(
                    {'parent': 'Office cannot be its own parent.'}
                )
            if parent in self.instance.get_descendants():
                raise serializers.ValidationError(
                    {'parent': 'Cannot set a child office as parent.'}
                )
        return data


class OfficeTreeSerializer(serializers.ModelSerializer):
    """Serializer for hierarchical office tree."""
    children = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()
    head_name = serializers.CharField(source='head.name', read_only=True, default='')
    
    class Meta:
        model = Office
        fields = [
            'id', 'code', 'name', 'name_nepali', 'type', 'location',
            'depth', 'path', 'head', 'head_name',
            'member_count', 'is_active', 'children',
        ]
    
    def get_children(self, obj):
        children = obj.children.filter(is_active=True).order_by('order', 'name')
        return OfficeTreeSerializer(children, many=True).data

    def get_member_count(self, obj):
        return obj.user_assignments.filter(is_active=True).count()


class RecipientSearchSerializer(serializers.Serializer):
    """Optimized serializer for recipient search results."""
    id = serializers.UUIDField()
    type = serializers.CharField()  # 'user', 'office', 'designation'
    name = serializers.CharField()
    subtitle = serializers.CharField(allow_blank=True)
    office_id = serializers.UUIDField(allow_null=True)
    office_name = serializers.CharField(allow_blank=True)
    office_code = serializers.CharField(allow_blank=True)
    user_id = serializers.UUIDField(allow_null=True)
    designation = serializers.CharField(allow_blank=True)
    is_office_head = serializers.BooleanField(default=False)
