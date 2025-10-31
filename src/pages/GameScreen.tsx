import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import MatrixBackground from "@/components/MatrixBackground";
import { Navbar } from "@/components/layout/Navbar";
import { HowToPlayModal } from "@/components/modals/HowToPlayModal";
import PrivacyConsole from "@/components/game/PrivacyConsole";
import { useVaultWars } from "@/hooks/useVaultWars";
import { RoomMetadata, Guess } from "@/contexts/VaultWarsProvider";
import { RoomPhase } from "@/types/game";
import { useToast } from "@/hooks/use-toast";
import {
  Copy,
  Loader2,
  HelpCircle,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { encryptValue, initializeFHE } from "@/lib/fhe";
import { ethers } from "ethers";

export default function GameScreen() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  // State for room data
  const [roomData, setRoomData] = useState<RoomMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Game state
  const [gameEndModal, setGameEndModal] = useState<{
    isOpen: boolean;
    outcome?: "won" | "lost";
    claimed?: boolean;
    wager?: string;
  }>({ isOpen: false });
  const [selectedDigits, setSelectedDigits] = useState<string[]>([
    "",
    "",
    "",
    "",
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  // Guesses are derived from provider state
  const [myVaultDigits, setMyVaultDigits] = useState<string[]>([
    "?",
    "?",
    "?",
    "?",
  ]);

  const vaultWarsContext = useVaultWars();
  const {
    contract,
    isPlayerTurn: checkIsPlayerTurn,
    address,
    roomGuesses,
    submitProbe: submitProbeToContract,
    requestWinnerDecryption,
    setCurrentRoom,
  } = vaultWarsContext;

  // Split guesses into player vs opponent based on submitter
  const { playerGuesses, opponentGuesses } = useMemo(() => {
    const me = address?.toLowerCase();
    const mine: Guess[] = [];
    const theirs: Guess[] = [];
    for (const g of roomGuesses || []) {
      const submitter = g.submitter?.toLowerCase();
      if (me && submitter === me) {
        mine.push(g);
      } else {
        theirs.push(g);
      }
    }
    return { playerGuesses: mine, opponentGuesses: theirs };
  }, [roomGuesses, address]);

  // Restore persisted input from localStorage
  useEffect(() => {
    if (!roomId || !address) return;
    const key = `vaultwars.input.${roomId}.${address.toLowerCase()}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          Array.isArray(parsed) &&
          parsed.length === 4 &&
          parsed.every((d) => typeof d === "string")
        ) {
          setSelectedDigits(parsed);
        }
      }
    } catch (e) {
      // ignore persistence errors
      void e;
    }
  }, [roomId, address]);

  // Load my vault code (set during create/join) once per room
  useEffect(() => {
    if (!roomId || !address) return;
    const key = `vaultwars.vaultcode.${roomId}.${address.toLowerCase()}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          Array.isArray(parsed) &&
          parsed.length === 4 &&
          parsed.every((d) => typeof d === "string")
        ) {
          setMyVaultDigits(parsed);
        } else {
          setMyVaultDigits(["?", "?", "?", "?"]);
        }
      } else {
        setMyVaultDigits(["?", "?", "?", "?"]);
      }
    } catch (e) {
      setMyVaultDigits(["?", "?", "?", "?"]);
    }
  }, [roomId, address]);

  // Persist input to localStorage
  useEffect(() => {
    if (!roomId || !address) return;
    const key = `vaultwars.input.${roomId}.${address.toLowerCase()}`;
    try {
      localStorage.setItem(key, JSON.stringify(selectedDigits));
    } catch (e) {
      // ignore persistence errors
      void e;
    }
  }, [selectedDigits, roomId, address]);

  // Clear input after my result is computed
  useEffect(() => {
    if (!address || playerGuesses.length === 0) return;
    const last = playerGuesses[playerGuesses.length - 1];
    // If the last recorded guess has a result, clear input
    if (last?.result) {
      setSelectedDigits(["", "", "", ""]);
    }
  }, [playerGuesses, address]);

  // Load room data
  const loadRoomData = useCallback(async () => {
    if (!roomId || !contract) return;

    try {
      setLoading(true);
      const data = await vaultWarsContext.getRoom(roomId);
      if (!data) {
        toast({
          title: "❌ Room not found",
          description: "This room does not exist or has expired.",
          variant: "destructive",
        });
        navigate("/");
      } else {
        setRoomData(data);
      }
    } catch (error) {
      console.error("Failed to load room:", error);
      toast({
        title: "❌ Failed to load room",
        description: "Could not connect to the game room.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [roomId, contract, vaultWarsContext, toast, navigate]);

  // Load room data on mount
  useEffect(() => {
    loadRoomData();
  }, [loadRoomData]);

  // Ensure provider knows the current room for event correlation
  useEffect(() => {
    setCurrentRoom(roomId || null);
    return () => setCurrentRoom(null);
  }, [roomId, setCurrentRoom]);

  // Simple turn logic - check if connected address matches creator or opponent
  const isPlayerTurn = useMemo(() => {
    if (!roomData || !address) return false;

    // If you're the creator and it's an even turn, it's your turn
    // If you're the opponent and it's an odd turn, it's your turn
    const isCreator = address.toLowerCase() === roomData.creator.toLowerCase();
    const isOpponent =
      address.toLowerCase() === roomData.opponent.toLowerCase();

    if (isCreator) {
      return roomData.turnCount % 2 === 0;
    } else if (isOpponent) {
      return roomData.turnCount % 2 === 1;
    }

    return false;
  }, [roomData, address]);

  // Refresh room data
  const refreshRoomData = useCallback(async () => {
    if (!roomId) return;
    setIsRefreshing(true);
    await loadRoomData();
    setIsRefreshing(false);
  }, [roomId, loadRoomData]);

  // Enhanced input handling with keyboard support
  const handleDigitSelect = useCallback(
    (digit: string) => {
      const emptyIndex = selectedDigits.findIndex((d) => !d);
      if (emptyIndex !== -1 && !selectedDigits.includes(digit)) {
        const newDigits = [...selectedDigits];
        newDigits[emptyIndex] = digit;
        setSelectedDigits(newDigits);
      }
    },
    [selectedDigits]
  );

  const handleDeleteLast = useCallback(() => {
    for (let i = selectedDigits.length - 1; i >= 0; i--) {
      if (selectedDigits[i] !== "") {
        const newDigits = [...selectedDigits];
        newDigits[i] = "";
        setSelectedDigits(newDigits);
        break;
      }
    }
  }, [selectedDigits]);

  const handleClear = useCallback(() => {
    setSelectedDigits(["", "", "", ""]);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (selectedDigits.some((digit) => !digit)) {
      toast({
        title: "Incomplete guess",
        description: "Select all 4 digits",
        variant: "destructive",
      });
      return;
    }

    if (new Set(selectedDigits).size !== 4) {
      toast({
        title: "Invalid guess",
        description: "All digits must be unique",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await submitProbeToContract(roomId!, selectedDigits.map(Number));

      toast({
        title: "🚀 Probe launched!",
        description: "Scanning vault defenses...",
      });
    } catch (error) {
      console.error("Failed to submit probe:", error);
      toast({
        title: "❌ Submission failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedDigits, submitProbeToContract, roomId, toast]);

  // Game state logic
  const isComplete = selectedDigits.every((digit) => digit !== "");
  const gameInProgress = roomData?.phase === RoomPhase.IN_PROGRESS;
  const canSubmit =
    isComplete && !isSubmitting && isPlayerTurn && gameInProgress;

  // Enhanced keyboard handling
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Enter" && canSubmit) {
        handleSubmit();
      } else if (e.key === "Backspace" || e.key === "Delete") {
        handleDeleteLast();
      } else if (e.key === "Escape") {
        handleClear();
      } else if (/^[0-9]$/.test(e.key)) {
        handleDigitSelect(e.key);
      }
    },
    [canSubmit, handleSubmit, handleDeleteLast, handleClear, handleDigitSelect]
  );

  // Global keyboard listener
  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  const handleReturnHome = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const handleClaimWager = useCallback(async () => {
    try {
      await requestWinnerDecryption(roomId!);
      setGameEndModal((prev) => ({ ...prev, claimed: true }));
      toast({
        title: "🎉 Claim submitted!",
        description: `You will receive ${(
          Number(gameEndModal.wager || 0) * 2
        ).toFixed(4)} ETH (2x wager)`,
      });
    } catch (error) {
      console.error("Failed to claim wager:", error);
      toast({
        title: "❌ Claim failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  }, [requestWinnerDecryption, roomId, toast, gameEndModal.wager]);

  const copyInvitationLink = useCallback(() => {
    const url = `${window.location.origin}/join?room=${roomId}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "📋 Invitation link copied!",
      description: "Share with your opponent",
    });
  }, [roomId, toast]);

  // Initialize FHE
  useEffect(() => {
    initializeFHE().catch(console.error);
  }, []);

  // Listen for win/loss events from provider
  useEffect(() => {
    const handleWin = (event: CustomEvent) => {
      const { wager } = event.detail;
      setGameEndModal({
        isOpen: true,
        outcome: "won",
        claimed: false,
        wager: wager || roomData?.wager,
      });
    };

    const handleLoss = (event: CustomEvent) => {
      setGameEndModal({
        isOpen: true,
        outcome: "lost",
        claimed: false,
      });
    };

    window.addEventListener("vaultwars:win", handleWin as EventListener);
    window.addEventListener("vaultwars:loss", handleLoss as EventListener);

    return () => {
      window.removeEventListener("vaultwars:win", handleWin as EventListener);
      window.removeEventListener("vaultwars:loss", handleLoss as EventListener);
    };
  }, [roomData?.wager]);

  const getPhaseText = useCallback((phase: RoomPhase) => {
    switch (phase) {
      case RoomPhase.WAITING_FOR_JOIN:
        return "Waiting for opponent";
      case RoomPhase.IN_PROGRESS:
        return "Battle in progress";
      case RoomPhase.COMPLETED:
        return "Battle completed";
      case RoomPhase.CANCELLED:
        return "Room cancelled";
      default:
        return "Unknown status";
    }
  }, []);

  if (loading || !roomData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
        <Navbar />
        <MatrixBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center space-y-6">
            <div className="relative">
              <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
              <div className="absolute inset-0 w-16 h-16 border-2 border-primary/20 rounded-full animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <p className="text-xl text-primary font-mono font-semibold">
                Loading battle arena...
              </p>
              <p className="text-sm text-muted-foreground font-mono">
                Initializing FHE encryption protocols
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show waiting state if no opponent
  if (
    roomData.phase === RoomPhase.WAITING_FOR_JOIN &&
    roomData.opponent === ethers.ZeroHash
  ) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
        <Navbar />
        <MatrixBackground />
        <div className="relative z-10 container mx-auto px-4 py-6">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="p-8 bg-card/80 backdrop-blur-sm rounded-lg border border-primary/20 cyber-border shadow-2xl">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold text-primary font-mono tracking-wider">
                    ROOM {roomId}
                  </h1>
                  <div className="w-24 h-1 bg-gradient-to-r from-primary to-accent mx-auto rounded-full"></div>
                </div>

                <div className="space-y-4">
                  <div className="text-xl text-accent font-mono font-semibold">
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
                    <span className="ml-2 font-mono">
                      Waiting for opponent to join...
                    </span>
                  </div>
                  <div className="text-lg text-muted-foreground font-mono">
                    Wager:{" "}
                    <span className="text-primary font-semibold">
                      {roomData?.wager || "0"} ETH
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={refreshRoomData}
                    variant="outline"
                    disabled={isRefreshing}
                    className="cyber-border hover:shadow-primary/30 hover:shadow-lg transition-all"
                  >
                    <RefreshCw
                      className={`w-4 h-4 mr-2 ${
                        isRefreshing ? "animate-spin" : ""
                      }`}
                    />
                    Refresh
                  </Button>
                  <Button
                    onClick={handleReturnHome}
                    variant="outline"
                    className="cyber-border hover:shadow-primary/30 hover:shadow-lg transition-all"
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      <Navbar />
      <MatrixBackground />

      <div className="relative z-10 container mx-auto px-4 py-6">
        {/* Room Info Header */}
        <div className="mb-8 p-6 bg-card/80 backdrop-blur-sm rounded-lg border border-primary/20 cyber-border shadow-2xl">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-primary font-mono tracking-wider">
                VAULT ROOM {roomId}
              </h1>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-accent font-mono font-semibold">
                    WAGER:
                  </span>
                  <span className="text-primary font-mono font-bold">
                    {roomData.wager} ETH
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-accent font-mono font-semibold">
                    STATUS:
                  </span>
                  <span className="text-primary font-mono font-bold">
                    {getPhaseText(roomData.phase)}
                  </span>
                </div>
                {isPlayerTurn && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-400 font-mono font-semibold">
                      YOUR TURN
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshRoomData}
                disabled={isRefreshing}
                className="flex items-center gap-2 cyber-border hover:shadow-primary/30 hover:shadow-lg transition-all"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={copyInvitationLink}
                className="flex items-center gap-2 cyber-border hover:shadow-primary/30 hover:shadow-lg transition-all"
              >
                <Copy className="w-4 h-4" />
                Copy Link
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHowToPlay(true)}
                className="w-10 h-10 rounded-full border border-primary/30 bg-primary/10 hover:bg-primary/20 hover:shadow-primary/30 hover:shadow-lg transition-all"
              >
                <HelpCircle className="w-5 h-5 text-primary" />
              </Button>
            </div>
          </div>
        </div>

        {/* Split Screen Battle Layout */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Left Side - My Probes Against Opponent's Vault */}
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h2 className="text-xl font-bold text-primary font-mono tracking-wider">
                MY PROBES → OPPONENT VAULT
              </h2>
              {isPlayerTurn && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-400 font-mono font-semibold">
                    YOUR TURN
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Previous Probes */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {playerGuesses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground font-mono">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-primary/30 flex items-center justify-center">
                      <span className="text-2xl">?</span>
                    </div>
                    <p>No probes launched yet</p>
                  </div>
                ) : (
                  playerGuesses.map((guess) => (
                    <div
                      key={guess.turnIndex}
                      className="cyber-border rounded-lg p-4 bg-card/40 border-primary/30 shadow-lg hover:shadow-primary/20 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex gap-3">
                          {guess.digits.map((digit, index) => (
                            <div
                              key={index}
                              className="w-12 h-12 rounded border border-primary/30 bg-primary/10 flex items-center justify-center font-mono font-bold text-lg text-primary"
                            >
                              {digit}
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2 text-sm font-mono">
                          {guess.result && (
                            <>
                              <span className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/40 text-green-400 shadow-green-500/20 shadow-sm font-semibold">
                                B:{guess.result.breached}
                              </span>
                              <span className="px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 shadow-yellow-500/20 shadow-sm font-semibold">
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
              <div
                className={`cyber-border rounded-lg p-6 transition-all duration-300 ${
                  isPlayerTurn && gameInProgress
                    ? "bg-primary/10 border-primary/50 shadow-primary/30 shadow-lg"
                    : "bg-card/20 border-muted/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex gap-3">
                    {selectedDigits.map((digit, index) => (
                      <div
                        key={index}
                        className={`w-12 h-12 rounded border border-dashed flex items-center justify-center font-mono font-bold text-lg transition-all duration-200 ${
                          isPlayerTurn && gameInProgress
                            ? "border-primary/60 bg-primary/10 text-primary hover:border-primary/80 hover:bg-primary/20"
                            : "border-muted/40 bg-muted/10 text-muted-foreground"
                        }`}
                      >
                        {digit || "•"}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm font-mono font-semibold">
                    {isPlayerTurn && gameInProgress ? (
                      <span className="text-primary animate-pulse">
                        READY TO PROBE
                      </span>
                    ) : (
                      <span className="text-accent animate-pulse">
                        OPPONENT PROBING...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Opponent's Probes Against My Vault */}
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-accent/5 rounded-lg border border-accent/20">
              <h2 className="text-xl font-bold text-accent font-mono tracking-wider">
                OPPONENT PROBES → MY VAULT
              </h2>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                <span className="text-sm text-accent font-mono font-semibold">
                  DEFENDING
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {/* Opponent's Active Row - show my saved vault code from create/join */}
              <div className="cyber-border rounded-lg p-6 bg-card/20 border-accent/30 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex gap-3">
                    {myVaultDigits.map((digit, index) => (
                      <div
                        key={index}
                        className="w-12 h-12 rounded border border-accent/30 bg-accent/10 flex items-center justify-center font-mono font-bold text-lg text-accent"
                      >
                        {digit}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm font-mono font-semibold">
                    <span className="text-muted-foreground">
                      YOUR VAULT CODE
                    </span>
                  </div>
                </div>
              </div>

              {/* Opponent's Previous Probes */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {opponentGuesses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground font-mono">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-accent/30 flex items-center justify-center">
                      <span className="text-2xl">?</span>
                    </div>
                    <p>No opponent probes yet</p>
                  </div>
                ) : (
                  opponentGuesses.map((guess) => (
                    <div
                      key={guess.turnIndex}
                      className="cyber-border rounded-lg p-4 bg-card/40 border-accent/30 shadow-lg hover:shadow-accent/20 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex gap-3">
                          {guess.digits.map((digit, index) => (
                            <div
                              key={index}
                              className="w-12 h-12 rounded border border-accent/30 bg-accent/10 flex items-center justify-center font-mono font-bold text-lg text-accent"
                            >
                              {digit}
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2 text-sm font-mono">
                          {guess.result && (
                            <>
                              <span className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/40 text-green-400 shadow-green-500/20 shadow-sm font-semibold">
                                B:{guess.result.breached}
                              </span>
                              <span className="px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 shadow-yellow-500/20 shadow-sm font-semibold">
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
            </div>
          </div>
        </div>

        {/* Compact Terminal Input Panel - Always Visible */}
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-background/95 backdrop-blur-sm border border-primary/20 rounded-lg shadow-2xl p-4">
          <div className="text-center">
            {/* Turn Status */}
            <div className="mb-3">
              {isPlayerTurn ? (
                <div className="flex items-center justify-center gap-2 text-green-400 font-mono text-sm">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  YOUR TURN
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-accent font-mono text-sm">
                  <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></div>
                  OPPONENT'S TURN
                </div>
              )}
            </div>

            {/* Number Grid */}
            <div className="grid grid-cols-5 gap-2 mb-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((number) => (
                <Button
                  key={number}
                  variant="outline"
                  size="sm"
                  onClick={() => handleDigitSelect(number.toString())}
                  disabled={
                    !isPlayerTurn ||
                    !gameInProgress ||
                    selectedDigits.includes(number.toString()) ||
                    selectedDigits.every((d) => d !== "")
                  }
                  className={`w-8 h-8 text-sm font-mono cyber-border transition-all ${
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
            <div className="flex justify-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteLast}
                disabled={
                  !isPlayerTurn ||
                  !gameInProgress ||
                  selectedDigits.every((d) => d === "")
                }
                className={`text-xs font-mono px-3 py-1 transition-all ${
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
                onClick={handleClear}
                disabled={
                  !isPlayerTurn ||
                  !gameInProgress ||
                  selectedDigits.every((d) => d === "")
                }
                className={`text-xs font-mono px-3 py-1 transition-all ${
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
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`text-xs font-mono px-4 py-1 cyber-border transition-all ${
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
      </div>

      {/* Game End Modal */}
      {gameEndModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="bg-card/95 backdrop-blur-sm p-8 rounded-lg border cyber-border text-center max-w-lg mx-4 shadow-2xl">
            <div className="space-y-6">
              <div className="space-y-4">
                <h2
                  className={`text-4xl font-bold font-mono tracking-wider ${
                    gameEndModal.outcome === "won"
                      ? "text-green-400 drop-shadow-[0_0_20px_rgb(34,197,94)]"
                      : "text-red-400 drop-shadow-[0_0_20px_rgb(239,68,68)]"
                  }`}
                >
                  {gameEndModal.outcome === "won"
                    ? "VAULT BREACHED"
                    : "YOUR VAULT HAS BEEN CRACKED"}
                </h2>

                <div className="w-24 h-1 bg-gradient-to-r from-primary to-accent mx-auto rounded-full"></div>

                <div className="space-y-3">
                  <p
                    className={`text-2xl font-mono font-semibold ${
                      gameEndModal.outcome === "won"
                        ? "text-green-300"
                        : "text-red-300"
                    }`}
                  >
                    {gameEndModal.outcome === "won" ? "You win!" : "You lost!"}
                  </p>
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-lg font-mono text-primary font-semibold">
                      Wager: {gameEndModal.wager || roomData?.wager || "0"} ETH
                    </p>
                    {gameEndModal.outcome === "won" && (
                      <p className="text-lg font-mono text-green-400 font-semibold mt-2">
                        Reward:{" "}
                        {(
                          Number(gameEndModal.wager || roomData?.wager || 0) * 2
                        ).toFixed(4)}{" "}
                        ETH
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {gameEndModal.outcome === "won" ? (
                  gameEndModal.claimed ? (
                    <Button
                      onClick={handleReturnHome}
                      className="min-w-40 cyber-border bg-primary hover:bg-primary/90 shadow-primary/30 shadow-lg"
                    >
                      Exit to Lobby
                    </Button>
                  ) : (
                    <Button
                      onClick={handleClaimWager}
                      className="min-w-40 cyber-border bg-green-600 hover:bg-green-700 text-white shadow-green-600/30 shadow-lg"
                    >
                      Claim Reward
                    </Button>
                  )
                ) : (
                  <Button
                    onClick={handleReturnHome}
                    className="min-w-40 cyber-border bg-primary hover:bg-primary/90 shadow-primary/30 shadow-lg"
                  >
                    Go Home
                  </Button>
                )}
              </div>
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
