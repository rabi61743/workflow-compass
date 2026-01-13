from django.urls import path, include
from rest_framework.routers import DefaultRouter

app_name = 'organization'

router = DefaultRouter()
# Viewsets will be registered here

urlpatterns = [
    path('', include(router.urls)),
]
