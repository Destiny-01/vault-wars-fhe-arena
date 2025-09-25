import React from 'react';
import { Trophy, Skull, ArrowLeft, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CyberButton } from '@/components/ui/cyber-button';
import { cn } from '@/lib/utils';

interface WinLossModalProps {
  isOpen: boolean;
  outcome: 'won' | 'lost';
  winningReason?: string;
  prize: string;
  onReturnHome: () => void;
  onRematch: () => void;
  onClose: () => void;
}

const WinLossModal: React.FC<WinLossModalProps> = ({
  isOpen,
  outcome,
  winningReason,
  prize,
  onReturnHome,
  onRematch,
  onClose
}) => {
  const isWinner = outcome === 'won';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md cyber-border bg-card/95 backdrop-blur-sm border-0">
        {/* Background Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-primary/5 rounded-lg pointer-events-none" />
        
        <div className="relative z-10 text-center py-6">
          {/* Icon */}
          <div className={cn(
            "w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center",
            isWinner 
              ? "bg-neon-green/20 border-2 border-neon-green animate-pulse-glow" 
              : "bg-destructive/20 border-2 border-destructive"
          )}>
            {isWinner ? (
              <Trophy className="w-10 h-10 text-neon-green animate-bounce" />
            ) : (
              <Skull className="w-10 h-10 text-destructive animate-pulse" />
            )}
          </div>

          {/* Title */}
          <h2 className={cn(
            "text-2xl font-cyber font-bold mb-4 text-glow",
            isWinner ? "text-neon-green" : "text-destructive"
          )}>
            {isWinner ? "Vault Breached — You Win!" : "Your Vault Was Breached — You Lose"}
          </h2>

          {/* Reason */}
          {winningReason && (
            <p className="text-sm text-muted-foreground font-mono mb-4">
              {winningReason}
            </p>
          )}

          {/* Prize Display */}
          <div className="cyber-border rounded-lg p-4 mb-6 bg-card/30">
            <div className="text-xs font-mono text-accent mb-1">
              {isWinner ? "VAULT CONTENTS ACQUIRED:" : "VAULT CONTENTS LOST:"}
            </div>
            <div className="text-xl font-cyber font-bold text-primary">
              {prize} ETH
            </div>
          </div>

          {/* Vault Explosion Effect (for winner) */}
          {isWinner && (
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-2 max-w-32 mx-auto">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="aspect-square bg-neon-green/20 border border-neon-green rounded animate-pulse"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="w-full h-full bg-neon-green/10 rounded animate-ping" />
                  </div>
                ))}
              </div>
              <p className="text-xs font-mono text-neon-green mt-2 animate-pulse">
                VAULT BREACHED • ALL BLOCKS COMPROMISED
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <CyberButton
              variant={isWinner ? "success" : "outline"}
              size="lg"
              className="w-full"
              onClick={onRematch}
            >
              <RefreshCw className="w-5 h-5" />
              Play Again
            </CyberButton>

            <CyberButton
              variant="ghost"
              size="lg"
              className="w-full"
              onClick={onReturnHome}
            >
              <ArrowLeft className="w-5 h-5" />
              Return to Home
            </CyberButton>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-primary/20">
            <p className="text-xs text-muted-foreground font-mono">
              Battle complete • Encrypted results verified
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WinLossModal;