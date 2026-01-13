"""
Middleware for audit logging.

Automatically logs all write operations (POST, PUT, PATCH, DELETE)
to the AuditLog model for security and compliance purposes.
"""
import json
import logging
from django.utils import timezone
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)


class AuditLogMiddleware(MiddlewareMixin):
    """
    Middleware that logs all mutating API requests to AuditLog.
    
    Logged actions:
    - POST: create
    - PUT/PATCH: update
    - DELETE: delete
    
    Excludes:
    - GET requests (read-only)
    - Authentication endpoints
    - Health check endpoints
    """
    
    EXCLUDED_PATHS = [
        '/api/auth/token/',
        '/api/auth/token/refresh/',
        '/health/',
        '/admin/',
    ]
    
    METHODS_TO_LOG = ['POST', 'PUT', 'PATCH', 'DELETE']
    
    def get_client_ip(self, request):
        """Extract client IP from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def get_action_from_method(self, method: str) -> str:
        """Map HTTP method to action name."""
        mapping = {
            'POST': 'create',
            'PUT': 'update',
            'PATCH': 'update',
            'DELETE': 'delete',
        }
        return mapping.get(method, 'unknown')
    
    def get_module_from_path(self, path: str) -> str:
        """Extract module name from URL path."""
        # /api/darta/123/ -> darta
        parts = path.strip('/').split('/')
        if len(parts) >= 2 and parts[0] == 'api':
            return parts[1]
        return 'unknown'
    
    def should_log(self, request) -> bool:
        """Determine if request should be logged."""
        if request.method not in self.METHODS_TO_LOG:
            return False
        
        for excluded in self.EXCLUDED_PATHS:
            if request.path.startswith(excluded):
                return False
        
        return True
    
    def process_response(self, request, response):
        """Log the request after response is generated."""
        if not self.should_log(request):
            return response
        
        # Only log authenticated requests
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return response
        
        # Only log successful mutations
        if response.status_code >= 400:
            return response
        
        try:
            from apps.workflow.models import AuditLog
            
            # Extract relevant information
            action = self.get_action_from_method(request.method)
            module = self.get_module_from_path(request.path)
            
            # Try to get object ID from URL
            object_id = None
            path_parts = request.path.strip('/').split('/')
            for part in reversed(path_parts):
                if part and not part.startswith('?'):
                    # Check if it looks like a UUID or ID
                    if len(part) >= 8 and part.replace('-', '').isalnum():
                        object_id = part
                        break
            
            # Try to get details from request body
            details = {}
            if request.content_type and 'json' in request.content_type:
                try:
                    body = request.body.decode('utf-8')
                    if body:
                        details = json.loads(body)
                        # Remove sensitive fields
                        sensitive_fields = ['password', 'token', 'secret', 'key']
                        for field in sensitive_fields:
                            if field in details:
                                details[field] = '[REDACTED]'
                except (json.JSONDecodeError, UnicodeDecodeError):
                    pass
            
            # Create audit log entry
            AuditLog.objects.create(
                user=request.user,
                action=f"{action}_{module}",
                module=module,
                object_id=object_id,
                details=details,
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')[:500]
            )
            
        except Exception as e:
            # Don't let audit logging failures break the application
            logger.error(f"Error creating audit log: {e}")
        
        return response


class RequestTimingMiddleware(MiddlewareMixin):
    """
    Middleware to track request processing time.
    
    Adds X-Request-Duration header to responses.
    """
    
    def process_request(self, request):
        """Record request start time."""
        request._start_time = timezone.now()
    
    def process_response(self, request, response):
        """Add duration header to response."""
        if hasattr(request, '_start_time'):
            duration = (timezone.now() - request._start_time).total_seconds()
            response['X-Request-Duration'] = f"{duration:.3f}s"
            
            # Log slow requests
            if duration > 2.0:
                logger.warning(
                    f"Slow request: {request.method} {request.path} took {duration:.3f}s"
                )
        
        return response
