import React, { useState } from 'react';
import { Zap, Lock } from 'lucide-react';
import { CyberButton } from '@/components/ui/cyber-button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ProbeInputProps {
  onSubmit: (tiles: string[]) => Promise<void>;
  disabled: boolean;
  maxSlots: number;
  className?: string;
}

const ProbeInput: React.FC<ProbeInputProps> = ({
  onSubmit,
  disabled,
  maxSlots = 4,
  className
}) => {
  const [selectedTiles, setSelectedTiles] = useState<string[]>(Array(maxSlots).fill(''));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const vaultOptions = ['🔒', '🔑', '⚡', '🛡️', '💎', '🔥', '❄️', '⭐'];

  const handleTileSelect = (tile: string) => {
    const emptyIndex = selectedTiles.findIndex(t => !t);
    if (emptyIndex !== -1) {
      const newTiles = [...selectedTiles];
      newTiles[emptyIndex] = tile;
      setSelectedTiles(newTiles);
    }
  };

  const handleTileRemove = (index: number) => {
    const newTiles = [...selectedTiles];
    newTiles[index] = '';
    setSelectedTiles(newTiles);
  };

  const handleSubmit = async () => {
    if (selectedTiles.some(tile => !tile)) {
      toast({
        title: "Incomplete Probe",
        description: "Select all 4 tiles before launching probe",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(selectedTiles);
      setSelectedTiles(Array(maxSlots).fill(''));
      toast({
        title: "Probe Launched!",
        description: "Awaiting encrypted result...",
      });
    } catch (error) {
      toast({
        title: "Probe Failed",
        description: "Unable to launch probe. Try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isComplete = selectedTiles.every(tile => tile !== '');
  const canSubmit = isComplete && !disabled && !isSubmitting;

  return (
    <div className={cn("cyber-border rounded-lg p-6 bg-card/50", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Zap className="w-5 h-5 text-accent" />
        <h3 className="font-cyber text-lg text-accent font-semibold">
          {disabled ? "Opponent's Turn" : "Your Turn"}
        </h3>
        {disabled && <Lock className="w-4 h-4 text-muted-foreground animate-pulse" />}
      </div>

      {/* Selected Tiles Display */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {selectedTiles.map((tile, index) => (
          <button
            key={index}
            onClick={() => tile && handleTileRemove(index)}
            disabled={disabled}
            className={cn(
              "aspect-square rounded-lg border-2 flex items-center justify-center text-xl font-bold transition-all duration-300",
              "hover:scale-105 active:scale-95",
              tile 
                ? "border-accent bg-accent/20 text-accent hover:bg-accent/30" 
                : "border-dashed border-muted-foreground/30 bg-card/20",
              disabled && "opacity-50 cursor-not-allowed hover:scale-100"
            )}
            aria-label={tile ? `Remove ${tile} from slot ${index + 1}` : `Empty slot ${index + 1}`}
          >
            {tile || (
              <div className="w-6 h-6 border border-dashed border-muted-foreground/30 rounded" />
            )}
          </button>
        ))}
      </div>

      {/* Tile Options */}
      {!disabled && (
        <div className="grid grid-cols-4 gap-2 mb-6">
          {vaultOptions.map((option, index) => (
            <CyberButton
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleTileSelect(option)}
              disabled={selectedTiles.includes(option) || selectedTiles.every(t => t !== '')}
              className="text-lg h-12"
              aria-label={`Select ${option}`}
            >
              {option}
            </CyberButton>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {!disabled && (
          <CyberButton
            variant="ghost"
            size="sm"
            onClick={() => setSelectedTiles(Array(maxSlots).fill(''))}
            disabled={selectedTiles.every(tile => !tile)}
          >
            Clear All
          </CyberButton>
        )}
        
        <CyberButton
          variant="accent"
          size="lg"
          className="flex-1"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin">⚡</div>
              Encrypting...
            </>
          ) : disabled ? (
            <>
              <Lock className="w-4 h-4" />
              Waiting for opponent...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Launch Probe
            </>
          )}
        </CyberButton>
      </div>

      {/* Status */}
      <div className="mt-4 text-center">
        <span className="text-xs font-mono text-muted-foreground">
          {selectedTiles.filter(tile => tile).length}/{maxSlots} tiles selected
        </span>
      </div>
    </div>
  );
};

export default ProbeInput;