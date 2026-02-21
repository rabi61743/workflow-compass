from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OfficeViewSet, DesignationViewSet,
    UserOfficeAssignmentViewSet, ReportingStructureViewSet,
)

app_name = 'organization'

router = DefaultRouter()
router.register(r'offices', OfficeViewSet, basename='office')
router.register(r'designations', DesignationViewSet, basename='designation')
router.register(r'assignments', UserOfficeAssignmentViewSet, basename='assignment')
router.register(r'reporting', ReportingStructureViewSet, basename='reporting')

urlpatterns = [
    path('', include(router.urls)),
]
