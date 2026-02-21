// API Client configuration for Django backend
// Configure via VITE_API_URL environment variable or defaults to localhost
import { getDemoResponse } from '../demo-interceptor';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.loadTokens();
  }

  private loadTokens() {
    this.accessToken = localStorage.getItem('wms_access_token');
    this.refreshToken = localStorage.getItem('wms_refresh_token');
  }

  setTokens(access: string, refresh: string) {
    this.accessToken = access;
    this.refreshToken = refresh;
    localStorage.setItem('wms_access_token', access);
    localStorage.setItem('wms_refresh_token', refresh);
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('wms_access_token');
    localStorage.removeItem('wms_refresh_token');
  }

  getAccessToken() {
    return this.accessToken;
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: this.refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        this.accessToken = data.access;
        localStorage.setItem('wms_access_token', data.access);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    this.clearTokens();
    return false;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      let response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      // Handle 401 - try token refresh
      if (response.status === 401 && this.refreshToken) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          headers['Authorization'] = `Bearer ${this.accessToken}`;
          response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers,
          });
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error: ApiError = {
          message: errorData.detail || errorData.message || 'An error occurred',
          status: response.status,
          errors: errorData.errors,
        };
        throw error;
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return { data: null as T, status: 204 };
      }

      const data = await response.json();
      return { data, status: response.status };
    } catch (error: any) {
      // Demo mode fallback: if fetch fails (backend unreachable), return mock data
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        const demoData = getDemoResponse(endpoint, options.method || 'GET');
        if (demoData !== null) {
          return { data: demoData as T, status: 200 };
        }
      }
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async patch<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async uploadFile<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {};
    
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        message: errorData.detail || 'Upload failed',
        status: response.status,
      };
    }

    const data = await response.json();
    return { data, status: response.status };
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export type { ApiResponse, ApiError };
