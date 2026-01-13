from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkflowStepViewSet, AttachmentViewSet, FileTrackerViewSet, AuditLogViewSet

app_name = 'workflow'

router = DefaultRouter()
router.register(r'steps', WorkflowStepViewSet, basename='step')
router.register(r'attachments', AttachmentViewSet, basename='attachment')
router.register(r'files', FileTrackerViewSet, basename='file')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')

urlpatterns = [
    path('', include(router.urls)),
]
