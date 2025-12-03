import { Guess } from "@/contexts/VaultWarsProvider";
import { Loader2 } from "lucide-react";

interface ProbeSectionProps {
  title: string;
  guesses: Guess[];
  isActive: boolean;
  isPlayerTurn: boolean;
  gameInProgress: boolean;
  selectedDigits: string[];
  isEncrypting: boolean;
  isDecrypting: boolean;
  emptyMessage: string;
  emptyIcon: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
}

export function ProbeSection({
  title,
  guesses,
  isActive,
  isPlayerTurn,
  gameInProgress,
  selectedDigits,
  isEncrypting,
  isDecrypting,
  emptyMessage,
  emptyIcon,
  borderColor,
  bgColor,
  textColor,
}: ProbeSectionProps) {
  const isPrimary = textColor === "text-primary";
  const isAccent = textColor === "text-accent";
  
  return (
    <div
      className={`space-y-4 sm:space-y-6 transition-all duration-300 ${
        isActive
          ? isPrimary
            ? "ring-2 ring-green-500/50 rounded-lg p-2 bg-green-500/5"
            : "ring-2 ring-accent/50 rounded-lg p-2 bg-accent/5"
          : ""
      }`}
    >
      <div
        className={`flex items-center justify-between p-3 sm:p-4 rounded-lg border transition-all duration-300 ${
          isActive
            ? isPrimary
              ? "bg-green-500/10 border-green-500/40 shadow-green-500/20 shadow-lg"
              : "bg-accent/10 border-accent/40 shadow-accent/20 shadow-lg"
            : isPrimary
            ? "bg-primary/5 border-primary/20"
            : "bg-accent/5 border-accent/20"
        }`}
      >
        <h2 className={`text-lg sm:text-xl font-bold ${textColor} font-mono tracking-wider`}>
          {title}
        </h2>
        {isActive && (
          <div className={`flex items-center gap-2 px-2 sm:px-3 py-1 rounded-full ${
            isPrimary ? "bg-green-500/20 border-green-500/40" : "bg-accent/20 border-accent/40"
          }`}>
            <div className={`w-2 h-2 ${textColor.replace("text-", "")} rounded-full animate-pulse`} style={{
              backgroundColor: isPrimary ? "rgb(34, 197, 94)" : "rgb(255, 0, 255)"
            }}></div>
            <span className={`text-xs sm:text-sm ${textColor} font-mono font-semibold`}>
              {isPlayerTurn ? "YOUR TURN" : "OPPONENT'S TURN"}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Previous Probes */}
        <div className="space-y-2 sm:space-y-3 max-h-60 sm:max-h-80 overflow-y-auto pr-2">
          {guesses.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-muted-foreground font-mono text-sm sm:text-base">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-primary/30 flex items-center justify-center">
                <span className="text-xl sm:text-2xl">{emptyIcon}</span>
              </div>
              <p>{emptyMessage}</p>
            </div>
          ) : (
            guesses.map((guess) => (
              <div
                key={guess.turnIndex}
                className={`cyber-border rounded-lg p-3 sm:p-4 bg-card/40 ${borderColor}/30 shadow-lg hover:shadow-${textColor}/20 transition-all`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-2 sm:gap-3">
                    {guess.digits.map((digit, index) => (
                    <div
                      key={index}
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded border ${
                        isPrimary ? "border-primary/30 bg-primary/10" : "border-accent/30 bg-accent/10"
                      } flex items-center justify-center font-mono font-bold text-base sm:text-lg ${textColor}`}
                    >
                        {digit}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-1 sm:gap-2 text-xs sm:text-sm font-mono">
                    {guess.result && (
                      <>
                        <span
                          className={`px-2 sm:px-3 py-1 rounded-full border font-semibold transition-all duration-300 ${
                            guess.result.breached > 0
                              ? "bg-green-500/20 border-green-500/40 text-green-400 shadow-green-500/20 shadow-sm animate-pulse-breach"
                              : "bg-green-500/10 border-green-500/20 text-green-400/50"
                          }`}
                        >
                          B:{guess.result.breached}
                        </span>
                        <span
                          className={`px-2 sm:px-3 py-1 rounded-full border font-semibold transition-all duration-300 ${
                            guess.result.injured > 0
                              ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-400 shadow-yellow-500/20 shadow-sm"
                              : "bg-yellow-500/10 border-yellow-500/20 text-yellow-400/50"
                          }`}
                        >
                          S:{guess.result.injured}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Active Input Row */}
        {isPlayerTurn && (
          <div
            className={`cyber-border rounded-lg p-4 sm:p-6 transition-all duration-300 relative overflow-hidden ${
              isPlayerTurn && gameInProgress
                ? `${bgColor}/10 ${borderColor}/50 shadow-${textColor}/30 shadow-lg`
                : "bg-card/20 border-muted/30"
            } ${
              isPlayerTurn && gameInProgress && !isEncrypting && !isDecrypting
                ? "animate-pulse-subtle"
                : ""
            }`}
            style={{
              boxShadow:
                isPlayerTurn && gameInProgress
                  ? `0 0 20px rgba(var(--primary), 0.3), inset 0 0 20px rgba(var(--primary), 0.1)`
                  : undefined,
            }}
          >
            {isPlayerTurn && gameInProgress && (
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 animate-shimmer opacity-50" />
            )}

            <div className="flex items-center justify-between relative z-10">
              <div className="flex gap-2 sm:gap-3">
                {selectedDigits.map((digit, index) => (
                  <div
                    key={index}
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded border border-dashed flex items-center justify-center font-mono font-bold text-base sm:text-lg transition-all duration-200 ${
                      isPlayerTurn && gameInProgress
                        ? "border-primary/60 bg-primary/10 text-primary hover:border-primary/80 hover:bg-primary/20 hover:scale-110 hover:shadow-lg hover:shadow-primary/50"
                        : "border-muted/40 bg-muted/10 text-muted-foreground"
                    } ${
                      digit && isPlayerTurn && gameInProgress
                        ? "animate-bounce-subtle"
                        : ""
                    }`}
                    style={{
                      animationDelay: `${index * 0.1}s`,
                    }}
                  >
                    {digit || "•"}
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-end gap-1">
                {isEncrypting && (
                  <div className="flex items-center gap-2 text-xs text-primary font-mono">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Encrypting...</span>
                  </div>
                )}
                {isDecrypting && (
                  <div className="flex items-center gap-2 text-xs text-accent font-mono">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Decrypting...</span>
                  </div>
                )}
                <div className="text-xs sm:text-sm font-mono font-semibold">
                  {isPlayerTurn && gameInProgress ? (
                    <span className="text-primary animate-pulse">READY TO PROBE</span>
                  ) : (
                    <span className="text-accent animate-pulse">OPPONENT PROBING...</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

