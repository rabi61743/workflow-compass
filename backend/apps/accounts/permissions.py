"""
Custom permissions for role-based access control.
"""
from rest_framework import permissions


class IsAdministrator(permissions.BasePermission):
    """Only administrators can access."""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.has_role('administrator')


class IsClerk(permissions.BasePermission):
    """Only clerks/registrars can access."""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.has_role('clerk')


class IsDepartmentOfficer(permissions.BasePermission):
    """Only department officers can access."""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.has_role('department_officer')


class IsApprovingAuthority(permissions.BasePermission):
    """Only approving authorities can access."""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.has_role('approving_authority')


class IsAuditor(permissions.BasePermission):
    """Only auditors can access."""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.has_role('auditor')


class HasModulePermission(permissions.BasePermission):
    """
    Check if user has permission for specific module action.
    View must define `module_name` attribute.
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        module = getattr(view, 'module_name', None)
        if not module:
            return True
        
        # Map HTTP methods to actions
        action_map = {
            'GET': 'view',
            'HEAD': 'view',
            'OPTIONS': 'view',
            'POST': 'create',
            'PUT': 'edit',
            'PATCH': 'edit',
            'DELETE': 'delete',
        }
        
        action = action_map.get(request.method)
        if not action:
            return False
        
        # Check permission
        return request.user.module_permissions.filter(
            module=module,
            action=action
        ).exists()


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Object-level permission to only allow owners or admins to edit.
    """
    
    def has_object_permission(self, request, view, obj):
        # Read permissions for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Admins can do anything
        if request.user.has_role('administrator'):
            return True
        
        # Check if user is owner
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        return False


class CanApprove(permissions.BasePermission):
    """Permission for approval actions."""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Check for approve permission on the module
        module = getattr(view, 'module_name', None)
        if module:
            return request.user.module_permissions.filter(
                module=module,
                action='approve'
            ).exists()
        
        # Or check for approving authority role
        return request.user.has_role('approving_authority')


class ReadOnlyForAuditor(permissions.BasePermission):
    """
    Auditors can only view, not modify.
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if request.user.has_role('auditor'):
            return request.method in permissions.SAFE_METHODS
        
        return True
