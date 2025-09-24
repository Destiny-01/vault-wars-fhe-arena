import React from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Guess } from '@/types/game';
import TurnRow from './TurnRow';
import { CyberButton } from '@/components/ui/cyber-button';

interface GuessStackProps {
  guesses: Guess[];
  side: 'you' | 'opponent';
  title: string;
  className?: string;
}

const GuessStack: React.FC<GuessStackProps> = ({
  guesses,
  side,
  title,
  className
}) => {
  const scrollToTop = () => {
    document.getElementById(`guess-stack-${side}`)?.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Sort guesses by turn index, newest first
  const sortedGuesses = [...guesses].sort((a, b) => b.turnIndex - a.turnIndex);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-cyber text-lg font-semibold text-glow">
          <span className={side === 'you' ? 'text-primary' : 'text-accent'}>
            {title}
          </span>
        </h3>
        <span className="text-xs font-mono text-muted-foreground">
          {guesses.length} probe{guesses.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Guess List */}
      <div 
        id={`guess-stack-${side}`}
        className="flex-1 space-y-3 overflow-y-auto max-h-96 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-primary/30"
      >
        {sortedGuesses.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted/20 rounded-lg flex items-center justify-center">
              <div className="w-8 h-8 border border-dashed border-muted-foreground/30 rounded" />
            </div>
            <p className="text-sm text-muted-foreground font-mono">
              No probes launched yet
            </p>
          </div>
        ) : (
          sortedGuesses.map((guess) => (
            <TurnRow
              key={guess.turnIndex}
              turnIndex={guess.turnIndex}
              leftGuess={side === 'you' ? guess : undefined}
              rightGuess={side === 'opponent' ? guess : undefined}
              side={side}
            />
          ))
        )}
      </div>

      {/* Scroll to Latest Button */}
      {sortedGuesses.length > 3 && (
        <div className="mt-4">
          <CyberButton
            variant="ghost"
            size="sm"
            onClick={scrollToTop}
            className="w-full"
          >
            <ArrowUp className="w-4 h-4" />
            Scroll to Latest
          </CyberButton>
        </div>
      )}
    </div>
  );
};

export default GuessStack;