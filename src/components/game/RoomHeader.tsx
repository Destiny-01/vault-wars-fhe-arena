import { Button } from "@/components/ui/button";
import { Copy, RefreshCw, HelpCircle, AlertTriangle, X, Timer } from "lucide-react";
import { RoomPhase } from "@/types/game";
import { RoomMetadata } from "@/contexts/VaultWarsProvider";

interface RoomHeaderProps {
  roomId: string;
  roomData: RoomMetadata;
  isPlayerTurn: boolean;
  turnTimeRemaining: number | null;
  canClaimTimeout: boolean;
  timeoutWarning: boolean;
  isRefreshing: boolean;
  address: string | undefined;
  onRefresh: () => void;
  onCopyLink: () => void;
  onShowHelp: () => void;
  onCancelRoom: () => void;
  onClaimTimeout: () => void;
  getPhaseText: (phase: RoomPhase) => string;
}

export function RoomHeader({
  roomId,
  roomData,
  isPlayerTurn,
  turnTimeRemaining,
  canClaimTimeout,
  timeoutWarning,
  isRefreshing,
  address,
  onRefresh,
  onCopyLink,
  onShowHelp,
  onCancelRoom,
  onClaimTimeout,
  getPhaseText,
}: RoomHeaderProps) {
  return (
    <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-card/80 backdrop-blur-sm rounded-lg border border-primary/20 cyber-border shadow-2xl">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary font-mono tracking-wider">
            VAULT ROOM {roomId}
          </h1>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <span className="text-accent font-mono font-semibold">WAGER:</span>
              <span className="text-primary font-mono font-bold">
                {roomData.wager} ETH
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-accent font-mono font-semibold">STATUS:</span>
              <span className="text-primary font-mono font-bold">
                {getPhaseText(roomData.phase)}
              </span>
            </div>
            {isPlayerTurn && turnTimeRemaining !== null && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 font-mono font-semibold text-xs sm:text-sm">
                  YOUR TURN
                </span>
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded border font-mono text-xs font-bold ${
                    turnTimeRemaining <= 10
                      ? "bg-red-500/20 border-red-500/50 text-red-400 animate-pulse"
                      : turnTimeRemaining <= 30
                      ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-400"
                      : "bg-primary/20 border-primary/50 text-primary"
                  }`}
                >
                  <Timer className="w-3 h-3" />
                  {turnTimeRemaining}s
                </div>
              </div>
            )}
            {canClaimTimeout && (
              <Button
                onClick={onClaimTimeout}
                variant="default"
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white shadow-red-600/30 shadow-lg text-xs"
              >
                <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Claim Timeout
              </Button>
            )}
            {timeoutWarning && !canClaimTimeout && (
              <div className="flex items-center gap-2 px-2 sm:px-3 py-1 rounded bg-yellow-500/20 border border-yellow-500/50">
                <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                <span className="text-xs text-yellow-400 font-mono font-semibold">
                  Opponent timeout soon
                </span>
              </div>
            )}
            {roomData.phase === RoomPhase.WAITING_FOR_JOIN &&
              address?.toLowerCase() === roomData.creator.toLowerCase() && (
                <Button
                  onClick={onCancelRoom}
                  variant="outline"
                  size="sm"
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10 text-xs"
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Cancel Room
                </Button>
              )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1 sm:gap-2 cyber-border hover:shadow-primary/30 hover:shadow-lg transition-all text-xs sm:text-sm"
          >
            <RefreshCw
              className={`w-3 h-3 sm:w-4 sm:h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onCopyLink}
            className="flex items-center gap-1 sm:gap-2 cyber-border hover:shadow-primary/30 hover:shadow-lg transition-all text-xs sm:text-sm"
          >
            <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Copy Link</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onShowHelp}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-primary/30 bg-primary/10 hover:bg-primary/20 hover:shadow-primary/30 hover:shadow-lg transition-all"
          >
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </Button>
        </div>
      </div>
    </div>
  );
}

