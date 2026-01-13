"""
URL configuration for Paperless-ngx integration.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    PaperlessDocumentViewSet,
    PaperlessCorrespondentViewSet,
    PaperlessDocumentTypeViewSet,
    PaperlessTagViewSet,
    PaperlessStatsViewSet
)

router = DefaultRouter()
router.register(r'documents', PaperlessDocumentViewSet, basename='paperless-documents')
router.register(r'correspondents', PaperlessCorrespondentViewSet, basename='paperless-correspondents')
router.register(r'document-types', PaperlessDocumentTypeViewSet, basename='paperless-document-types')
router.register(r'tags', PaperlessTagViewSet, basename='paperless-tags')
router.register(r'stats', PaperlessStatsViewSet, basename='paperless-stats')

urlpatterns = [
    path('', include(router.urls)),
]
