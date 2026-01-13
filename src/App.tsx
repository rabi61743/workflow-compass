import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import DartaList from "@/pages/DartaList";
import NewDarta from "@/pages/NewDarta";
import ChalaniList from "@/pages/ChalaniList";
import Organization from "@/pages/Organization";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Protected routes with layout */}
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/darta" element={<DartaList />} />
              <Route path="/darta/new" element={<NewDarta />} />
              <Route path="/chalani" element={<ChalaniList />} />
              <Route path="/organization" element={<Organization />} />
              
              {/* Placeholder routes */}
              <Route path="/files" element={<PlaceholderPage title="File Tracking" />} />
              <Route path="/search" element={<PlaceholderPage title="Search" />} />
              <Route path="/users" element={<PlaceholderPage title="User Management" />} />
              <Route path="/templates" element={<PlaceholderPage title="Templates" />} />
              <Route path="/reports" element={<PlaceholderPage title="Reports" />} />
              <Route path="/audit" element={<PlaceholderPage title="Audit Logs" />} />
              <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
              <Route path="/notifications" element={<PlaceholderPage title="Notifications" />} />
              <Route path="/profile" element={<PlaceholderPage title="Profile" />} />
            </Route>

            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

// Placeholder component for routes not yet built
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      <p className="text-muted-foreground">This module is coming soon.</p>
    </div>
  );
}

export default App;
