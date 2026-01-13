from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OfficeViewSet, DesignationViewSet

app_name = 'organization'

router = DefaultRouter()
router.register(r'offices', OfficeViewSet, basename='office')
router.register(r'designations', DesignationViewSet, basename='designation')

urlpatterns = [
    path('', include(router.urls)),
]
