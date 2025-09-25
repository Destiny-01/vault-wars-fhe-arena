import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Zap, Target, Signal, Shield, Eye } from "lucide-react";

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed?: () => void;
  showProceedButton?: boolean;
}

export function HowToPlayModal({ isOpen, onClose, onProceed, showProceedButton = false }: HowToPlayModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-card/95 backdrop-blur-sm border-2 cyber-border border-primary/40 shadow-2xl shadow-primary/20">
        <DialogHeader className="relative">
          <DialogTitle className="text-3xl font-bold text-center font-mono tracking-wider text-primary mb-6 animate-fade-in">
            <Zap className="inline-block w-8 h-8 text-yellow-400 mr-2 animate-pulse" />
            How to Breach a Vault
            <Zap className="inline-block w-8 h-8 text-yellow-400 ml-2 animate-pulse" />
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-card/80 hover:bg-primary/20 border border-primary/30"
          >
            <X className="w-4 h-4 text-primary" />
          </Button>
        </DialogHeader>

        <div className="space-y-6 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent">
          {/* Objective */}
          <div className="cyber-border rounded-lg p-4 bg-primary/5 border-primary/20 animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-primary font-mono">OBJECTIVE</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You and your rival each lock a <span className="text-primary font-mono">4-digit secret vault code</span>.
              Your mission: <span className="text-accent font-bold">breach their vault</span> before they crack yours.
            </p>
          </div>

          {/* Turns */}
          <div className="cyber-border rounded-lg p-4 bg-primary/5 border-primary/20 animate-fade-in delay-100">
            <div className="flex items-center gap-2 mb-3">
              <Signal className="w-5 h-5 text-accent" />
              <h3 className="text-lg font-semibold text-accent font-mono">PROBE PROTOCOL</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Players take turns launching a <span className="text-accent font-mono">probe</span> (guessing a 4-digit code).
              After each probe, you'll get <span className="text-primary font-bold">encrypted feedback</span> from the vault's defense system.
            </p>
          </div>

          {/* Feedback Signals */}
          <div className="cyber-border rounded-lg p-4 bg-primary/5 border-primary/20 animate-fade-in delay-200">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-semibold text-yellow-400 font-mono">FEEDBACK SIGNALS</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 rounded bg-green-500/20 border border-green-500/30 text-green-400 shadow-green-500/20 shadow-sm font-mono text-xs font-bold">
                  B
                </span>
                <div>
                  <span className="text-green-400 font-semibold">Breached</span>
                  <span className="text-muted-foreground text-sm ml-2">→ Correct number, correct position</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 rounded bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 shadow-yellow-500/20 shadow-sm font-mono text-xs font-bold">
                  S
                </span>
                <div>
                  <span className="text-yellow-400 font-semibold">Signal Detected</span>
                  <span className="text-muted-foreground text-sm ml-2">→ Correct number, wrong position</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 rounded bg-gray-500/20 border border-gray-500/30 text-gray-400 shadow-gray-500/20 shadow-sm font-mono text-xs font-bold">
                  E
                </span>
                <div>
                  <span className="text-gray-400 font-semibold">Encrypted</span>
                  <span className="text-muted-foreground text-sm ml-2">→ Number not in the vault code</span>
                </div>
              </div>
            </div>
          </div>

          {/* Winning */}
          <div className="cyber-border rounded-lg p-4 bg-green-500/10 border-green-500/20 animate-fade-in delay-300">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold text-green-400 font-mono">WINNING THE BATTLE</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Keep probing until you fully breach all <span className="text-green-400 font-mono">4 digits</span> of your opponent's vault.
              The first to crack the full code <span className="text-green-400 font-bold">wins the wager</span> and secures the vault.
            </p>
          </div>

          {/* Tips */}
          <div className="cyber-border rounded-lg p-4 bg-accent/10 border-accent/20 animate-fade-in delay-400">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-accent" />
              <h3 className="text-lg font-semibold text-accent font-mono">TACTICAL TIPS</h3>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Use the feedback to refine your next probe</li>
              <li>• Track opponent's probes to anticipate their progress</li>
              <li>• Remember: all 4 digits must be unique in your vault code</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3 justify-center pt-4 border-t border-primary/20">
          {showProceedButton && onProceed ? (
            <Button
              onClick={onProceed}
              className="min-w-40 cyber-border bg-primary hover:bg-primary/90 shadow-primary/30 shadow-lg font-mono tracking-wider animate-pulse"
            >
              Got it, let's play!
            </Button>
          ) : null}
          <Button
            variant="outline"
            onClick={onClose}
            className="min-w-32 cyber-border border-primary/30 hover:bg-primary/10 font-mono"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}