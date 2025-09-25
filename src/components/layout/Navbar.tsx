import { WalletButton } from "@/components/wallet/WalletButton";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="border-b border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-xl font-bold text-primary hover:text-primary/80 font-mono"
          >
            VAULT WARS
          </Button>
        </div>

        <div className="flex items-center gap-4">
          {location.pathname !== '/' && (
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-primary"
            >
              Home
            </Button>
          )}
          <WalletButton />
        </div>
      </div>
    </nav>
  );
}