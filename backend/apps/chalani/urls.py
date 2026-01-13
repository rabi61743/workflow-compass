from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChalaniLetterViewSet, LetterTemplateViewSet

app_name = 'chalani'

router = DefaultRouter()
router.register(r'letters', ChalaniLetterViewSet, basename='chalani')
router.register(r'templates', LetterTemplateViewSet, basename='template')

urlpatterns = [
    path('', include(router.urls)),
]
