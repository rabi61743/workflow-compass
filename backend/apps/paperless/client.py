"""
Paperless-ngx API Client.

This module provides a Python client for interacting with the Paperless-ngx REST API.
Server: http://10.26.204.149:7000
"""
import requests
from typing import Optional, Dict, Any, List, BinaryIO
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class PaperlessClient:
    """
    HTTP Client for Paperless-ngx API.
    
    API Documentation: /api/schema/?format=json
    """
    
    def __init__(self, base_url: str = None, token: str = None, timeout: int = 30):
        self.base_url = (base_url or settings.PAPERLESS_NGX.get('BASE_URL', '')).rstrip('/')
        self.token = token or settings.PAPERLESS_NGX.get('API_TOKEN', '')
        self.timeout = timeout or settings.PAPERLESS_NGX.get('TIMEOUT', 30)
        self.session = requests.Session()
        
        if self.token:
            self.session.headers.update({
                'Authorization': f'Token {self.token}'
            })
    
    def _make_request(
        self, 
        method: str, 
        endpoint: str, 
        params: Dict = None, 
        data: Dict = None, 
        files: Dict = None,
        json_data: Dict = None
    ) -> Dict[str, Any]:
        """Make HTTP request to Paperless-ngx API."""
        url = f"{self.base_url}/api/{endpoint.lstrip('/')}"
        
        try:
            response = self.session.request(
                method=method,
                url=url,
                params=params,
                data=data,
                files=files,
                json=json_data,
                timeout=self.timeout
            )
            response.raise_for_status()
            
            if response.content:
                return response.json()
            return {'success': True}
            
        except requests.exceptions.HTTPError as e:
            logger.error(f"Paperless API HTTP error: {e}")
            raise PaperlessAPIError(f"HTTP error: {e}", response=e.response)
        except requests.exceptions.ConnectionError as e:
            logger.error(f"Paperless API connection error: {e}")
            raise PaperlessAPIError(f"Connection error: {e}")
        except requests.exceptions.Timeout as e:
            logger.error(f"Paperless API timeout: {e}")
            raise PaperlessAPIError(f"Request timeout: {e}")
        except requests.exceptions.RequestException as e:
            logger.error(f"Paperless API error: {e}")
            raise PaperlessAPIError(f"Request failed: {e}")
    
    # ============ Documents ============
    
    def list_documents(
        self, 
        page: int = 1, 
        page_size: int = 25,
        query: str = None,
        correspondent: int = None,
        document_type: int = None,
        tags__id__all: List[int] = None,
        ordering: str = None
    ) -> Dict[str, Any]:
        """
        List documents with optional filtering.
        
        GET /api/documents/
        """
        params = {
            'page': page,
            'page_size': page_size,
        }
        if query:
            params['query'] = query
        if correspondent:
            params['correspondent__id'] = correspondent
        if document_type:
            params['document_type__id'] = document_type
        if tags__id__all:
            params['tags__id__all'] = ','.join(map(str, tags__id__all))
        if ordering:
            params['ordering'] = ordering
            
        return self._make_request('GET', 'documents/', params=params)
    
    def get_document(self, document_id: int) -> Dict[str, Any]:
        """
        Get document metadata.
        
        GET /api/documents/{id}/
        """
        return self._make_request('GET', f'documents/{document_id}/')
    
    def create_document(
        self,
        file: BinaryIO,
        title: str = None,
        correspondent: int = None,
        document_type: int = None,
        tags: List[int] = None,
        archive_serial_number: int = None,
        created: str = None
    ) -> Dict[str, Any]:
        """
        Upload a new document.
        
        POST /api/documents/post_document/
        
        The document will be consumed asynchronously by Paperless-ngx.
        Returns task_id for tracking consumption status.
        """
        files = {'document': file}
        data = {}
        
        if title:
            data['title'] = title
        if correspondent:
            data['correspondent'] = correspondent
        if document_type:
            data['document_type'] = document_type
        if tags:
            data['tags'] = tags
        if archive_serial_number:
            data['archive_serial_number'] = archive_serial_number
        if created:
            data['created'] = created
            
        return self._make_request('POST', 'documents/post_document/', data=data, files=files)
    
    def update_document(self, document_id: int, **kwargs) -> Dict[str, Any]:
        """
        Update document metadata.
        
        PATCH /api/documents/{id}/
        """
        return self._make_request('PATCH', f'documents/{document_id}/', json_data=kwargs)
    
    def delete_document(self, document_id: int) -> Dict[str, Any]:
        """
        Delete a document.
        
        DELETE /api/documents/{id}/
        """
        return self._make_request('DELETE', f'documents/{document_id}/')
    
    def download_document(self, document_id: int, original: bool = False) -> bytes:
        """
        Download document file.
        
        GET /api/documents/{id}/download/
        GET /api/documents/{id}/original/ (for original file)
        """
        endpoint = f'documents/{document_id}/{"original" if original else "download"}/'
        url = f"{self.base_url}/api/{endpoint}"
        
        response = self.session.get(url, timeout=self.timeout)
        response.raise_for_status()
        return response.content
    
    def get_document_preview(self, document_id: int) -> bytes:
        """
        Get document preview/thumbnail.
        
        GET /api/documents/{id}/preview/
        """
        url = f"{self.base_url}/api/documents/{document_id}/preview/"
        response = self.session.get(url, timeout=self.timeout)
        response.raise_for_status()
        return response.content
    
    def get_document_metadata(self, document_id: int) -> Dict[str, Any]:
        """
        Get document metadata (OCR content, etc).
        
        GET /api/documents/{id}/metadata/
        """
        return self._make_request('GET', f'documents/{document_id}/metadata/')
    
    def search_documents(self, query: str, page: int = 1, page_size: int = 25) -> Dict[str, Any]:
        """
        Full-text search across documents.
        
        GET /api/documents/?query={query}
        """
        return self.list_documents(page=page, page_size=page_size, query=query)
    
    # ============ Correspondents ============
    
    def list_correspondents(self, page: int = 1, page_size: int = 100) -> Dict[str, Any]:
        """
        List correspondents (senders/receivers).
        
        GET /api/correspondents/
        """
        return self._make_request('GET', 'correspondents/', params={'page': page, 'page_size': page_size})
    
    def get_correspondent(self, correspondent_id: int) -> Dict[str, Any]:
        """Get correspondent by ID."""
        return self._make_request('GET', f'correspondents/{correspondent_id}/')
    
    def create_correspondent(self, name: str, match: str = None, matching_algorithm: int = 1) -> Dict[str, Any]:
        """
        Create a new correspondent.
        
        POST /api/correspondents/
        """
        data = {'name': name}
        if match:
            data['match'] = match
            data['matching_algorithm'] = matching_algorithm
        return self._make_request('POST', 'correspondents/', json_data=data)
    
    def update_correspondent(self, correspondent_id: int, **kwargs) -> Dict[str, Any]:
        """Update correspondent."""
        return self._make_request('PATCH', f'correspondents/{correspondent_id}/', json_data=kwargs)
    
    def delete_correspondent(self, correspondent_id: int) -> Dict[str, Any]:
        """Delete correspondent."""
        return self._make_request('DELETE', f'correspondents/{correspondent_id}/')
    
    # ============ Document Types ============
    
    def list_document_types(self, page: int = 1, page_size: int = 100) -> Dict[str, Any]:
        """
        List document types.
        
        GET /api/document_types/
        """
        return self._make_request('GET', 'document_types/', params={'page': page, 'page_size': page_size})
    
    def get_document_type(self, doc_type_id: int) -> Dict[str, Any]:
        """Get document type by ID."""
        return self._make_request('GET', f'document_types/{doc_type_id}/')
    
    def create_document_type(self, name: str, match: str = None, matching_algorithm: int = 1) -> Dict[str, Any]:
        """Create a new document type."""
        data = {'name': name}
        if match:
            data['match'] = match
            data['matching_algorithm'] = matching_algorithm
        return self._make_request('POST', 'document_types/', json_data=data)
    
    def update_document_type(self, doc_type_id: int, **kwargs) -> Dict[str, Any]:
        """Update document type."""
        return self._make_request('PATCH', f'document_types/{doc_type_id}/', json_data=kwargs)
    
    def delete_document_type(self, doc_type_id: int) -> Dict[str, Any]:
        """Delete document type."""
        return self._make_request('DELETE', f'document_types/{doc_type_id}/')
    
    # ============ Tags ============
    
    def list_tags(self, page: int = 1, page_size: int = 100) -> Dict[str, Any]:
        """
        List tags.
        
        GET /api/tags/
        """
        return self._make_request('GET', 'tags/', params={'page': page, 'page_size': page_size})
    
    def get_tag(self, tag_id: int) -> Dict[str, Any]:
        """Get tag by ID."""
        return self._make_request('GET', f'tags/{tag_id}/')
    
    def create_tag(self, name: str, color: str = None, is_inbox_tag: bool = False) -> Dict[str, Any]:
        """Create a new tag."""
        data = {'name': name, 'is_inbox_tag': is_inbox_tag}
        if color:
            data['color'] = color
        return self._make_request('POST', 'tags/', json_data=data)
    
    def update_tag(self, tag_id: int, **kwargs) -> Dict[str, Any]:
        """Update tag."""
        return self._make_request('PATCH', f'tags/{tag_id}/', json_data=kwargs)
    
    def delete_tag(self, tag_id: int) -> Dict[str, Any]:
        """Delete tag."""
        return self._make_request('DELETE', f'tags/{tag_id}/')
    
    # ============ Storage Paths ============
    
    def list_storage_paths(self, page: int = 1, page_size: int = 100) -> Dict[str, Any]:
        """List storage paths."""
        return self._make_request('GET', 'storage_paths/', params={'page': page, 'page_size': page_size})
    
    def create_storage_path(self, name: str, path: str) -> Dict[str, Any]:
        """Create a new storage path."""
        return self._make_request('POST', 'storage_paths/', json_data={'name': name, 'path': path})
    
    # ============ Tasks ============
    
    def list_tasks(self) -> Dict[str, Any]:
        """
        List background tasks (document consumption, etc).
        
        GET /api/tasks/
        """
        return self._make_request('GET', 'tasks/')
    
    def get_task(self, task_id: str) -> Dict[str, Any]:
        """Get task status."""
        return self._make_request('GET', f'tasks/{task_id}/')
    
    # ============ Saved Views ============
    
    def list_saved_views(self) -> Dict[str, Any]:
        """List saved views/filters."""
        return self._make_request('GET', 'saved_views/')
    
    def create_saved_view(self, name: str, filter_rules: List[Dict], sort_field: str = None) -> Dict[str, Any]:
        """Create a saved view."""
        data = {'name': name, 'filter_rules': filter_rules}
        if sort_field:
            data['sort_field'] = sort_field
        return self._make_request('POST', 'saved_views/', json_data=data)
    
    # ============ Statistics ============
    
    def get_statistics(self) -> Dict[str, Any]:
        """
        Get document statistics.
        
        GET /api/statistics/
        """
        return self._make_request('GET', 'statistics/')
    
    # ============ UI Settings ============
    
    def get_ui_settings(self) -> Dict[str, Any]:
        """Get UI settings."""
        return self._make_request('GET', 'ui_settings/')
    
    def update_ui_settings(self, settings: Dict[str, Any]) -> Dict[str, Any]:
        """Update UI settings."""
        return self._make_request('POST', 'ui_settings/', json_data=settings)
    
    # ============ Logs ============
    
    def list_logs(self, page: int = 1, page_size: int = 25) -> Dict[str, Any]:
        """List system logs."""
        return self._make_request('GET', 'logs/', params={'page': page, 'page_size': page_size})
    
    # ============ Bulk Operations ============
    
    def bulk_edit(
        self, 
        documents: List[int], 
        method: str,
        correspondent: int = None,
        document_type: int = None,
        tags: List[int] = None,
        owner: int = None
    ) -> Dict[str, Any]:
        """
        Bulk edit documents.
        
        POST /api/documents/bulk_edit/
        
        Methods: 
        - set_correspondent
        - set_document_type
        - add_tag
        - remove_tag
        - modify_tags
        - set_permissions
        - delete
        """
        data = {
            'documents': documents,
            'method': method,
        }
        if correspondent is not None:
            data['correspondent'] = correspondent
        if document_type is not None:
            data['document_type'] = document_type
        if tags:
            data['tags'] = tags
        if owner is not None:
            data['owner'] = owner
            
        return self._make_request('POST', 'documents/bulk_edit/', json_data=data)
    
    def bulk_download(self, documents: List[int], compression: str = 'zip') -> bytes:
        """
        Download multiple documents as archive.
        
        POST /api/documents/bulk_download/
        """
        url = f"{self.base_url}/api/documents/bulk_download/"
        response = self.session.post(
            url, 
            json={'documents': documents, 'compression': compression},
            timeout=self.timeout * 2  # Double timeout for bulk downloads
        )
        response.raise_for_status()
        return response.content


class PaperlessAPIError(Exception):
    """Custom exception for Paperless API errors."""
    
    def __init__(self, message: str, response: requests.Response = None):
        super().__init__(message)
        self.response = response
        self.status_code = response.status_code if response else None
        self.detail = None
        
        if response is not None:
            try:
                self.detail = response.json()
            except:
                self.detail = response.text


# Singleton instance using settings
def get_paperless_client() -> PaperlessClient:
    """Get configured Paperless client instance."""
    return PaperlessClient()
