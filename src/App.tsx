import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import SuperAdminRoute from "@/components/layout/SuperAdminRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Accounts from "./pages/Accounts";
import AccountDetail from "./pages/AccountDetail";
import Contacts from "./pages/Contacts";
import ContactDetail from "./pages/ContactDetail";
import Deals from "./pages/Deals";
import DealDetail from "./pages/DealDetail";
import Interactions from "./pages/Interactions";
import Playbooks from "./pages/Playbooks";
import Admin from "./pages/Admin";
import SuperAdmin from "./pages/SuperAdmin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/accounts" element={<ProtectedRoute><Accounts /></ProtectedRoute>} />
            <Route path="/accounts/:id" element={<ProtectedRoute><AccountDetail /></ProtectedRoute>} />
            <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
            <Route path="/contacts/:id" element={<ProtectedRoute><ContactDetail /></ProtectedRoute>} />
            <Route path="/deals" element={<ProtectedRoute><Deals /></ProtectedRoute>} />
            <Route path="/deals/:id" element={<ProtectedRoute><DealDetail /></ProtectedRoute>} />
            <Route path="/interactions" element={<ProtectedRoute><Interactions /></ProtectedRoute>} />
            <Route path="/playbooks" element={<ProtectedRoute><Playbooks /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="/super-admin" element={<SuperAdminRoute><SuperAdmin /></SuperAdminRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;