import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import GenerateDocument from "./pages/GenerateDocument";
import SummarizeContract from "./pages/SummarizeContract";
import AnalyzePDF from "./pages/AnalyzePDF";
import History from "./pages/History";
import Plans from "./pages/Plans";
import BuyCredits from "./pages/BuyCredits";
import ContentModule from "./pages/ContentModule";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/gerar"
              element={
                <ProtectedRoute>
                  <GenerateDocument />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/resumir"
              element={
                <ProtectedRoute>
                  <SummarizeContract />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/analisar-pdf"
              element={
                <ProtectedRoute>
                  <AnalyzePDF />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/historico"
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/planos"
              element={
                <ProtectedRoute>
                  <Plans />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/creditos"
              element={
                <ProtectedRoute>
                  <BuyCredits />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/content"
              element={
                <ProtectedRoute>
                  <ContentModule />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
