from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, UserRoleViewSet, PermissionViewSet,
    LoginView, LogoutView, CurrentUserView, PasswordResetRequestView
)

app_name = 'accounts'

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'roles', UserRoleViewSet, basename='role')
router.register(r'permissions', PermissionViewSet, basename='permission')

urlpatterns = [
    # Authentication endpoints
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password-reset'),
    
    # User management
    path('', include(router.urls)),
]
