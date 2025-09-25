import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Users, Coins, Wifi, WifiOff } from 'lucide-react';
import { CyberButton } from '@/components/ui/cyber-button';
import MatrixBackground from '@/components/MatrixBackground';
import VaultDisplay from '@/components/game/VaultDisplay';
import ProbeInput from '@/components/game/ProbeInput';
import GuessStack from '@/components/game/GuessStack';
import TurnLog from '@/components/game/TurnLog';
import WinLossModal from '@/components/game/WinLossModal';
import PrivacyConsole from '@/components/game/PrivacyConsole';
import { useGameApi } from '@/hooks/useGameApi';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const GameScreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const roomId = searchParams.get('roomId') || 'DEMO-ROOM';
  const playerAddress = searchParams.get('player') || '0x1234...5678';
  const opponentAddress = searchParams.get('opponent') || '0x8765...4321';
  const wager = searchParams.get('wager') || '0.1';
  
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
    const cleanup = onResultPosted((result) => {
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
      const txHash = await submitProbe(digits);
      console.log('Probe submitted:', txHash);
    } catch (error) {
      console.error('Probe submission failed:', error);
      throw error;
    }
  };

  const handleReturnHome = () => {
    navigate('/');
  };

  const handleRematch = () => {
    // TODO: Implement rematch API call
    toast({
      title: "Rematch Requested",
      description: "Waiting for opponent response...",
    });
    setWinLossModal({ isOpen: false });
  };

  const isPlayerTurn = roomState?.currentTurn === playerAddress;
  const playerGuesses = roomState?.guesses?.filter(g => true) || []; // TODO: Filter by player
  const opponentGuesses = roomState?.guesses?.filter(g => false) || []; // TODO: Filter by opponent
  
  // Calculate breached indices for demo
  const breachedIndices = playerGuesses
    .filter(g => g.result?.breached)
    .slice(0, 2)
    .map((_, i) => i);

  if (loading) {
    return (
      <div className="min-h-screen matrix-bg flex items-center justify-center">
        <MatrixBackground />
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⚡</div>
          <p className="font-mono text-primary">Loading battle arena...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen matrix-bg flex flex-col">
      <MatrixBackground />
      
      {/* Header */}
      <header className="relative z-10 border-b border-primary/20 bg-card/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left Side */}
            <div className="flex items-center gap-4">
              <CyberButton
                variant="ghost"
                size="sm"
                onClick={handleReturnHome}
              >
                <ArrowLeft className="w-4 h-4" />
                Exit Battle
              </CyberButton>
              
              <div className="hidden md:block">
                <h1 className="text-xl font-cyber font-bold text-primary text-glow">
                  Vault Wars
                </h1>
                <p className="text-xs font-mono text-muted-foreground">
                  Breach your rival under encryption
                </p>
              </div>
            </div>

            {/* Center - Room Info */}
            <div className="text-center">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-accent" />
                <span className="font-mono text-sm text-foreground">
                  Room: {roomId}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Coins className="w-3 h-3" />
                  {wager} ETH
                </div>
                <div className={cn(
                  "flex items-center gap-1",
                  isPlayerTurn ? "text-neon-green" : "text-accent"
                )}>
                  {isPlayerTurn ? "Your Turn" : "Opponent's Turn"}
                </div>
              </div>
            </div>

            {/* Right Side - Connection Status */}
            <div className="flex items-center gap-2">
              {isConnected ? (
                <div className="flex items-center gap-1 text-neon-green">
                  <Wifi className="w-4 h-4" />
                  <span className="text-xs font-mono hidden sm:block">Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-destructive">
                  <WifiOff className="w-4 h-4" />
                  <span className="text-xs font-mono hidden sm:block">Reconnecting...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <div className="grid lg:grid-cols-12 gap-6 h-full">
          {/* Left Column - Your Side */}
          <div className="lg:col-span-5 space-y-6">
            {/* Your Vault */}
            <VaultDisplay
              isOwner={true}
              vaultDigits={roomState?.playerVault}
              masked={false}
              breachedIndices={breachedIndices}
              label="Your Vault"
            />

            {/* Probe Input */}
            <ProbeInput
              onSubmit={handleProbeSubmit}
              disabled={!isPlayerTurn || !isConnected}
              maxSlots={4}
            />

            {/* Your Guesses */}
            <div className="hidden lg:block">
              <GuessStack
                guesses={playerGuesses}
                side="you"
                title="Your Guesses"
              />
            </div>
          </div>

          {/* Center Column - Timeline (Desktop) */}
          <div className="hidden lg:block lg:col-span-2">
            <TurnLog
              guesses={[...playerGuesses, ...opponentGuesses]}
              className="sticky top-6"
            />
          </div>

          {/* Right Column - Opponent Side */}
          <div className="lg:col-span-5 space-y-6">
            {/* Opponent Vault */}
            <VaultDisplay
              isOwner={false}
              vaultDigits={null}
              masked={true}
              breachedIndices={[]}
              label="Opponent Vault — Encrypted"
            />

            {/* Opponent Guesses */}
            <GuessStack
              guesses={opponentGuesses}
              side="opponent"
              title="Opponent Guesses"
            />
          </div>

          {/* Mobile: Stacked Layout */}
          <div className="lg:hidden col-span-full space-y-6">
            {/* Your Guesses Mobile */}
            <GuessStack
              guesses={playerGuesses}
              side="you"
              title="Your Guesses"
            />

            {/* Timeline Mobile */}
            <TurnLog
              guesses={[...playerGuesses, ...opponentGuesses]}
            />
          </div>
        </div>
      </main>

      {/* Modals and Overlays */}
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
};

export default GameScreen;