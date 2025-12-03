import { Loader2 } from "lucide-react";
import MatrixBackground from "@/components/MatrixBackground";
import { Navbar } from "@/components/layout/Navbar";

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      <Navbar />
      <MatrixBackground />
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4 sm:space-y-6">
          <div className="relative">
            <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 animate-spin text-primary mx-auto mb-4" />
            <div className="absolute inset-0 w-12 h-12 sm:w-16 sm:h-16 border-2 border-primary/20 rounded-full animate-pulse mx-auto"></div>
          </div>
          <div className="space-y-2">
            <p className="text-lg sm:text-xl text-primary font-mono font-semibold">
              Loading battle arena...
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground font-mono">
              Initializing FHE encryption protocols
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

