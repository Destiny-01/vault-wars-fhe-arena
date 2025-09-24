import React from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VaultDisplayProps {
  isOwner: boolean;
  vaultTiles: string[] | null;
  masked: boolean;
  breachedIndices: number[];
  label: string;
  className?: string;
}

const VaultDisplay: React.FC<VaultDisplayProps> = ({
  isOwner,
  vaultTiles,
  masked,
  breachedIndices,
  label,
  className
}) => {
  const tiles = vaultTiles || ['', '', '', ''];

  return (
    <div className={cn("cyber-border rounded-lg p-6 bg-card/50", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-cyber text-lg text-primary font-semibold text-glow">
          {label}
        </h3>
        <div className="flex items-center gap-2">
          {isOwner ? (
            <Eye className="w-4 h-4 text-neon-green" />
          ) : (
            <EyeOff className="w-4 h-4 text-muted-foreground" />
          )}
          {!isOwner && (
            <Lock className="w-4 h-4 text-accent animate-pulse" />
          )}
        </div>
      </div>

      {/* Vault Grid */}
      <div className="grid grid-cols-2 gap-3">
        {tiles.map((tile, index) => (
          <div
            key={index}
            className={cn(
              "relative aspect-square rounded-lg flex items-center justify-center text-2xl font-bold transition-all duration-300",
              "border-2 bg-card/30",
              breachedIndices.includes(index) 
                ? "border-neon-green bg-neon-green/20 animate-pulse-glow" 
                : "border-primary/30",
              masked && !isOwner && "blur-sm",
              !tile && "border-dashed border-muted-foreground/30"
            )}
          >
            {/* Tile Content */}
            {masked && !isOwner ? (
              <div className="w-8 h-8 rounded bg-muted-foreground/20 animate-pulse" />
            ) : tile ? (
              <span className={cn(
                "transition-all duration-300",
                breachedIndices.includes(index) && "animate-bounce text-neon-green"
              )}>
                {tile}
              </span>
            ) : (
              <div className="w-6 h-6 border border-dashed border-muted-foreground/30 rounded" />
            )}

            {/* Breach Effect */}
            {breachedIndices.includes(index) && (
              <div className="absolute inset-0 bg-neon-green/10 rounded-lg animate-pulse-glow" />
            )}

            {/* Crack Effect for Breached Tiles */}
            {breachedIndices.includes(index) && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="w-full h-0.5 bg-neon-green absolute top-1/2 left-0 opacity-80 animate-pulse" />
                <div className="h-full w-0.5 bg-neon-green absolute left-1/2 top-0 opacity-80 animate-pulse" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Status Indicator */}
      <div className="mt-4 text-center">
        {breachedIndices.length > 0 ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
            <span className="text-xs font-mono text-neon-green">
              {breachedIndices.length} Breached
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-xs font-mono text-primary">
              {isOwner ? "Secured" : "Encrypted"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VaultDisplay;