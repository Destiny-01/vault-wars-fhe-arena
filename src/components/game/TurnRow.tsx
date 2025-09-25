import React from 'react';
import { Clock, Zap, Shield, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Guess } from '@/types/game';

interface TurnRowProps {
  turnIndex: number;
  leftGuess?: Guess;
  rightGuess?: Guess;
  side: 'you' | 'opponent';
  className?: string;
}

const TurnRow: React.FC<TurnRowProps> = ({
  turnIndex,
  leftGuess,
  rightGuess,
  side,
  className
}) => {
  const guess = side === 'you' ? leftGuess : rightGuess;

  if (!guess) {
    return (
      <div className={cn("p-4 border border-dashed border-muted-foreground/20 rounded-lg", className)}>
        <div className="text-center text-muted-foreground font-mono text-sm">
          —
        </div>
      </div>
    );
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={cn(
      "cyber-border rounded-lg p-4 bg-card/30 transition-all duration-300 hover:bg-card/40",
      guess.pending && "animate-pulse",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-primary font-bold">
            TURN #{turnIndex}
          </span>
          {guess.pending && (
            <Loader2 className="w-3 h-3 text-accent animate-spin" />
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
          <Clock className="w-3 h-3" />
          {formatTime(guess.timestamp)}
        </div>
      </div>

      {/* Digits */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {guess.digits.map((digit, index) => (
          <div
            key={index}
            className={cn(
              "aspect-square rounded border flex items-center justify-center text-lg font-mono font-bold transition-all duration-300",
              "border-primary/30 bg-primary/10",
              guess.result?.breached && Math.random() > 0.5 && "animate-pulse text-neon-green border-neon-green",
              guess.result?.injured && Math.random() > 0.7 && "animate-pulse text-cyber-blue border-cyber-blue"
            )}
          >
            {digit}
          </div>
        ))}
      </div>

      {/* Results */}
      {guess.pending ? (
        <div className="flex items-center justify-center gap-2 py-2">
          <Loader2 className="w-4 h-4 text-accent animate-spin" />
          <span className="text-sm font-mono text-accent">Awaiting result...</span>
        </div>
      ) : guess.result ? (
        <div className="flex items-center justify-center gap-4">
          {guess.result.breached > 0 && (
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4 text-neon-green" />
              <span className="text-sm font-mono text-neon-green font-bold">
                {guess.result.breached} Breached
              </span>
            </div>
          )}
          {guess.result.injured > 0 && (
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-cyber-blue" />
              <span className="text-sm font-mono text-cyber-blue font-bold">
                {guess.result.injured} Injured
              </span>
            </div>
          )}
          {guess.result.breached === 0 && guess.result.injured === 0 && (
            <span className="text-sm font-mono text-muted-foreground">No match</span>
          )}
        </div>
      ) : null}

      {/* Transaction Hash */}
      {guess.txHash && (
        <div className="mt-2 text-center">
          <span className="text-xs font-mono text-muted-foreground">
            TX: {guess.txHash.slice(0, 10)}...
          </span>
        </div>
      )}
    </div>
  );
};

export default TurnRow;