import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { RoomMetadata } from "@/contexts/VaultWarsProvider";
import { RoomPhase } from "@/types/game";

interface WaitingForOpponentProps {
  roomId: string;
  roomData: RoomMetadata;
  isRefreshing: boolean;
  onRefresh: () => void;
  onReturnHome: () => void;
  getPhaseText: (phase: RoomPhase) => string;
}

export function WaitingForOpponent({
  roomId,
  roomData,
  isRefreshing,
  onRefresh,
  onReturnHome,
  getPhaseText,
}: WaitingForOpponentProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      <div className="relative z-10 container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto text-center space-y-4 sm:space-y-6">
          <div className="p-6 sm:p-8 bg-card/80 backdrop-blur-sm rounded-lg border border-primary/20 cyber-border shadow-2xl">
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-bold text-primary font-mono tracking-wider">
                  ROOM {roomId}
                </h1>
                <div className="w-24 h-1 bg-gradient-to-r from-primary to-accent mx-auto rounded-full"></div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="text-lg sm:text-xl text-accent font-mono font-semibold">
                  {getPhaseText(roomData.phase)}
                </div>
                <div className="flex items-center justify-center space-x-2 text-primary">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <div
                    className="w-2 h-2 bg-primary rounded-full animate-pulse"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-primary rounded-full animate-pulse"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                  <span className="ml-2 font-mono text-sm sm:text-base">
                    Waiting for opponent to join...
                  </span>
                </div>
                <div className="text-base sm:text-lg text-muted-foreground font-mono">
                  Wager:{" "}
                  <span className="text-primary font-semibold">
                    {roomData?.wager || "0"} ETH
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Button
                  onClick={onRefresh}
                  variant="outline"
                  disabled={isRefreshing}
                  className="cyber-border hover:shadow-primary/30 hover:shadow-lg transition-all text-sm sm:text-base"
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${
                      isRefreshing ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </Button>
                <Button
                  onClick={onReturnHome}
                  variant="outline"
                  className="cyber-border hover:shadow-primary/30 hover:shadow-lg transition-all text-sm sm:text-base"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Return Home
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

