import React, { useState } from 'react';
import { Zap, Lock } from 'lucide-react';
import { CyberButton } from '@/components/ui/cyber-button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ProbeInputProps {
  onSubmit: (digits: string[]) => Promise<void>;
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
  const [selectedDigits, setSelectedDigits] = useState<string[]>(Array(maxSlots).fill(''));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const numberOptions = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

  const handleDigitSelect = (digit: string) => {
    const emptyIndex = selectedDigits.findIndex(d => !d);
    if (emptyIndex !== -1 && !selectedDigits.includes(digit)) {
      const newDigits = [...selectedDigits];
      newDigits[emptyIndex] = digit;
      setSelectedDigits(newDigits);
    }
  };

  const handleDigitRemove = (index: number) => {
    const newDigits = [...selectedDigits];
    newDigits[index] = '';
    setSelectedDigits(newDigits);
  };

  const handleSubmit = async () => {
    if (selectedDigits.some(digit => !digit)) {
      toast({
        title: "Incomplete Probe",
        description: "Select all 4 digits before launching probe",
        variant: "destructive"
      });
      return;
    }

    // Validate no duplicates
    const uniqueDigits = new Set(selectedDigits);
    if (uniqueDigits.size !== 4) {
      toast({
        title: "Invalid Probe",
        description: "Each digit must be unique (no repeating numbers)",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(selectedDigits);
      setSelectedDigits(Array(maxSlots).fill(''));
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

  const isComplete = selectedDigits.every(digit => digit !== '');
  const isDigitAvailable = (digit: string) => !selectedDigits.includes(digit);
  const canSubmit = isComplete && !disabled && !isSubmitting && new Set(selectedDigits).size === 4;

  return (
    <div className={cn("cyber-border rounded-lg p-6 bg-card/50", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Zap className="w-5 h-5 text-accent" />
        <h3 className="font-cyber text-lg text-accent font-semibold">
          {disabled ? "Opponent's Turn" : "Enter Your Probe"}
        </h3>
        {disabled && <Lock className="w-4 h-4 text-muted-foreground animate-pulse" />}
      </div>

      {/* Selected Digits Display */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {selectedDigits.map((digit, index) => (
          <button
            key={index}
            onClick={() => digit && handleDigitRemove(index)}
            disabled={disabled}
            className={cn(
              "aspect-square rounded-lg border-2 flex items-center justify-center text-xl font-mono font-bold transition-all duration-300",
              "hover:scale-105 active:scale-95",
              digit 
                ? "border-accent bg-accent/20 text-accent hover:bg-accent/30" 
                : "border-dashed border-muted-foreground/30 bg-card/20",
              disabled && "opacity-50 cursor-not-allowed hover:scale-100"
            )}
            aria-label={digit ? `Remove ${digit} from slot ${index + 1}` : `Empty slot ${index + 1}`}
          >
            {digit || (
              <span className="text-xl text-muted-foreground">_</span>
            )}
          </button>
        ))}
      </div>

      {/* Number Keypad */}
      {!disabled && (
        <div className="grid grid-cols-5 gap-2 mb-6">
          {numberOptions.map((number) => (
            <CyberButton
              key={number}
              variant="outline"
              size="sm"
              onClick={() => handleDigitSelect(number)}
              disabled={!isDigitAvailable(number) || selectedDigits.every(d => d !== '')}
              className="text-lg h-12 font-mono"
              aria-label={`Select ${number}`}
            >
              {number}
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
            onClick={() => setSelectedDigits(Array(maxSlots).fill(''))}
            disabled={selectedDigits.every(digit => !digit)}
          >
            Clear
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
              Processing...
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
          {selectedDigits.filter(digit => digit).length}/{maxSlots} digits selected
        </span>
      </div>
    </div>
  );
};

export default ProbeInput;