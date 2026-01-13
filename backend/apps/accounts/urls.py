from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, UserRoleViewSet, PermissionViewSet

app_name = 'accounts'

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'roles', UserRoleViewSet, basename='role')
router.register(r'permissions', PermissionViewSet, basename='permission')

urlpatterns = [
    path('', include(router.urls)),
]
