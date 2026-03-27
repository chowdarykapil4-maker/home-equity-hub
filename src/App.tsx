import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Renovations from "./pages/Renovations";
import PropertyProfile from "./pages/PropertyProfile";
import Mortgage from "./pages/Mortgage";
import ValueHistory from "./pages/ValueHistory";
import Financing from "./pages/Financing";
import HomePL from "./pages/HomePL";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppProvider>
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/renovations" element={<Renovations />} />
              <Route path="/mortgage" element={<Mortgage />} />
              <Route path="/value-history" element={<ValueHistory />} />
              <Route path="/financing" element={<Financing />} />
              <Route path="/property" element={<PropertyProfile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
