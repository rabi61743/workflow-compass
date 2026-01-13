"""
ViewSets for Paperless-ngx integration.

These endpoints act as a proxy to the Paperless-ngx API, adding WMS-specific
authentication and logging.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import HttpResponse
import logging

from .client import get_paperless_client, PaperlessAPIError
from .serializers import (
    DocumentUploadSerializer, DocumentSearchSerializer,
    PaperlessDocumentSerializer, PaperlessCorrespondentSerializer,
    PaperlessDocumentTypeSerializer, PaperlessTagSerializer,
    BulkEditSerializer, PaperlessStatisticsSerializer
)
from apps.accounts.permissions import IsAdministrator, ReadOnlyForAuditor

logger = logging.getLogger(__name__)


class PaperlessDocumentViewSet(viewsets.ViewSet):
    """
    ViewSet for Paperless-ngx document operations.
    
    Proxies requests to the Paperless-ngx API with WMS authentication.
    """
    permission_classes = [permissions.IsAuthenticated, ReadOnlyForAuditor]
    parser_classes = [MultiPartParser, FormParser]
    
    def list(self, request):
        """List documents from Paperless-ngx."""
        try:
            client = get_paperless_client()
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 25))
            query = request.query_params.get('query')
            correspondent = request.query_params.get('correspondent')
            document_type = request.query_params.get('document_type')
            
            result = client.list_documents(
                page=page,
                page_size=page_size,
                query=query,
                correspondent=int(correspondent) if correspondent else None,
                document_type=int(document_type) if document_type else None
            )
            return Response(result)
        except PaperlessAPIError as e:
            logger.error(f"Paperless API error: {e}")
            return Response(
                {'error': str(e), 'detail': e.detail},
                status=e.status_code or status.HTTP_502_BAD_GATEWAY
            )
    
    def retrieve(self, request, pk=None):
        """Get document details."""
        try:
            client = get_paperless_client()
            result = client.get_document(int(pk))
            return Response(result)
        except PaperlessAPIError as e:
            return Response(
                {'error': str(e)},
                status=e.status_code or status.HTTP_502_BAD_GATEWAY
            )
    
    def create(self, request):
        """Upload a new document to Paperless-ngx."""
        serializer = DocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            client = get_paperless_client()
            file = request.FILES['file']
            
            result = client.create_document(
                file=file,
                title=serializer.validated_data.get('title'),
                correspondent=serializer.validated_data.get('correspondent'),
                document_type=serializer.validated_data.get('document_type'),
                tags=serializer.validated_data.get('tags'),
                created=serializer.validated_data.get('created')
            )
            
            logger.info(f"Document uploaded to Paperless by user {request.user.id}")
            return Response(result, status=status.HTTP_201_CREATED)
        except PaperlessAPIError as e:
            return Response(
                {'error': str(e), 'detail': e.detail},
                status=e.status_code or status.HTTP_502_BAD_GATEWAY
            )
    
    def update(self, request, pk=None):
        """Update document metadata."""
        try:
            client = get_paperless_client()
            result = client.update_document(int(pk), **request.data)
            return Response(result)
        except PaperlessAPIError as e:
            return Response(
                {'error': str(e)},
                status=e.status_code or status.HTTP_502_BAD_GATEWAY
            )
    
    def destroy(self, request, pk=None):
        """Delete a document."""
        try:
            client = get_paperless_client()
            client.delete_document(int(pk))
            logger.info(f"Document {pk} deleted from Paperless by user {request.user.id}")
            return Response(status=status.HTTP_204_NO_CONTENT)
        except PaperlessAPIError as e:
            return Response(
                {'error': str(e)},
                status=e.status_code or status.HTTP_502_BAD_GATEWAY
            )
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download document file."""
        try:
            client = get_paperless_client()
            original = request.query_params.get('original', 'false').lower() == 'true'
            content = client.download_document(int(pk), original=original)
            
            # Get document info for filename
            doc_info = client.get_document(int(pk))
            filename = doc_info.get('original_file_name', f'document_{pk}')
            
            response = HttpResponse(content, content_type='application/octet-stream')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        except PaperlessAPIError as e:
            return Response(
                {'error': str(e)},
                status=e.status_code or status.HTTP_502_BAD_GATEWAY
            )
    
    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        """Get document preview/thumbnail."""
        try:
            client = get_paperless_client()
            content = client.get_document_preview(int(pk))
            return HttpResponse(content, content_type='image/webp')
        except PaperlessAPIError as e:
            return Response(
                {'error': str(e)},
                status=e.status_code or status.HTTP_502_BAD_GATEWAY
            )
    
    @action(detail=True, methods=['get'])
    def metadata(self, request, pk=None):
        """Get document metadata (OCR content, etc)."""
        try:
            client = get_paperless_client()
            result = client.get_document_metadata(int(pk))
            return Response(result)
        except PaperlessAPIError as e:
            return Response(
                {'error': str(e)},
                status=e.status_code or status.HTTP_502_BAD_GATEWAY
            )
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Full-text search across documents."""
        serializer = DocumentSearchSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        
        try:
            client = get_paperless_client()
            result = client.search_documents(
                query=serializer.validated_data['query'],
                page=serializer.validated_data.get('page', 1),
                page_size=serializer.validated_data.get('page_size', 25)
            )
            return Response(result)
        except PaperlessAPIError as e:
            return Response(
                {'error': str(e)},
                status=e.status_code or status.HTTP_502_BAD_GATEWAY
            )
    
    @action(detail=False, methods=['post'])
    def bulk_edit(self, request):
        """Bulk edit documents."""
        serializer = BulkEditSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            client = get_paperless_client()
            result = client.bulk_edit(
                documents=serializer.validated_data['documents'],
                method=serializer.validated_data['method'],
                correspondent=serializer.validated_data.get('correspondent'),
                document_type=serializer.validated_data.get('document_type'),
                tags=serializer.validated_data.get('tags')
            )
            return Response(result)
        except PaperlessAPIError as e:
            return Response(
                {'error': str(e)},
                status=e.status_code or status.HTTP_502_BAD_GATEWAY
            )
    
    @action(detail=False, methods=['post'])
    def bulk_download(self, request):
        """Download multiple documents as archive."""
        documents = request.data.get('documents', [])
        if not documents:
            return Response(
                {'error': 'documents list is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            client = get_paperless_client()
            content = client.bulk_download(documents)
            
            response = HttpResponse(content, content_type='application/zip')
            response['Content-Disposition'] = 'attachment; filename="documents.zip"'
            return response
        except PaperlessAPIError as e:
            return Response(
                {'error': str(e)},
                status=e.status_code or status.HTTP_502_BAD_GATEWAY
            )


class PaperlessCorrespondentViewSet(viewsets.ViewSet):
    """ViewSet for Paperless-ngx correspondent operations."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'destroy']:
            return [IsAdministrator()]
        return [permissions.IsAuthenticated()]
    
    def list(self, request):
        """List correspondents."""
        try:
            client = get_paperless_client()
            result = client.list_correspondents()
            return Response(result)
        except PaperlessAPIError as e:
            return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)
    
    def retrieve(self, request, pk=None):
        """Get correspondent details."""
        try:
            client = get_paperless_client()
            result = client.get_correspondent(int(pk))
            return Response(result)
        except PaperlessAPIError as e:
            return Response({'error': str(e)}, status=e.status_code or status.HTTP_502_BAD_GATEWAY)
    
    def create(self, request):
        """Create a new correspondent."""
        try:
            client = get_paperless_client()
            result = client.create_correspondent(
                name=request.data.get('name'),
                match=request.data.get('match'),
                matching_algorithm=request.data.get('matching_algorithm', 1)
            )
            return Response(result, status=status.HTTP_201_CREATED)
        except PaperlessAPIError as e:
            return Response({'error': str(e)}, status=e.status_code or status.HTTP_502_BAD_GATEWAY)
    
    def update(self, request, pk=None):
        """Update correspondent."""
        try:
            client = get_paperless_client()
            result = client.update_correspondent(int(pk), **request.data)
            return Response(result)
        except PaperlessAPIError as e:
            return Response({'error': str(e)}, status=e.status_code or status.HTTP_502_BAD_GATEWAY)
    
    def destroy(self, request, pk=None):
        """Delete correspondent."""
        try:
            client = get_paperless_client()
            client.delete_correspondent(int(pk))
            return Response(status=status.HTTP_204_NO_CONTENT)
        except PaperlessAPIError as e:
            return Response({'error': str(e)}, status=e.status_code or status.HTTP_502_BAD_GATEWAY)


class PaperlessDocumentTypeViewSet(viewsets.ViewSet):
    """ViewSet for Paperless-ngx document type operations."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'destroy']:
            return [IsAdministrator()]
        return [permissions.IsAuthenticated()]
    
    def list(self, request):
        """List document types."""
        try:
            client = get_paperless_client()
            result = client.list_document_types()
            return Response(result)
        except PaperlessAPIError as e:
            return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)
    
    def retrieve(self, request, pk=None):
        """Get document type details."""
        try:
            client = get_paperless_client()
            result = client.get_document_type(int(pk))
            return Response(result)
        except PaperlessAPIError as e:
            return Response({'error': str(e)}, status=e.status_code or status.HTTP_502_BAD_GATEWAY)
    
    def create(self, request):
        """Create a new document type."""
        try:
            client = get_paperless_client()
            result = client.create_document_type(
                name=request.data.get('name'),
                match=request.data.get('match'),
                matching_algorithm=request.data.get('matching_algorithm', 1)
            )
            return Response(result, status=status.HTTP_201_CREATED)
        except PaperlessAPIError as e:
            return Response({'error': str(e)}, status=e.status_code or status.HTTP_502_BAD_GATEWAY)
    
    def update(self, request, pk=None):
        """Update document type."""
        try:
            client = get_paperless_client()
            result = client.update_document_type(int(pk), **request.data)
            return Response(result)
        except PaperlessAPIError as e:
            return Response({'error': str(e)}, status=e.status_code or status.HTTP_502_BAD_GATEWAY)
    
    def destroy(self, request, pk=None):
        """Delete document type."""
        try:
            client = get_paperless_client()
            client.delete_document_type(int(pk))
            return Response(status=status.HTTP_204_NO_CONTENT)
        except PaperlessAPIError as e:
            return Response({'error': str(e)}, status=e.status_code or status.HTTP_502_BAD_GATEWAY)


class PaperlessTagViewSet(viewsets.ViewSet):
    """ViewSet for Paperless-ngx tag operations."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'destroy']:
            return [IsAdministrator()]
        return [permissions.IsAuthenticated()]
    
    def list(self, request):
        """List tags."""
        try:
            client = get_paperless_client()
            result = client.list_tags()
            return Response(result)
        except PaperlessAPIError as e:
            return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)
    
    def retrieve(self, request, pk=None):
        """Get tag details."""
        try:
            client = get_paperless_client()
            result = client.get_tag(int(pk))
            return Response(result)
        except PaperlessAPIError as e:
            return Response({'error': str(e)}, status=e.status_code or status.HTTP_502_BAD_GATEWAY)
    
    def create(self, request):
        """Create a new tag."""
        try:
            client = get_paperless_client()
            result = client.create_tag(
                name=request.data.get('name'),
                color=request.data.get('color'),
                is_inbox_tag=request.data.get('is_inbox_tag', False)
            )
            return Response(result, status=status.HTTP_201_CREATED)
        except PaperlessAPIError as e:
            return Response({'error': str(e)}, status=e.status_code or status.HTTP_502_BAD_GATEWAY)
    
    def update(self, request, pk=None):
        """Update tag."""
        try:
            client = get_paperless_client()
            result = client.update_tag(int(pk), **request.data)
            return Response(result)
        except PaperlessAPIError as e:
            return Response({'error': str(e)}, status=e.status_code or status.HTTP_502_BAD_GATEWAY)
    
    def destroy(self, request, pk=None):
        """Delete tag."""
        try:
            client = get_paperless_client()
            client.delete_tag(int(pk))
            return Response(status=status.HTTP_204_NO_CONTENT)
        except PaperlessAPIError as e:
            return Response({'error': str(e)}, status=e.status_code or status.HTTP_502_BAD_GATEWAY)


class PaperlessStatsViewSet(viewsets.ViewSet):
    """ViewSet for Paperless-ngx statistics and tasks."""
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get Paperless-ngx statistics."""
        try:
            client = get_paperless_client()
            result = client.get_statistics()
            return Response(result)
        except PaperlessAPIError as e:
            return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)
    
    @action(detail=False, methods=['get'])
    def tasks(self, request):
        """List background tasks."""
        try:
            client = get_paperless_client()
            result = client.list_tasks()
            return Response(result)
        except PaperlessAPIError as e:
            return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)
    
    @action(detail=False, methods=['get'], url_path='tasks/(?P<task_id>[^/.]+)')
    def task_detail(self, request, task_id=None):
        """Get task status."""
        try:
            client = get_paperless_client()
            result = client.get_task(task_id)
            return Response(result)
        except PaperlessAPIError as e:
            return Response({'error': str(e)}, status=e.status_code or status.HTTP_502_BAD_GATEWAY)
