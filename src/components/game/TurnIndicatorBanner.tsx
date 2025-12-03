import { Timer } from "lucide-react";

interface TurnIndicatorBannerProps {
  isPlayerTurn: boolean;
  gameInProgress: boolean;
  turnTimeRemaining: number | null;
}

export function TurnIndicatorBanner({
  isPlayerTurn,
  gameInProgress,
  turnTimeRemaining,
}: TurnIndicatorBannerProps) {
  if (!gameInProgress) return null;

  return (
    <div
      className={`mb-6 p-3 sm:p-4 rounded-lg border-2 shadow-2xl transition-all duration-300 ${
        isPlayerTurn
          ? "bg-green-500/20 border-green-500/50 shadow-green-500/30"
          : "bg-accent/20 border-accent/50 shadow-accent/30"
      }`}
    >
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        <div
          className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full animate-pulse ${
            isPlayerTurn ? "bg-green-400" : "bg-accent"
          }`}
        />
        <div className="flex items-center gap-2 sm:gap-3">
          <span
            className={`text-lg sm:text-2xl font-mono font-bold tracking-wider ${
              isPlayerTurn
                ? "text-green-400 drop-shadow-[0_0_10px_rgb(34,197,94)]"
                : "text-accent drop-shadow-[0_0_10px_rgb(255,0,255)]"
            }`}
          >
            {isPlayerTurn ? "YOUR TURN" : "OPPONENT'S TURN"}
          </span>
          {isPlayerTurn && turnTimeRemaining !== null && (
            <div
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 rounded-full border text-xs sm:text-sm font-mono font-bold ${
                turnTimeRemaining <= 10
                  ? "bg-red-500/30 border-red-500/60 text-red-300 animate-pulse"
                  : turnTimeRemaining <= 30
                  ? "bg-yellow-500/30 border-yellow-500/60 text-yellow-300"
                  : "bg-primary/30 border-primary/60 text-primary"
              }`}
            >
              <Timer className="w-3 h-3 sm:w-4 sm:h-4" />
              {turnTimeRemaining}s
            </div>
          )}
        </div>
        <div
          className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full animate-pulse ${
            isPlayerTurn ? "bg-green-400" : "bg-accent"
          }`}
        />
      </div>
    </div>
  );
}

