// Authentication API service
import { apiClient } from './client';
import { User } from '../types';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  access: string;
  refresh: string;
  user: any; // API user format
}

interface TokenRefreshResponse {
  access: string;
}

export const authApi = {
  async login(credentials: LoginRequest): Promise<{ user: any }> {
    const response = await apiClient.post<LoginResponse>('/auth/login/', credentials);
    const { access, refresh, user } = response.data;
    
    apiClient.setTokens(access, refresh);
    return { user };
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout/');
    } finally {
      apiClient.clearTokens();
    }
  },

  async getCurrentUser(): Promise<any | null> {
    const token = apiClient.getAccessToken();
    if (!token) return null;

    try {
      const response = await apiClient.get<any>('/auth/me/');
      return response.data;
    } catch {
      apiClient.clearTokens();
      return null;
    }
  },

  async refreshToken(refreshToken: string): Promise<string> {
    const response = await apiClient.post<TokenRefreshResponse>('/auth/token/refresh/', {
      refresh: refreshToken,
    });
    return response.data.access;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/change-password/', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  async resetPasswordRequest(email: string): Promise<void> {
    await apiClient.post('/auth/password-reset/', { email });
  },

  async resetPasswordConfirm(token: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/password-reset/confirm/', {
      token,
      new_password: newPassword,
    });
  },
};
