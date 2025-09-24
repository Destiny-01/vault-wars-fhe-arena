import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Zap, Github, ExternalLink } from 'lucide-react';
import { CyberButton } from '@/components/ui/cyber-button';
import MatrixBackground from '@/components/MatrixBackground';
import VaultIcon from '@/components/VaultIcon';
import vaultHero from '@/assets/vault-hero.jpg';

const Index = () => {
  return (
    <div className="min-h-screen matrix-bg relative">
      <MatrixBackground />
      
      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-6xl mx-auto text-center">
          {/* Main Title */}
          <div className="mb-8 animate-fade-in">
            <h1 
              className="text-6xl md:text-8xl font-cyber font-bold text-glitch mb-4"
              data-text="VAULT WARS"
            >
              VAULT WARS
            </h1>
            <div className="w-32 h-1 bg-gradient-to-r from-primary via-accent to-neon-green mx-auto rounded-full animate-pulse-glow" />
          </div>

          {/* Hero Image */}
          <div className="mb-8 animate-fade-in delay-300">
            <div className="relative max-w-4xl mx-auto">
              <img 
                src={vaultHero} 
                alt="Cyberpunk Vault Lock"
                className="w-full h-auto rounded-xl border border-primary/30 glow-primary"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent rounded-xl" />
            </div>
          </div>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-foreground/80 mb-12 font-mono animate-fade-in delay-500">
            Battle for the vault. Breach your rival under encryption.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16 animate-fade-in delay-700">
            <Link to="/create-room">
              <CyberButton size="lg" className="w-full sm:w-auto min-w-48">
                <Shield className="w-5 h-5" />
                Create a Room
              </CyberButton>
            </Link>
            
            <Link to="/join-room">
              <CyberButton variant="accent" size="lg" className="w-full sm:w-auto min-w-48">
                <Zap className="w-5 h-5" />
                Join a Room
              </CyberButton>
            </Link>
          </div>

          {/* Vault Icons Demo */}
          <div className="flex justify-center items-center gap-8 mb-16 animate-fade-in delay-1000">
            <VaultIcon variant="locked" size="lg" />
            <div className="text-accent text-2xl animate-pulse">VS</div>
            <VaultIcon variant="cracking" size="lg" />
          </div>

          {/* How it Works Section */}
          <section id="how-it-works" className="max-w-4xl mx-auto mb-16 animate-fade-in delay-1200">
            <h2 className="text-3xl font-cyber font-bold text-primary mb-8 text-glow">
              How It Works
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/20 rounded-lg flex items-center justify-center cyber-border">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-mono font-semibold text-primary mb-2">Set Your Vault</h3>
                <p className="text-muted-foreground">Choose your 4-element vault code and place your wager</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-accent/20 rounded-lg flex items-center justify-center cyber-border">
                  <Zap className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-lg font-mono font-semibold text-accent mb-2">Battle Phase</h3>
                <p className="text-muted-foreground">Take turns probing each other's encrypted vaults</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-neon-green/20 rounded-lg flex items-center justify-center cyber-border">
                  <ExternalLink className="w-8 h-8 text-neon-green" />
                </div>
                <h3 className="text-lg font-mono font-semibold text-neon-green mb-2">Crack & Win</h3>
                <p className="text-muted-foreground">First to breach the vault claims the prize</p>
              </div>
            </div>
          </section>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-primary/20 bg-card/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-8">
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
                className="flex items-center gap-2 text-sm text-primary hover:text-accent transition-colors"
              >
                <Github className="w-4 h-4" />
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
};

export default Index;