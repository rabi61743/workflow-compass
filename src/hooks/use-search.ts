// Global Search React Query hooks
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './query-config';
import { searchApi, SearchResult } from '@/lib/api/search';

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

export function useGlobalSearch(params: SearchParams = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.search.results(params.query || '', params.module),
    queryFn: () => searchApi.search(params),
    enabled: enabled && (!!params.query?.trim() || !!params.module || !!params.status || !!params.priority || !!params.date_from || !!params.date_to),
  });
}

export function useQuickSearch(query: string, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.search.all, 'quick', query],
    queryFn: () => searchApi.quickSearch(query),
    enabled: enabled && !!query?.trim() && query.length >= 2,
  });
}

export function useSearchSuggestions(query: string, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.search.all, 'suggestions', query],
    queryFn: () => searchApi.getSuggestions(query),
    enabled: enabled && !!query?.trim() && query.length >= 2,
  });
}
