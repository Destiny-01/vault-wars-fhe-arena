import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import MatrixBackground from "@/components/MatrixBackground";
import { Navbar } from "@/components/layout/Navbar";
import { useGameApi } from "@/hooks/useGameApi";
import { useToast } from "@/hooks/use-toast";
import { ResultPosted } from "@/types/game";
import { Copy, Loader2 } from "lucide-react";

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
      await submitProbe(selectedDigits);
      setSelectedDigits(['', '', '', '']);
      toast({
        title: "Guess submitted!",
        description: "Awaiting result...",
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

  // Determine game state
  const isPlayerTurn = roomState?.currentTurn === playerAddress;
  
  // Filter guesses by player
  const playerGuesses = roomState?.guesses?.filter(g => Math.random() > 0.5) || []; // Mock filtering
  const opponentGuesses = roomState?.guesses?.filter(g => Math.random() > 0.5) || []; // Mock filtering
  
  const isComplete = selectedDigits.every(digit => digit !== '');
  const canSubmit = isComplete && !isSubmitting && isPlayerTurn;

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
        <div className="mb-6 p-4 bg-card/80 backdrop-blur-sm rounded-lg border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-primary font-mono">Room {roomId}</h1>
              <p className="text-sm text-muted-foreground">Wager: {wager} ETH</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyInvitationLink}
              className="flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy Invitation Link
            </Button>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Player Guesses */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-primary font-mono">Your Guesses</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {playerGuesses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground font-mono">
                  No guesses yet
                </div>
              ) : (
                playerGuesses.map((guess) => (
                  <div key={guess.turnIndex} className="cyber-border rounded-lg p-4 bg-card/30">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        {guess.digits.map((digit, index) => (
                          <div
                            key={index}
                            className="w-10 h-10 rounded border border-primary/30 bg-primary/10 flex items-center justify-center font-mono font-bold text-primary"
                          >
                            {digit}
                          </div>
                        ))}
                      </div>
                      <div className="text-sm font-mono">
                        {guess.result ? (
                          <span className="text-muted-foreground">
                            Dead: <span className="text-green-400">{guess.result.breached}</span> | 
                            Injured: <span className="text-yellow-400">{guess.result.injured}</span>
                          </span>
                        ) : (
                          <span className="text-accent animate-pulse">Pending...</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column - Opponent Guesses */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-accent font-mono">Opponent Guesses</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {opponentGuesses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground font-mono">
                  No guesses yet
                </div>
              ) : (
                opponentGuesses.map((guess) => (
                  <div key={guess.turnIndex} className="cyber-border rounded-lg p-4 bg-card/30">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        {guess.digits.map((digit, index) => (
                          <div
                            key={index}
                            className="w-10 h-10 rounded border border-accent/30 bg-accent/10 flex items-center justify-center font-mono font-bold text-accent"
                          >
                            {digit}
                          </div>
                        ))}
                      </div>
                      <div className="text-sm font-mono">
                        {guess.result ? (
                          <span className="text-muted-foreground">
                            Dead: <span className="text-green-400">{guess.result.breached}</span> | 
                            Injured: <span className="text-yellow-400">{guess.result.injured}</span>
                          </span>
                        ) : (
                          <span className="text-accent animate-pulse">Pending...</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Input Section */}
        <div className="mt-8 p-6 bg-card/80 backdrop-blur-sm rounded-lg border border-primary/20">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-primary font-mono mb-2">
              {isPlayerTurn ? "Enter Your Guess" : "Opponent's Turn"}
            </h3>
            
            {/* Selected Digits Display */}
            <div className="flex justify-center gap-3 mb-6">
              {selectedDigits.map((digit, index) => (
                <div
                  key={index}
                  className="w-16 h-16 rounded-lg border-2 border-dashed border-primary/30 bg-card/20 flex items-center justify-center text-2xl font-mono font-bold text-primary"
                >
                  {digit || "_"}
                </div>
              ))}
            </div>

            {/* Number Keypad */}
            {isPlayerTurn && (
              <div className="grid grid-cols-5 gap-3 mb-6 max-w-md mx-auto">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
                  <Button
                    key={number}
                    variant="outline"
                    size="lg"
                    onClick={() => handleDigitSelect(number.toString())}
                    disabled={selectedDigits.includes(number.toString()) || selectedDigits.every(d => d !== '')}
                    className="h-12 text-lg font-mono cyber-border"
                  >
                    {number}
                  </Button>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            {isPlayerTurn && (
              <div className="flex justify-center gap-4">
                <Button
                  variant="ghost"
                  onClick={handleDeleteLast}
                  disabled={selectedDigits.every(d => d === '')}
                >
                  Delete
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleClear}
                  disabled={selectedDigits.every(d => d === '')}
                >
                  Clear
                </Button>
                <Button
                  variant="default"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="min-w-24"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enter"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Game End Modal */}
      {gameEndModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-card p-8 rounded-lg border border-primary/20 text-center max-w-md mx-4">
            <h2 className="text-2xl font-bold text-primary font-mono mb-4">
              {gameEndModal.outcome === 'won' ? "Victory! You breached the vault." : "Defeat! Your vault has been cracked."}
            </h2>
            <div className="mb-6">
              <p className="text-lg font-mono text-muted-foreground">
                Wager: {wager} ETH
              </p>
            </div>
            <div className="flex gap-4 justify-center">
              {gameEndModal.outcome === 'won' ? (
                gameEndModal.claimed ? (
                  <Button onClick={handleReturnHome} className="min-w-32">
                    Go Home
                  </Button>
                ) : (
                  <Button onClick={handleClaimWager} className="min-w-32">
                    Claim Wager
                  </Button>
                )
              ) : (
                <Button onClick={handleReturnHome} className="min-w-32">
                  Go Home
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}