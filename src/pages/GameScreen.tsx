import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import MatrixBackground from "@/components/MatrixBackground";
import { Navbar } from "@/components/layout/Navbar";
import { HowToPlayModal } from "@/components/modals/HowToPlayModal";
import { useVaultWars } from "@/hooks/useVaultWars";
import { RoomMetadata, Guess } from "@/contexts/VaultWarsProvider";
import { RoomPhase } from "@/types/game";
import { useToast } from "@/hooks/use-toast";
import { initializeFHE } from "@/lib/fhe";
import { ethers } from "ethers";
import { TurnIndicatorBanner } from "@/components/game/TurnIndicatorBanner";
import { RoomHeader } from "@/components/game/RoomHeader";
import { ProbeSection } from "@/components/game/ProbeSection";
import { InputKeyboard } from "@/components/game/InputKeyboard";
import { LoadingScreen } from "@/components/game/LoadingScreen";
import { WaitingForOpponent } from "@/components/game/WaitingForOpponent";
import { Loader2 } from "lucide-react";

export default function GameScreen() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  // State for room data
  const [roomData, setRoomData] = useState<RoomMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isFirstLoadRef = useRef(true);

  // Game state
  const [gameEndModal, setGameEndModal] = useState<{
    isOpen: boolean;
    outcome?: "won" | "lost";
    wager?: string;
  }>({ isOpen: false });
  const [isClaimingReward, setIsClaimingReward] = useState(false);
  const [selectedDigits, setSelectedDigits] = useState<string[]>([
    "",
    "",
    "",
    "",
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [turnTimeRemaining, setTurnTimeRemaining] = useState<number | null>(
    null
  );
  const [canClaimTimeout, setCanClaimTimeout] = useState(false);
  const [timeoutWarning, setTimeoutWarning] = useState(false);
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
    setCurrentRoom,
    cancelRoom,
    claimTimeout,
    fulfillWinnerDecryption,
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
      // Only show loading screen on first load
      if (isFirstLoadRef.current) {
        setLoading(true);
      }
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
        isFirstLoadRef.current = false;
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

  // Game state logic
  const isComplete = selectedDigits.every((digit) => digit !== "");
  const gameInProgress = roomData?.phase === RoomPhase.IN_PROGRESS;
  const canSubmit =
    isComplete && !isSubmitting && isPlayerTurn && gameInProgress;

  // Generate random unique 4-digit guess
  const generateRandomGuess = useCallback((): number[] => {
    const digits: number[] = [];
    while (digits.length < 4) {
      const digit = Math.floor(Math.random() * 10);
      if (!digits.includes(digit)) {
        digits.push(digit);
      }
    }
    return digits;
  }, []);

  const handleSubmitWithGuess = useCallback(
    async (guessDigits: number[]) => {
      if (!roomId) return;

      try {
        setIsSubmitting(true);
        setIsEncrypting(true);

        toast({
          title: "🔐 Encrypting guess...",
          description: "Securing your probe with FHE encryption.",
        });

        await submitProbeToContract(roomId, guessDigits);

        setIsEncrypting(false);
        setIsDecrypting(true);

        toast({
          title: "🚀 Probe launched!",
          description: "Scanning vault defenses...",
        });

        // Reset timer
        setTurnTimeRemaining(null);

        // Clear input if it was manual submission
        if (guessDigits.map(String).every((d, i) => selectedDigits[i] === d)) {
          setSelectedDigits(["", "", "", ""]);
        }
      } catch (error) {
        console.error("Failed to submit probe:", error);
        setIsEncrypting(false);
        setIsDecrypting(false);
        toast({
          title: "❌ Submission failed",
          description: "Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
        // Keep decrypting state until result comes in
        setTimeout(() => setIsDecrypting(false), 3000);
      }
    },
    [selectedDigits, submitProbeToContract, roomId, toast]
  );

  // Turn timer: 1 minute per turn
  useEffect(() => {
    // Don't start timer if game ended, modal is open, or not player's turn
    if (
      !isPlayerTurn ||
      !gameInProgress ||
      isSubmitting ||
      gameEndModal.isOpen ||
      roomData?.phase !== RoomPhase.IN_PROGRESS
    ) {
      setTurnTimeRemaining(null);
      return;
    }

    // Start timer at 60 seconds
    setTurnTimeRemaining(60);
    const interval = setInterval(() => {
      setTurnTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [
    isPlayerTurn,
    gameInProgress,
    isSubmitting,
    roomData?.turnCount,
    roomData?.phase,
    gameEndModal.isOpen,
  ]);

  // Auto-submit random guess when timer expires
  useEffect(() => {
    // Don't auto-submit if game ended, modal is open, or phase changed
    if (
      turnTimeRemaining === 0 &&
      isPlayerTurn &&
      gameInProgress &&
      !isSubmitting &&
      !gameEndModal.isOpen &&
      roomData?.phase === RoomPhase.IN_PROGRESS
    ) {
      const randomGuess = generateRandomGuess();
      toast({
        title: "⏰ Time's up!",
        description: "Auto-submitting random guess...",
        variant: "destructive",
      });
      handleSubmitWithGuess(randomGuess);
    }
  }, [
    turnTimeRemaining,
    isPlayerTurn,
    gameInProgress,
    isSubmitting,
    generateRandomGuess,
    handleSubmitWithGuess,
    toast,
    gameEndModal.isOpen,
    roomData?.phase,
  ]);

  // Check timeout claim eligibility (5 minutes = 300 seconds)
  useEffect(() => {
    if (!roomData || !address || roomData.phase !== RoomPhase.IN_PROGRESS) {
      setCanClaimTimeout(false);
      setTimeoutWarning(false);
      return;
    }

    const isCreator = address.toLowerCase() === roomData.creator.toLowerCase();
    const isOpponent =
      address.toLowerCase() === roomData.opponent.toLowerCase();
    if (!isCreator && !isOpponent) {
      setCanClaimTimeout(false);
      setTimeoutWarning(false);
      return;
    }

    // Check if it's opponent's turn and they haven't played in 5 minutes
    const isOpponentTurn =
      (isCreator && roomData.turnCount % 2 === 1) ||
      (isOpponent && roomData.turnCount % 2 === 0);

    if (isOpponentTurn) {
      const timeSinceLastActive = Date.now() - roomData.lastActiveAt;
      const fiveMinutes = 5 * 60 * 1000;
      const fourMinutes = 4 * 60 * 1000;
      const canClaim = timeSinceLastActive >= fiveMinutes;
      setCanClaimTimeout(canClaim);
      setTimeoutWarning(timeSinceLastActive >= fourMinutes && !canClaim);
    } else {
      setCanClaimTimeout(false);
      setTimeoutWarning(false);
    }
  }, [roomData, address]);

  // Warning for player if they're about to timeout (30 seconds remaining)
  useEffect(() => {
    if (
      turnTimeRemaining !== null &&
      turnTimeRemaining <= 30 &&
      turnTimeRemaining > 0 &&
      isPlayerTurn
    ) {
      if (turnTimeRemaining === 30) {
        toast({
          title: "⏰ 30 seconds remaining!",
          description: "A random guess will be submitted if you don't act.",
          variant: "destructive",
        });
      }
    }
  }, [turnTimeRemaining, isPlayerTurn, toast]);

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

    await handleSubmitWithGuess(selectedDigits.map(Number));
  }, [selectedDigits, handleSubmitWithGuess, toast]);

  const handleCancelRoom = useCallback(async () => {
    if (!roomId) return;

    if (
      !confirm(
        "Are you sure you want to cancel this room? Your wager will be refunded."
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      await cancelRoom(roomId);
      toast({
        title: "🚫 Room cancelled",
        description: "Your wager has been refunded.",
      });
      navigate("/");
    } catch (error) {
      console.error("Failed to cancel room:", error);
      toast({
        title: "❌ Failed to cancel room",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [roomId, cancelRoom, toast, navigate, setLoading]);

  const handleClaimTimeout = useCallback(async () => {
    if (!roomId) return;

    try {
      setLoading(true);
      await claimTimeout(roomId);
      toast({
        title: "⏰ Timeout claimed!",
        description: "You win by timeout! Wager has been transferred.",
      });
      await loadRoomData();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Timeout period not reached yet.";
      console.error("Failed to claim timeout:", error);
      toast({
        title: "❌ Failed to claim timeout",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [roomId, claimTimeout, toast, loadRoomData, setLoading]);

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

  const handleClaimReward = useCallback(async () => {
    if (!roomId) return;

    try {
      setIsClaimingReward(true);
      await fulfillWinnerDecryption(roomId);
      toast({
        title: "🎉 Reward claimed successfully!",
        description: "Your winnings have been finalized on-chain.",
      });
      setGameEndModal((prev) => ({ ...prev, isOpen: false }));
      navigate("/");
    } catch (error) {
      console.error("Failed to claim reward:", error);
      toast({
        title: "❌ Failed to claim reward",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsClaimingReward(false);
    }
  }, [roomId, fulfillWinnerDecryption, toast, navigate]);

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
        wager: wager || roomData?.wager,
      });
      void loadRoomData();
    };

    const handleLoss = (event: CustomEvent) => {
      setGameEndModal({
        isOpen: true,
        outcome: "lost",
      });
      void loadRoomData();
    };

    window.addEventListener("vaultwars:win", handleWin as EventListener);
    window.addEventListener("vaultwars:loss", handleLoss as EventListener);

    return () => {
      window.removeEventListener("vaultwars:win", handleWin as EventListener);
      window.removeEventListener("vaultwars:loss", handleLoss as EventListener);
    };
  }, [roomData?.wager, loadRoomData]);

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

  // Only show loading screen on first load
  if (isFirstLoadRef.current && (loading || !roomData)) {
    return <LoadingScreen />;
  }

  // Show waiting state if no opponent
  if (
    roomData &&
    roomData.phase === RoomPhase.WAITING_FOR_JOIN &&
    roomData.opponent === ethers.ZeroHash
  ) {
    return (
      <WaitingForOpponent
        roomId={roomId!}
        roomData={roomData}
        isRefreshing={isRefreshing}
        onRefresh={refreshRoomData}
        onReturnHome={handleReturnHome}
        getPhaseText={getPhaseText}
      />
    );
  }

  if (!roomData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-y-auto pb-32 sm:pb-24">
      <Navbar />
      <MatrixBackground />

      <div className="relative z-10 container mx-auto px-4 py-4 sm:py-6">
        {/* Turn Indicator Banner */}
        <TurnIndicatorBanner
          isPlayerTurn={isPlayerTurn}
          gameInProgress={gameInProgress}
          turnTimeRemaining={turnTimeRemaining}
        />

        {/* Room Info Header */}
        <RoomHeader
          roomId={roomId!}
          roomData={roomData}
          isPlayerTurn={isPlayerTurn}
          turnTimeRemaining={turnTimeRemaining}
          canClaimTimeout={canClaimTimeout}
          timeoutWarning={timeoutWarning}
          isRefreshing={isRefreshing}
          address={address}
          onRefresh={refreshRoomData}
          onCopyLink={copyInvitationLink}
          onShowHelp={() => setShowHowToPlay(true)}
          onCancelRoom={handleCancelRoom}
          onClaimTimeout={handleClaimTimeout}
          getPhaseText={getPhaseText}
        />

        {/* Split Screen Battle Layout */}
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-8 mb-24 sm:mb-8">
          {/* Left Side - My Probes Against Opponent's Vault */}
          <ProbeSection
            title="MY PROBES → OPPONENT VAULT"
            guesses={playerGuesses}
            isActive={isPlayerTurn && gameInProgress}
            isPlayerTurn={isPlayerTurn}
            gameInProgress={gameInProgress}
            selectedDigits={selectedDigits}
            isEncrypting={isEncrypting}
            isDecrypting={isDecrypting}
            emptyMessage="No probes launched yet"
            emptyIcon="?"
            borderColor="green-500"
            bgColor="green-500"
            textColor="text-primary"
          />

          {/* Right Side - Opponent's Probes Against My Vault */}
          <div className="space-y-4 sm:space-y-6">
            <div className="cyber-border rounded-lg p-4 sm:p-6 bg-card/20 border-accent/30 shadow-lg">
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-2 sm:gap-3">
                  {myVaultDigits.map((digit, index) => (
                    <div
                      key={index}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded border border-accent/30 bg-accent/10 flex items-center justify-center font-mono font-bold text-base sm:text-lg text-accent"
                    >
                      {digit}
                    </div>
                  ))}
                </div>
                <div className="text-xs sm:text-sm font-mono font-semibold">
                  <span className="text-muted-foreground">YOUR VAULT CODE</span>
                </div>
              </div>
            </div>
            <ProbeSection
              title="OPPONENT PROBES → MY VAULT"
              guesses={opponentGuesses}
              isActive={!isPlayerTurn && gameInProgress}
              isPlayerTurn={!isPlayerTurn}
              gameInProgress={gameInProgress}
              selectedDigits={[]}
              isEncrypting={false}
              isDecrypting={false}
              emptyMessage="No opponent probes yet"
              emptyIcon="?"
              borderColor="accent"
              bgColor="accent"
              textColor="text-accent"
            />
          </div>
        </div>

        {/* Compact Terminal Input Panel - Always Visible */}
        <InputKeyboard
          isPlayerTurn={isPlayerTurn}
          gameInProgress={gameInProgress}
          selectedDigits={selectedDigits}
          turnTimeRemaining={turnTimeRemaining}
          isSubmitting={isSubmitting}
          onDigitSelect={handleDigitSelect}
          onDeleteLast={handleDeleteLast}
          onClear={handleClear}
          onSubmit={handleSubmit}
          canSubmit={canSubmit}
        />
      </div>

      {/* Game End Modal */}
      {gameEndModal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm overflow-y-auto p-4">
          <div className="bg-card/95 backdrop-blur-sm p-6 sm:p-8 rounded-lg border cyber-border text-center max-w-lg mx-4 shadow-2xl my-auto">
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-3 sm:space-y-4">
                <h2
                  className={`text-2xl sm:text-4xl font-bold font-mono tracking-wider ${
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

                <div className="space-y-2 sm:space-y-3">
                  <p
                    className={`text-xl sm:text-2xl font-mono font-semibold ${
                      gameEndModal.outcome === "won"
                        ? "text-green-300"
                        : "text-red-300"
                    }`}
                  >
                    {gameEndModal.outcome === "won" ? "You win!" : "You lost!"}
                  </p>
                  <div className="p-3 sm:p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-base sm:text-lg font-mono text-primary font-semibold">
                      Wager: {gameEndModal.wager || roomData?.wager || "0"} ETH
                    </p>
                    {gameEndModal.outcome === "won" && (
                      <p className="text-base sm:text-lg font-mono text-green-400 font-semibold mt-2">
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

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                {gameEndModal.outcome === "won" ? (
                  <>
                    <Button
                      onClick={handleClaimReward}
                      disabled={isClaimingReward}
                      className="min-w-32 sm:min-w-40 cyber-border bg-green-600 hover:bg-green-700 text-white shadow-green-600/30 shadow-lg text-sm sm:text-base disabled:opacity-50"
                    >
                      {isClaimingReward ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                          Claiming...
                        </>
                      ) : (
                        "Claim Reward"
                      )}
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleReturnHome}
                    className="min-w-32 sm:min-w-40 cyber-border bg-primary hover:bg-primary/90 shadow-primary/30 shadow-lg text-sm sm:text-base"
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
