from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DartaLetterViewSet, DocumentTypeViewSet

app_name = 'darta'

router = DefaultRouter()
router.register(r'letters', DartaLetterViewSet, basename='darta')
router.register(r'document-types', DocumentTypeViewSet, basename='document-type')

urlpatterns = [
    path('', include(router.urls)),
]
