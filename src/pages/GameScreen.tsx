import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import MatrixBackground from "@/components/MatrixBackground";
import { Navbar } from "@/components/layout/Navbar";
import VaultDisplay from "@/components/game/VaultDisplay";
import ProbeInput from "@/components/game/ProbeInput";
import GuessStack from "@/components/game/GuessStack";
import TurnLog from "@/components/game/TurnLog";
import WinLossModal from "@/components/game/WinLossModal";
import PrivacyConsole from "@/components/game/PrivacyConsole";
import { useGameApi } from "@/hooks/useGameApi";
import { useToast } from "@/hooks/use-toast";
import { ResultPosted } from "@/types/game";
import { Home, Settings, Wifi, WifiOff, Loader2 } from "lucide-react";

export default function GameScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Extract room details from URL
  const roomId = searchParams.get('roomId') || '';
  const playerAddress = searchParams.get('playerAddress') || '';
  const opponentAddress = searchParams.get('opponentAddress') || '';
  const wager = searchParams.get('wager') || '';

  const { roomState, loading, submitProbe, onResultPosted } = useGameApi(roomId);

  const [winLossModal, setWinLossModal] = useState<{
    isOpen: boolean;
    outcome?: 'won' | 'lost';
    reason?: string;
  }>({ isOpen: false });
  const [privacyConsoleOpen, setPrivacyConsoleOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  // Listen for result updates
  useEffect(() => {
    const cleanup = onResultPosted((result: ResultPosted) => {
      console.log('Result received:', result);
      
      // Check for win condition (4 breached)
      if (result.signedPlainResult.breached >= 4) {
        setWinLossModal({
          isOpen: true,
          outcome: 'won',
          reason: 'All vault digits breached!'
        });
      }
    });

    return cleanup;
  }, [onResultPosted]);

  // Simulate connection status
  useEffect(() => {
    const interval = setInterval(() => {
      setIsConnected(prev => Math.random() > 0.1 ? true : prev);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleProbeSubmit = async (digits: string[]) => {
    try {
      await submitProbe(digits);
      toast({
        title: "Probe launched!",
        description: "Awaiting result...",
      });
    } catch (error) {
      toast({
        title: "Probe failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReturnHome = () => {
    navigate('/');
  };

  const handleRematch = () => {
    toast({
      title: "Rematch Requested",
      description: "Waiting for opponent response...",
    });
    setWinLossModal({ isOpen: false });
  };

  // Determine game state
  const isPlayerTurn = roomState?.currentTurn === playerAddress;
  
  // Filter guesses - TODO: implement proper filtering by player
  const playerGuesses = roomState?.guesses?.filter(() => true) || [];
  const opponentGuesses = roomState?.guesses?.filter(() => false) || [];
  
  // Calculate breached indices for visual representation
  const breachedIndices = playerGuesses
    .filter(g => g.result?.breached)
    .slice(0, 2)
    .map((_, i) => i);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
        <Navbar />
        <MatrixBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg text-primary font-mono">Loading battle arena...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      <Navbar />
      <MatrixBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6 p-4 bg-card/80 backdrop-blur-sm rounded-lg border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReturnHome}
              >
                <Home className="w-4 h-4 mr-2" />
                Return to Home
              </Button>
              
              <div className="hidden md:block">
                <h1 className="text-lg font-bold text-primary font-mono">Vault Wars</h1>
                <p className="text-xs text-muted-foreground">Breach your rival under encryption</p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm font-mono text-foreground">Room: {roomId}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Wager: {wager} ETH</span>
                <span className={isPlayerTurn ? "text-green-400" : "text-accent"}>
                  {isPlayerTurn ? "Your Turn" : "Opponent's Turn"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPrivacyConsoleOpen(!privacyConsoleOpen)}
              >
                <Settings className="w-4 h-4" />
              </Button>
              
              {isConnected ? (
                <div className="flex items-center gap-1 text-green-400">
                  <Wifi className="w-4 h-4" />
                  <span className="text-xs hidden sm:block">Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-400">
                  <WifiOff className="w-4 h-4" />
                  <span className="text-xs hidden sm:block">Reconnecting...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Game Layout */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Column - Your Side */}
          <div className="lg:col-span-5 space-y-6">
            <VaultDisplay
              isOwner={true}
              vaultDigits={roomState?.playerVault || ['1', '2', '3', '4']}
              masked={false}
              breachedIndices={breachedIndices}
              label="Your Vault"
            />

            <ProbeInput
              onSubmit={handleProbeSubmit}
              disabled={!isPlayerTurn || !isConnected}
              maxSlots={4}
            />

            <div className="hidden lg:block">
              <GuessStack
                guesses={playerGuesses}
                side="you"
                title="Your Guesses"
              />
            </div>
          </div>

          {/* Center Column - Turn Log (Desktop) */}
          <div className="hidden lg:block lg:col-span-2">
            <TurnLog
              guesses={[...playerGuesses, ...opponentGuesses]}
              className="sticky top-6"
            />
          </div>

          {/* Right Column - Opponent Side */}
          <div className="lg:col-span-5 space-y-6">
            <VaultDisplay
              isOwner={false}
              vaultDigits={null}
              masked={true}
              breachedIndices={[]}
              label="Opponent Vault — Encrypted"
            />

            <GuessStack
              guesses={opponentGuesses}
              side="opponent"
              title="Opponent Guesses"
            />
          </div>

          {/* Mobile Layout */}
          <div className="lg:hidden col-span-full space-y-6">
            <GuessStack
              guesses={playerGuesses}
              side="you"
              title="Your Guesses"
            />

            <TurnLog
              guesses={[...playerGuesses, ...opponentGuesses]}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <WinLossModal
        isOpen={winLossModal.isOpen}
        outcome={winLossModal.outcome || 'lost'}
        winningReason={winLossModal.reason}
        prize={wager}
        onReturnHome={handleReturnHome}
        onRematch={handleRematch}
        onClose={() => setWinLossModal({ isOpen: false })}
      />

      <PrivacyConsole
        isOpen={privacyConsoleOpen}
        onToggle={() => setPrivacyConsoleOpen(!privacyConsoleOpen)}
      />
    </div>
  );
}