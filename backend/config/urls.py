"""
URL configuration for WMS project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


def health_check(request):
    """Simple health check endpoint for Docker and load balancers."""
    return JsonResponse({
        'status': 'healthy',
        'service': 'wms-backend',
        'version': '1.0.0'
    })


urlpatterns = [
    # Health check (must be before auth)
    path('api/health/', health_check, name='health_check'),
    
    path('admin/', admin.site.urls),
    
    # JWT Authentication
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/', include('apps.accounts.urls')),
    
    # App APIs
    path('api/accounts/', include('apps.accounts.urls')),
    path('api/organization/', include('apps.organization.urls')),
    path('api/darta/', include('apps.darta.urls')),
    path('api/chalani/', include('apps.chalani.urls')),
    path('api/workflow/', include('apps.workflow.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/paperless/', include('apps.paperless.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
