import React from 'react';
import { Lock, Shield, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VaultIconProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'locked' | 'unlocked' | 'cracking' | 'breached';
  animated?: boolean;
  className?: string;
}

const VaultIcon: React.FC<VaultIconProps> = ({ 
  size = 'md', 
  variant = 'locked', 
  animated = true,
  className 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const getIcon = () => {
    switch (variant) {
      case 'unlocked':
        return <Shield className="w-full h-full" />;
      case 'cracking':
        return <Zap className="w-full h-full" />;
      case 'breached':
        return <Shield className="w-full h-full" />;
      default:
        return <Lock className="w-full h-full" />;
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'unlocked':
        return 'text-neon-green glow-success';
      case 'cracking':
        return 'text-accent glow-accent animate-pulse-glow';
      case 'breached':
        return 'text-destructive animate-glitch';
      default:
        return 'text-primary glow-primary';
    }
  };

  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-lg border cyber-border p-2',
        sizeClasses[size],
        getVariantStyles(),
        animated && 'transition-all duration-300',
        className
      )}
    >
      {getIcon()}
      
      {/* Glow effect overlay */}
      <div className="absolute inset-0 rounded-lg bg-current opacity-10 pointer-events-none" />
      
      {/* Animated scanner line for cracking state */}
      {variant === 'cracking' && (
        <div className="absolute inset-0 overflow-hidden rounded-lg">
          <div className="w-full h-0.5 bg-accent animate-[slide-up_2s_ease-in-out_infinite] opacity-80" />
        </div>
      )}
    </div>
  );
};

export default VaultIcon;