import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletContextProvider } from "@/contexts/WalletContextProvider";
import { DogeOSWalletProvider } from "@/contexts/DogeOSWalletProvider";
import Index from "./pages/Index";
import TokenListings from "./pages/TokenListings";
import NotFound from "./pages/NotFound";
import StoryGallery from "./pages/StoryGallery";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <WalletContextProvider>
      <DogeOSWalletProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/token-listings" element={<TokenListings />} />
              <Route path="/story-gallery" element={<StoryGallery />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </DogeOSWalletProvider>
    </WalletContextProvider>
  </QueryClientProvider>
);

export default App;
