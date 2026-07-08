import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ViewModeProvider } from "@/contexts/ViewModeContext";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import SuperAdminRoute from "@/components/layout/SuperAdminRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Accounts from "./pages/Accounts";
import AccountDetail from "./pages/AccountDetail";
import Contacts from "./pages/Contacts";
import ContactDetail from "./pages/ContactDetail";
import Leads from "./pages/Leads";
import LeadDetail from "./pages/LeadDetail";
import Deals from "./pages/Deals";
import DealForm from "./pages/DealForm";
import DealDetail from "./pages/DealDetail";
import Interactions from "./pages/Interactions";
import Playbooks from "./pages/Playbooks";
import PlaybookForm from "./pages/PlaybookForm";
import PlaybookDetail from "./pages/PlaybookDetail";
import Assets from "./pages/Assets";
import AssetForm from "./pages/AssetForm";
import AssetDetail from "./pages/AssetDetail";
import Admin from "./pages/Admin";
import SuperAdmin from "./pages/SuperAdmin";
import HelpCenter from "./pages/HelpCenter";
import Install from "./pages/Install";
import Calendar from "./pages/Calendar";
import Mapping from "./pages/Mapping";
import Research from "./pages/Research";
import SuperiorReport from "./pages/SuperiorReport";
import SocialMedia from "./pages/SocialMedia";
import ContentCalendar from "./pages/social-media/ContentCalendar";
import SMCampaigns from "./pages/social-media/Campaigns";
import SMContentList from "./pages/social-media/ContentList";
import SMAssetLibrary from "./pages/social-media/AssetLibrary";
import NotFound from "./pages/NotFound";
import Quotes from "./pages/Quotes";
import QuoteNew from "./pages/QuoteNew";
import QuoteDetail from "./pages/QuoteDetail";
import QuotePreview from "./pages/QuotePreview";
import ServiceKnowledgePlaybookForm from "./pages/ServiceKnowledgePlaybookForm";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ViewModeProvider>
              <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/accounts" element={<ProtectedRoute><Accounts /></ProtectedRoute>} />
              <Route path="/accounts/:id" element={<ProtectedRoute><AccountDetail /></ProtectedRoute>} />
              <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
              <Route path="/contacts/:id" element={<ProtectedRoute><ContactDetail /></ProtectedRoute>} />
              <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
              <Route path="/leads/:id" element={<ProtectedRoute><LeadDetail /></ProtectedRoute>} />
              <Route path="/deals" element={<ProtectedRoute><Deals /></ProtectedRoute>} />
              <Route path="/deals/new" element={<ProtectedRoute><DealForm /></ProtectedRoute>} />
              <Route path="/deals/:id/edit" element={<ProtectedRoute><DealForm /></ProtectedRoute>} />
              <Route path="/deals/:id" element={<ProtectedRoute><DealDetail /></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
              <Route path="/mapping" element={<ProtectedRoute><Mapping /></ProtectedRoute>} />
              <Route path="/interactions" element={<ProtectedRoute><Interactions /></ProtectedRoute>} />
              <Route path="/playbooks" element={<ProtectedRoute><Playbooks /></ProtectedRoute>} />
              <Route path="/playbooks/new" element={<ProtectedRoute><PlaybookForm /></ProtectedRoute>} />
              <Route path="/playbooks/service-knowledge" element={<ProtectedRoute><ServiceKnowledgePlaybookForm /></ProtectedRoute>} />
              <Route path="/playbooks/:id" element={<ProtectedRoute><PlaybookDetail /></ProtectedRoute>} />
              <Route path="/playbooks/:id/edit" element={<ProtectedRoute><PlaybookForm /></ProtectedRoute>} />
              <Route path="/assets" element={<ProtectedRoute><Assets /></ProtectedRoute>} />
              <Route path="/assets/new" element={<ProtectedRoute><AssetForm /></ProtectedRoute>} />
              <Route path="/assets/:id" element={<ProtectedRoute><AssetDetail /></ProtectedRoute>} />
              <Route path="/assets/:id/edit" element={<ProtectedRoute><AssetForm /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
              <Route path="/super-admin" element={<SuperAdminRoute><SuperAdmin /></SuperAdminRoute>} />
              <Route path="/help" element={<ProtectedRoute><HelpCenter /></ProtectedRoute>} />
              <Route path="/research" element={<ProtectedRoute><Research /></ProtectedRoute>} />
              <Route path="/quotes" element={<ProtectedRoute><Quotes /></ProtectedRoute>} />
              <Route path="/quotes/new" element={<ProtectedRoute><QuoteNew /></ProtectedRoute>} />
              <Route path="/quotes/:id" element={<ProtectedRoute><QuoteDetail /></ProtectedRoute>} />
              <Route path="/quotes/:id/preview" element={<ProtectedRoute><QuotePreview /></ProtectedRoute>} />
              <Route path="/superior/reports/:token" element={<SuperiorReport />} />
              <Route path="/install" element={<Install />} />
              <Route path="/social-media" element={<ProtectedRoute><SocialMedia /></ProtectedRoute>}>
                <Route index element={<ContentCalendar />} />
                <Route path="campaigns" element={<SMCampaigns />} />
                <Route path="content" element={<SMContentList />} />
                <Route path="assets" element={<SMAssetLibrary />} />
              </Route>
              <Route path="*" element={<NotFound />} />
              </Routes>
            </ViewModeProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
