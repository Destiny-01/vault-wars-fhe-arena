import React, { useState } from 'react';
import { Clock, ChevronDown, ChevronUp, Zap, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Guess } from '@/types/game';
import { CyberButton } from '@/components/ui/cyber-button';

interface TurnLogProps {
  guesses: Guess[];
  onExpandTurn?: (turnIndex: number) => void;
  className?: string;
}

const TurnLog: React.FC<TurnLogProps> = ({
  guesses,
  onExpandTurn,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedTurns, setExpandedTurns] = useState<Set<number>>(new Set());

  const toggleTurnExpansion = (turnIndex: number) => {
    const newExpanded = new Set(expandedTurns);
    if (newExpanded.has(turnIndex)) {
      newExpanded.delete(turnIndex);
    } else {
      newExpanded.add(turnIndex);
    }
    setExpandedTurns(newExpanded);
    onExpandTurn?.(turnIndex);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Sort guesses by turn index, newest first
  const sortedGuesses = [...guesses].sort((a, b) => b.turnIndex - a.turnIndex);
  const visibleGuesses = isExpanded ? sortedGuesses : sortedGuesses.slice(0, 3);

  if (guesses.length === 0) {
    return (
      <div className={cn("cyber-border rounded-lg p-4 bg-card/30", className)}>
        <div className="text-center text-muted-foreground font-mono text-sm">
          No battle history yet
        </div>
      </div>
    );
  }

  return (
    <div className={cn("cyber-border rounded-lg p-4 bg-card/30", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-cyber text-sm font-semibold text-accent">
          Battle Timeline
        </h3>
        <span className="text-xs font-mono text-muted-foreground">
          {guesses.length} turn{guesses.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        {visibleGuesses.map((guess, index) => (
          <div key={guess.turnIndex}>
            {/* Timeline Entry */}
            <div 
              className={cn(
                "flex items-center justify-between p-2 rounded border transition-all duration-200 cursor-pointer hover:bg-card/40",
                expandedTurns.has(guess.turnIndex) 
                  ? "border-primary/50 bg-primary/10" 
                  : "border-primary/20 bg-card/20"
              )}
              onClick={() => toggleTurnExpansion(guess.turnIndex)}
            >
              <div className="flex items-center gap-3 flex-1">
                {/* Turn Number */}
                <div className="text-xs font-mono text-primary font-bold min-w-fit">
                  #{guess.turnIndex}
                </div>

                {/* Player Action */}
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-sm font-mono text-foreground">
                    Player probe
                  </span>
                  {guess.pending && (
                    <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                  )}
                </div>

                {/* Results */}
                <div className="flex items-center gap-2">
                  {guess.result ? (
                    <>
                      {guess.result.breached > 0 && (
                        <div className="flex items-center gap-1">
                          <Shield className="w-3 h-3 text-neon-green" />
                          <span className="text-xs font-mono text-neon-green">
                            {guess.result.breached}
                          </span>
                        </div>
                      )}
                      {guess.result.injured > 0 && (
                        <div className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-cyber-blue" />
                          <span className="text-xs font-mono text-cyber-blue">
                            {guess.result.injured}
                          </span>
                        </div>
                      )}
                      {guess.result.breached === 0 && guess.result.injured === 0 && (
                        <span className="text-xs font-mono text-muted-foreground">
                          Miss
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-xs font-mono text-accent">
                      Pending...
                    </span>
                  )}
                </div>

                {/* Time */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono min-w-fit">
                  <Clock className="w-3 h-3" />
                  {formatTime(guess.timestamp)}
                </div>

                {/* Expand Icon */}
                {expandedTurns.has(guess.turnIndex) ? (
                  <ChevronUp className="w-4 h-4 text-primary" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Expanded Details */}
            {expandedTurns.has(guess.turnIndex) && (
              <div className="mt-2 p-3 bg-background/50 rounded border border-primary/20 ml-4">
                {/* Digits */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono text-accent">Digits:</span>
                  <div className="flex gap-1">
                    {guess.digits.map((digit, digitIndex) => (
                      <span key={digitIndex} className="text-sm font-mono bg-card/50 px-2 py-1 rounded">
                        {digit}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Transaction Hash */}
                {guess.txHash && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-accent">TX:</span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {guess.txHash}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Show More/Less Button */}
      {sortedGuesses.length > 3 && (
        <div className="mt-4 text-center">
          <CyberButton
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show All ({sortedGuesses.length - 3} more)
              </>
            )}
          </CyberButton>
        </div>
      )}
    </div>
  );
};

export default TurnLog;