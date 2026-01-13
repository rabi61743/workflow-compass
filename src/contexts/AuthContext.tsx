import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, UserRole } from '@/lib/types';
import { authApi, apiClient } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasPermission: (module: string, action: string) => boolean;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Transform API user to frontend User type
function transformUser(apiUser: any): User {
  return {
    id: apiUser.id,
    email: apiUser.email,
    name: apiUser.name,
    designation: apiUser.designation || '',
    role: apiUser.roles?.[0] || 'general_staff',
    officeId: apiUser.office || '',
    officeName: apiUser.office_name || '',
    avatar: apiUser.avatar,
    permissions: (apiUser.permissions || []).map((p: any) => ({
      module: p.module,
      actions: [p.action]
    })),
    isActive: true,
    createdAt: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = apiClient.getAccessToken();
        if (token) {
          const apiUser = await authApi.getCurrentUser();
          if (apiUser) {
            setUser(transformUser(apiUser));
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        apiClient.clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authApi.login({ email, password });
      setUser(transformUser(response.user));
      return { success: true };
    } catch (error: any) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: error.message || 'Invalid email or password' 
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  }, []);

  const hasPermission = useCallback((module: string, action: string) => {
    if (!user) return false;
    const permission = user.permissions.find(p => p.module === module);
    return permission?.actions.includes(action as any) ?? false;
  }, [user]);

  const hasRole = useCallback((roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasPermission,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
