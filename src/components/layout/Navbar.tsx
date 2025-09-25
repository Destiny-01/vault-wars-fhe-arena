import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import VaultIcon from "@/components/VaultIcon";
import { WalletButton } from "@/components/wallet/WalletButton";
import { HowToPlayModal } from "@/components/modals/HowToPlayModal";
import { HelpCircle } from "lucide-react";

export function Navbar() {
  const location = useLocation();
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  return (
    <>
      <nav className="border-b border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <VaultIcon />
            <span className="text-xl font-bold text-primary hover:text-primary/80 font-mono tracking-wider">
              VAULT WARS
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6">
              <Button
                variant="ghost"
                onClick={() => setShowHowToPlay(true)}
                className="flex items-center gap-2 text-primary hover:text-primary/80 hover:bg-primary/10 font-mono tracking-wider"
              >
                <HelpCircle className="w-4 h-4" />
                How to Play
              </Button>
            </nav>
            <WalletButton />
          </div>
        </div>
      </nav>

      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
      />
    </>
  );
}