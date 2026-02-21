import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, UserRole } from '@/lib/types';
import { authApi, apiClient } from '@/lib/api';
import { mockUsers } from '@/lib/mock-data';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemoMode: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasPermission: (module: string, action: string) => boolean;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo user lookup by email prefix
function findDemoUser(email: string): User | null {
  const demoUser = mockUsers.find(u => u.email === email);
  if (demoUser) return demoUser;
  // Partial match on prefix
  const prefix = email.split('@')[0];
  return mockUsers.find(u => u.email.startsWith(prefix + '@')) || null;
}

// Transform API user to frontend User type
function transformUser(apiUser: any): User {
  const permissionMap = new Map<string, Set<string>>();
  (apiUser.permissions || []).forEach((p: any) => {
    if (!permissionMap.has(p.module)) {
      permissionMap.set(p.module, new Set());
    }
    permissionMap.get(p.module)!.add(p.action);
  });

  return {
    id: apiUser.id,
    email: apiUser.email,
    name: apiUser.name,
    designation: apiUser.designation || '',
    role: apiUser.roles?.[0] || 'general_staff',
    officeId: apiUser.office || '',
    officeName: apiUser.office_name || '',
    avatar: apiUser.avatar,
    permissions: Array.from(permissionMap.entries()).map(([module, actions]) => ({
      module,
      actions: Array.from(actions) as ('view' | 'create' | 'edit' | 'delete' | 'approve')[],
    })),
    isActive: true,
    createdAt: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check for demo session first
        const demoEmail = localStorage.getItem('wms_demo_user');
        if (demoEmail) {
          const demoUser = findDemoUser(demoEmail);
          if (demoUser) {
            setUser(demoUser);
            setIsDemoMode(true);
            setIsLoading(false);
            return;
          }
        }

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
      // Try real backend first
      const response = await authApi.login({ email, password });
      setUser(transformUser(response.user));
      setIsDemoMode(false);
      return { success: true };
    } catch (error: any) {
      // If network error (backend unreachable), fall back to demo mode
      if (error.message === 'Failed to fetch' || error.status === undefined) {
        const demoUser = findDemoUser(email);
        if (demoUser && password.length >= 4) {
          setUser(demoUser);
          setIsDemoMode(true);
          localStorage.setItem('wms_demo_user', email);
          console.info('Demo mode: Backend unavailable, using mock user');
          return { success: true };
        }
        return {
          success: false,
          error: 'Backend unavailable. Use a demo account (e.g., admin@ntc.net.np) with any 4+ char password.',
        };
      }
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
      if (!isDemoMode) {
        await authApi.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsDemoMode(false);
      localStorage.removeItem('wms_demo_user');
    }
  }, [isDemoMode]);

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
        isDemoMode,
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

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthContext };
