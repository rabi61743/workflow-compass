import { useLocation } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Inbox,
  Send,
  Building2,
  Users,
  FileText,
  Search,
  BarChart3,
  Settings,
  Shield,
  FolderOpen,
} from 'lucide-react';

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  requiredModules?: string[];
}

const mainNavItems: NavItem[] = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Darta (Incoming)', url: '/darta', icon: Inbox, requiredModules: ['darta'] },
  { title: 'Chalani (Outgoing)', url: '/chalani', icon: Send, requiredModules: ['chalani'] },
  { title: 'File Tracking', url: '/files', icon: FolderOpen, requiredModules: ['darta', 'chalani'] },
  { title: 'Search', url: '/search', icon: Search },
];

const adminNavItems: NavItem[] = [
  { title: 'Organization', url: '/organization', icon: Building2, requiredModules: ['offices'] },
  { title: 'Users', url: '/users', icon: Users, requiredModules: ['users'] },
  { title: 'Templates', url: '/templates', icon: FileText },
];

const reportNavItems: NavItem[] = [
  { title: 'Reports', url: '/reports', icon: BarChart3, requiredModules: ['reports'] },
  { title: 'Audit Logs', url: '/audit', icon: Shield, requiredModules: ['audit'] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { hasPermission, hasRole } = useAuth();
  const collapsed = state === 'collapsed';

  const canViewItem = (item: NavItem) => {
    if (!item.requiredModules || item.requiredModules.length === 0) return true;
    return item.requiredModules.some(module => hasPermission(module, 'view'));
  };

  const isAdmin = hasRole(['administrator']);
  const canViewReports = hasPermission('reports', 'view') || hasPermission('audit', 'view');

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold">WMS</span>
              <span className="text-xs text-sidebar-foreground/70">Nepal Telecom</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.filter(canViewItem).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url || location.pathname.startsWith(item.url + '/')}
                    tooltip={item.title}
                  >
                    <NavLink to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavItems.filter(canViewItem).map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.url || location.pathname.startsWith(item.url + '/')}
                      tooltip={item.title}
                    >
                      <NavLink to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Reports Section */}
        {canViewReports && (
          <SidebarGroup>
            <SidebarGroupLabel>Analytics</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {reportNavItems.filter(canViewItem).map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.url || location.pathname.startsWith(item.url + '/')}
                      tooltip={item.title}
                    >
                      <NavLink to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <NavLink to="/settings">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
