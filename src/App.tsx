import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import DartaList from "@/pages/DartaList";
import NewDarta from "@/pages/NewDarta";
import DartaDetail from "@/pages/DartaDetail";
import ChalaniList from "@/pages/ChalaniList";
import NewChalani from "@/pages/NewChalani";
import ChalaniDetail from "@/pages/ChalaniDetail";
import Organization from "@/pages/Organization";
import UserManagement from "@/pages/UserManagement";
import FileTracking from "@/pages/FileTracking";
import Search from "@/pages/Search";
import Templates from "@/pages/Templates";
import Reports from "@/pages/Reports";
import AuditLogs from "@/pages/AuditLogs";
import Notifications from "@/pages/Notifications";
import Settings from "@/pages/Settings";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/NotFound";

const App = () => {
  return (
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Protected routes with layout */}
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/darta" element={<DartaList />} />
              <Route path="/darta/new" element={<NewDarta />} />
              <Route path="/darta/:id" element={<DartaDetail />} />
              <Route path="/chalani" element={<ChalaniList />} />
              <Route path="/chalani/new" element={<NewChalani />} />
              <Route path="/chalani/:id" element={<ChalaniDetail />} />
              <Route path="/organization" element={<Organization />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/files" element={<FileTracking />} />
              <Route path="/search" element={<Search />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/audit" element={<AuditLogs />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  );
};

export default App;
