import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import Galaxy from "@/components/backgrounds/Galaxy";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        {/* Background global sutil */}
        <Galaxy opacity={0.12} maxStars={80} driftSpeed={1.5} />
        <Toaster />
        <Sonner />
        <App />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);
