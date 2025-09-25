import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import MatrixBackground from "@/components/MatrixBackground";
import { Navbar } from "@/components/layout/Navbar";
import { HowToPlayModal } from "@/components/modals/HowToPlayModal";
import { useGameApi } from "@/hooks/useGameApi";
import { useToast } from "@/hooks/use-toast";
import { ResultPosted } from "@/types/game";
import { Copy, Loader2, HelpCircle } from "lucide-react";

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

  const [gameEndModal, setGameEndModal] = useState<{
    isOpen: boolean;
    outcome?: 'won' | 'lost';
    claimed?: boolean;
  }>({ isOpen: false });
  const [selectedDigits, setSelectedDigits] = useState<string[]>(['', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  // Listen for result updates
  useEffect(() => {
    const cleanup = onResultPosted((result: ResultPosted) => {
      console.log('Result received:', result);
      
      // Check for win condition (4 breached)
      if (result.signedPlainResult.breached >= 4) {
        setGameEndModal({
          isOpen: true,
          outcome: 'won',
          claimed: false
        });
      }
    });

    return cleanup;
  }, [onResultPosted]);

  const handleDigitSelect = (digit: string) => {
    const emptyIndex = selectedDigits.findIndex(d => !d);
    if (emptyIndex !== -1 && !selectedDigits.includes(digit)) {
      const newDigits = [...selectedDigits];
      newDigits[emptyIndex] = digit;
      setSelectedDigits(newDigits);
    }
  };

  const handleDeleteLast = () => {
    for (let i = selectedDigits.length - 1; i >= 0; i--) {
      if (selectedDigits[i] !== '') {
        const newDigits = [...selectedDigits];
        newDigits[i] = '';
        setSelectedDigits(newDigits);
        break;
      }
    }
  };

  const handleClear = () => {
    setSelectedDigits(['', '', '', '']);
  };

  const handleSubmit = async () => {
    if (selectedDigits.some(digit => !digit)) {
      toast({
        title: "Incomplete guess",
        description: "Select all 4 digits",
        variant: "destructive"
      });
      return;
    }

    if (new Set(selectedDigits).size !== 4) {
      toast({
        title: "Invalid guess",
        description: "All digits must be unique",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Add to player guesses with mock result
      const newGuess = {
        turnIndex: playerGuesses.length + 1,
        digits: [...selectedDigits],
        result: { breached: Math.floor(Math.random() * 3), injured: Math.floor(Math.random() * 2) },
        timestamp: Date.now()
      };
      
      setPlayerGuesses(prev => [...prev, newGuess]);
      setSelectedDigits(['', '', '', '']);
      
      toast({
        title: "Probe launched!",
        description: "Scanning vault defenses...",
      });
    } catch (error) {
      toast({
        title: "Submission failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnHome = () => {
    navigate('/');
  };

  const handleClaimWager = () => {
    setGameEndModal(prev => ({ ...prev, claimed: true }));
    toast({
      title: "Wager claimed!",
      description: "Transaction successful",
    });
  };

  const copyInvitationLink = () => {
    const url = `${window.location.origin}/join?room=${roomId}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Invitation link copied!",
      description: "Share with your opponent",
    });
  };

  // Determine game state - force player turn for testing
  const isPlayerTurn = true;
  
  // Mock game in progress data
  const [playerGuesses, setPlayerGuesses] = useState([
    {
      turnIndex: 1,
      digits: ['1', '2', '3', '4'],
      result: { breached: 1, injured: 2 },
      timestamp: Date.now() - 300000
    },
    {
      turnIndex: 2,
      digits: ['5', '6', '7', '8'],
      result: { breached: 0, injured: 1 },
      timestamp: Date.now() - 120000
    }
  ]);
  
  const opponentGuesses = [
    {
      turnIndex: 1,
      digits: ['9', '0', '1', '2'],
      result: { breached: 2, injured: 0 },
      timestamp: Date.now() - 250000
    },
    {
      turnIndex: 2,
      digits: ['3', '4', '5', '6'],
      result: { breached: 1, injured: 1 },
      timestamp: Date.now() - 80000
    }
  ];
  
  const isComplete = selectedDigits.every(digit => digit !== '');
  const canSubmit = isComplete && !isSubmitting && isPlayerTurn;

  // Listen for Enter key
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && canSubmit) {
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [canSubmit]);

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
        {/* Room Info Header */}
        <div className="mb-8 p-6 bg-card/80 backdrop-blur-sm rounded-lg border border-primary/20 cyber-border">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-primary font-mono tracking-wider">
                VAULT ROOM {roomId}
              </h1>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-accent font-mono">WAGER: {wager} ETH</span>
                <span className="text-muted-foreground font-mono">WALLET: {playerAddress?.slice(0, 8)}...</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyInvitationLink}
              className="flex items-center gap-2 cyber-border hover:shadow-primary/30 hover:shadow-lg transition-all"
            >
              <Copy className="w-4 h-4" />
              Copy Invitation Link
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHowToPlay(true)}
              className="w-10 h-10 rounded-full border border-primary/30 bg-primary/10 hover:bg-primary/20 hover:shadow-primary/30 hover:shadow-lg transition-all animate-pulse"
            >
              <HelpCircle className="w-5 h-5 text-primary" />
            </Button>
          </div>
        </div>

        {/* Split Screen Battle Layout */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Left Side - My Probes Against Opponent's Vault */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-primary font-mono tracking-wider">
                MY PROBES → OPPONENT VAULT
              </h2>
              {isPlayerTurn && (
                <span className="text-xs text-primary animate-pulse font-mono">YOUR TURN</span>
              )}
            </div>
            
            <div className="space-y-2">
              {/* Previous Probes */}
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {playerGuesses.map((guess) => (
                  <div key={guess.turnIndex} className="cyber-border rounded-lg p-4 bg-card/30 border-primary/20">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        {guess.digits.map((digit, index) => (
                          <div
                            key={index}
                            className="w-20 h-20 rounded border border-primary/30 bg-primary/10 flex items-center justify-center font-mono font-bold text-3xl text-primary"
                          >
                            {digit}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-1 text-xs font-mono">
                        {guess.result && (
                          <>
                            <span className="px-1.5 py-0.5 rounded bg-green-500/20 border border-green-500/30 text-green-400 shadow-green-500/20 shadow-sm">
                              B:{guess.result.breached}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 shadow-yellow-500/20 shadow-sm">
                              S:{guess.result.injured}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Active Input Row - Always at Bottom */}
              <div className={`cyber-border rounded-lg p-4 transition-all ${
                isPlayerTurn 
                  ? 'bg-primary/10 border-primary/40 shadow-primary/20 shadow-lg' 
                  : 'bg-card/20 border-muted/30'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {selectedDigits.map((digit, index) => (
                      <div
                        key={index}
                        className={`w-20 h-20 rounded border-2 border-dashed flex items-center justify-center font-mono font-bold text-3xl transition-all ${
                          isPlayerTurn 
                            ? 'border-primary/50 bg-primary/5 text-primary' 
                            : 'border-muted/30 bg-muted/5 text-muted-foreground'
                        }`}
                      >
                        {digit || "•"}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm font-mono">
                    {isPlayerTurn ? (
                      <span className="text-primary animate-pulse">READY TO PROBE</span>
                    ) : (
                      <span className="text-accent animate-pulse">OPPONENT PROBING...</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Opponent's Probes Against My Vault */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-accent font-mono tracking-wider">
              OPPONENT PROBES → MY VAULT
            </h2>
            
            <div className="space-y-2">
              {/* Opponent's Active Row */}
              <div className="cyber-border rounded-lg p-4 bg-card/20 border-accent/20">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {Array.from({length: 4}).map((_, index) => (
                      <div
                        key={index}
                        className="w-14 h-14 rounded border-2 border-dashed border-accent/30 bg-accent/5 flex items-center justify-center font-mono font-bold text-xl text-accent"
                      >
                        •
                      </div>
                    ))}
                  </div>
                  <div className="text-sm font-mono">
                    <span className="text-muted-foreground">AWAITING PROBE</span>
                  </div>
                </div>
              </div>

              {/* Opponent's Previous Probes */}
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {opponentGuesses.map((guess) => (
                  <div key={guess.turnIndex} className="cyber-border rounded-lg p-4 bg-card/30 border-accent/20">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        {guess.digits.map((digit, index) => (
                          <div
                            key={index}
                            className="w-20 h-20 rounded border border-accent/30 bg-accent/10 flex items-center justify-center font-mono font-bold text-3xl text-accent"
                          >
                            {digit}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-1 text-xs font-mono">
                        {guess.result && (
                          <>
                            <span className="px-1.5 py-0.5 rounded bg-green-500/20 border border-green-500/30 text-green-400 shadow-green-500/20 shadow-sm">
                              B:{guess.result.breached}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 shadow-yellow-500/20 shadow-sm">
                              S:{guess.result.injured}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Terminal Input Panel */}
        {isPlayerTurn && (
          <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/95 backdrop-blur-sm border-t border-primary/20">
            <div className="container mx-auto">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-primary font-mono mb-2 tracking-wider">
                  TERMINAL KEYPAD
                </h3>
                
                {/* Number Grid */}
                <div className="grid grid-cols-5 gap-3 mb-6 max-w-md mx-auto">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((number) => (
                    <Button
                      key={number}
                      variant="outline"
                      size="lg"
                      onClick={() => handleDigitSelect(number.toString())}
                      disabled={selectedDigits.includes(number.toString()) || selectedDigits.every(d => d !== '')}
                      className="h-14 text-xl font-mono cyber-border bg-primary/5 hover:bg-primary/20 hover:shadow-primary/30 hover:shadow-lg transition-all border-primary/30 text-primary"
                    >
                      {number}
                    </Button>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-4">
                  <Button
                    variant="ghost"
                    onClick={handleDeleteLast}
                    disabled={selectedDigits.every(d => d === '')}
                    className="font-mono"
                  >
                    Delete
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleClear}
                    disabled={selectedDigits.every(d => d === '')}
                    className="font-mono"
                  >
                    Clear
                  </Button>
                  <Button
                    variant="default"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="min-w-32 font-mono cyber-border bg-primary hover:bg-primary/90 shadow-primary/30 shadow-lg"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && canSubmit) {
                        handleSubmit();
                      }
                    }}
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "LAUNCH PROBE"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Game End Modal */}
      {gameEndModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="bg-card/90 backdrop-blur-sm p-8 rounded-lg border cyber-border text-center max-w-md mx-4 shadow-2xl">
            <h2 className={`text-3xl font-bold font-mono mb-6 tracking-wider ${
              gameEndModal.outcome === 'won' 
                ? 'text-green-400 drop-shadow-[0_0_10px_rgb(34,197,94)]' 
                : 'text-red-400 drop-shadow-[0_0_10px_rgb(239,68,68)]'
            }`}>
              {gameEndModal.outcome === 'won' ? "VAULT BREACHED" : "YOUR VAULT HAS BEEN CRACKED"}
            </h2>
            <div className="mb-8">
              <p className={`text-xl font-mono ${
                gameEndModal.outcome === 'won' ? 'text-green-300' : 'text-red-300'
              }`}>
                {gameEndModal.outcome === 'won' ? "You win." : ""}
              </p>
              <p className="text-lg font-mono text-muted-foreground mt-2">
                Wager: {wager} ETH
              </p>
            </div>
            <div className="flex gap-4 justify-center">
              {gameEndModal.outcome === 'won' ? (
                gameEndModal.claimed ? (
                  <Button onClick={handleReturnHome} className="min-w-32 cyber-border">
                    Exit to Lobby
                  </Button>
                ) : (
                  <Button onClick={handleClaimWager} className="min-w-32 cyber-border bg-green-600 hover:bg-green-700 text-white">
                    Claim Wager
                  </Button>
                )
              ) : (
                <Button onClick={handleReturnHome} className="min-w-32 cyber-border">
                  Exit to Lobby
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
      />
    </div>
  );
}