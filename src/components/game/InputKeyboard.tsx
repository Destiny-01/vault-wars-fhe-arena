import { Button } from "@/components/ui/button";
import { Loader2, Timer } from "lucide-react";

interface InputKeyboardProps {
  isPlayerTurn: boolean;
  gameInProgress: boolean;
  selectedDigits: string[];
  turnTimeRemaining: number | null;
  isSubmitting: boolean;
  onDigitSelect: (digit: string) => void;
  onDeleteLast: () => void;
  onClear: () => void;
  onSubmit: () => void;
  canSubmit: boolean;
}

export function InputKeyboard({
  isPlayerTurn,
  gameInProgress,
  selectedDigits,
  turnTimeRemaining,
  isSubmitting,
  onDigitSelect,
  onDeleteLast,
  onClear,
  onSubmit,
  canSubmit,
}: InputKeyboardProps) {
  return (
    <div
      className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 backdrop-blur-sm rounded-lg shadow-2xl p-3 sm:p-4 transition-all duration-300 z-[100] ${
        isPlayerTurn && gameInProgress
          ? "bg-green-500/10 border-2 border-green-500/50 shadow-green-500/30"
          : "bg-background/95 border border-primary/20"
      }`}
    >
      <div className="text-center">
        {/* Turn Status */}
        <div className="mb-2 sm:mb-3">
          {isPlayerTurn ? (
            <div className="flex items-center justify-center gap-2 px-3 sm:px-4 py-1 sm:py-2 rounded-full bg-green-500/20 border border-green-500/40">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 font-mono text-xs sm:text-sm font-bold">
                YOUR TURN
              </span>
              {turnTimeRemaining !== null && (
                <span className="text-green-300 font-mono text-xs ml-2">
                  ({turnTimeRemaining}s)
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 px-3 sm:px-4 py-1 sm:py-2 rounded-full bg-accent/20 border border-accent/40">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
              <span className="text-accent font-mono text-xs sm:text-sm font-bold">
                OPPONENT'S TURN
              </span>
            </div>
          )}
        </div>

        {/* Number Grid */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2 mb-2 sm:mb-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((number) => (
            <Button
              key={number}
              variant="outline"
              size="sm"
              onClick={() => onDigitSelect(number.toString())}
              disabled={
                !isPlayerTurn ||
                !gameInProgress ||
                selectedDigits.includes(number.toString()) ||
                selectedDigits.every((d) => d !== "")
              }
              className={`w-7 h-7 sm:w-8 sm:h-8 text-xs sm:text-sm font-mono cyber-border transition-all ${
                isPlayerTurn
                  ? "bg-primary/5 hover:bg-primary/20 hover:shadow-primary/30 text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  : "bg-muted/5 text-muted-foreground cursor-not-allowed opacity-50"
              }`}
            >
              {number}
            </Button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-1.5 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDeleteLast}
            disabled={
              !isPlayerTurn ||
              !gameInProgress ||
              selectedDigits.every((d) => d === "")
            }
            className={`text-xs font-mono px-2 sm:px-3 py-1 transition-all ${
              isPlayerTurn && gameInProgress
                ? "hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
                : "cursor-not-allowed opacity-50"
            }`}
          >
            Del
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            disabled={
              !isPlayerTurn ||
              !gameInProgress ||
              selectedDigits.every((d) => d === "")
            }
            className={`text-xs font-mono px-2 sm:px-3 py-1 transition-all ${
              isPlayerTurn && gameInProgress
                ? "hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
                : "cursor-not-allowed opacity-50"
            }`}
          >
            Clear
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onSubmit}
            disabled={!canSubmit}
            className={`text-xs font-mono px-3 sm:px-4 py-1 cyber-border transition-all ${
              isPlayerTurn
                ? "bg-primary hover:bg-primary/90 shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              "SUBMIT"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

