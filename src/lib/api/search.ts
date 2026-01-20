// Global Search API service
import { apiClient } from './client';

export interface SearchResult {
  id: string;
  type: 'darta' | 'chalani' | 'file';
  number: string;
  subject: string;
  date: string;
  status: string;
  priority: string;
  party: string;
  partyOrg: string;
}

interface SearchParams {
  query?: string;
  module?: 'all' | 'darta' | 'chalani' | 'file';
  status?: string;
  priority?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Transform backend data to frontend format
const transformSearchResult = (data: any): SearchResult => ({
  id: data.id,
  type: data.type || data.document_type,
  number: data.number || data.darta_number || data.chalani_number || data.file_number,
  subject: data.subject || data.title,
  date: data.date || data.received_date || data.created_at,
  status: data.status,
  priority: data.priority || 'normal',
  party: data.party || data.sender_name || data.receiver_name || '',
  partyOrg: data.party_org || data.sender_org || data.receiver_org || '',
});

export const searchApi = {
  async search(params: SearchParams = {}): Promise<PaginatedResponse<SearchResult>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        queryParams.append(key, String(value));
      }
    });
    
    const endpoint = `/workflow/search/?${queryParams.toString()}`;
    const response = await apiClient.get<PaginatedResponse<any>>(endpoint);
    return {
      ...response.data,
      results: response.data.results.map(transformSearchResult),
    };
  },

  async quickSearch(query: string): Promise<SearchResult[]> {
    const response = await apiClient.get<any[]>(`/workflow/search/quick/?q=${encodeURIComponent(query)}`);
    return response.data.map(transformSearchResult);
  },

  async getSuggestions(query: string): Promise<string[]> {
    const response = await apiClient.get<string[]>(`/workflow/search/suggestions/?q=${encodeURIComponent(query)}`);
    return response.data;
  },
};
