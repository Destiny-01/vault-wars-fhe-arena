import { Button } from "@/components/ui/button";
import { CyberCard } from "@/components/ui/cyber-card";
import MatrixBackground from "@/components/MatrixBackground";
import VaultIcon from "@/components/VaultIcon";
import { Navbar } from "@/components/layout/Navbar";
import { useNavigate } from "react-router-dom";
import vaultHeroImage from "@/assets/vault-hero.jpg";

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      <Navbar />
      <MatrixBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-6xl md:text-8xl font-bold text-primary mb-6 font-mono">
            VAULT WARS
          </h1>
          
          {/* Hero Image */}
          <div className="mb-8">
            <img 
              src={vaultHeroImage} 
              alt="Cyberpunk Vault" 
              className="w-full max-w-2xl mx-auto rounded-lg border border-primary/30 shadow-2xl"
            />
          </div>

          <p className="text-xl text-muted-foreground mb-8 font-mono">
            Breach your rival under encryption
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              onClick={() => navigate("/create-room")}
              size="lg"
              className="cyber-border bg-primary hover:bg-primary/90 text-lg px-8 py-6"
            >
              Create Room
            </Button>
            <Button
              onClick={() => navigate("/join-room")}
              variant="outline"
              size="lg"
              className="cyber-border text-lg px-8 py-6"
            >
              Join Room
            </Button>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-primary mb-8 font-mono">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <CyberCard className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/20 rounded-lg flex items-center justify-center">
                <VaultIcon />
              </div>
              <h3 className="text-lg font-bold text-primary mb-2">Set Your Vault</h3>
              <p className="text-muted-foreground">
                Choose your 4-digit vault code and place your wager
              </p>
            </CyberCard>

            <CyberCard className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-accent/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-lg font-bold text-accent mb-2">Battle Phase</h3>
              <p className="text-muted-foreground">
                Take turns probing each other's encrypted vaults
              </p>
            </CyberCard>

            <CyberCard className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🏆</span>
              </div>
              <h3 className="text-lg font-bold text-green-400 mb-2">Crack & Win</h3>
              <p className="text-muted-foreground">
                First to breach the vault claims the prize
              </p>
            </CyberCard>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-primary/20 bg-background/80 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground font-mono">
                Powered by Zama FHE
              </span>
            </div>
            
            <div className="flex items-center gap-6">
              <a href="#how-it-works" className="text-sm text-primary hover:text-accent transition-colors">
                How it Works
              </a>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:text-accent transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-primary/10 text-center">
            <p className="text-xs text-muted-foreground font-mono">
              © 2024 Vault Wars. Enter the encrypted battleground.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}