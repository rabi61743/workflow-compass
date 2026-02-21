from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    WorkflowStepViewSet, AttachmentViewSet, FileTrackerViewSet, AuditLogViewSet,
    DashboardStatsView, MyTasksView, GlobalSearchView, ReportsView,
    WorkflowActionView, SlaStatusView, NextApproverView, DelegationView
)

app_name = 'workflow'

router = DefaultRouter()
router.register(r'steps', WorkflowStepViewSet, basename='step')
router.register(r'attachments', AttachmentViewSet, basename='attachment')
router.register(r'files', FileTrackerViewSet, basename='file')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')

urlpatterns = [
    # Dashboard & Statistics
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('my-tasks/', MyTasksView.as_view(), name='my-tasks'),
    path('stats/', DashboardStatsView.as_view(), name='stats'),
    
    # Search
    path('search/', GlobalSearchView.as_view(), name='global-search'),
    
    # Reports
    path('reports/', ReportsView.as_view(), name='reports'),
    
    # Workflow Actions
    path('action/', WorkflowActionView.as_view(), name='workflow-action'),
    path('sla-status/<str:document_type>/<uuid:document_id>/', SlaStatusView.as_view(), name='sla-status'),
    path('available-actions/<str:document_type>/<uuid:document_id>/', 
         WorkflowActionView.as_view(), name='available-actions'),
    path('history/<str:document_type>/<uuid:document_id>/', 
         WorkflowStepViewSet.as_view({'get': 'list'}), name='workflow-history'),
    
    # Hierarchy-based routing
    path('next-approver/', NextApproverView.as_view(), name='next-approver'),
    path('delegate/', DelegationView.as_view(), name='delegation'),
    
    # Router URLs
    path('', include(router.urls)),
]
