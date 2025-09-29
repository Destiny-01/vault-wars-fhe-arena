import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CyberCard } from "@/components/ui/cyber-card";
import MatrixBackground from "@/components/MatrixBackground";
import VaultDisplay from "@/components/game/VaultDisplay";
import { Navbar } from "@/components/layout/Navbar";
import { ConnectWalletModal } from "@/components/wallet/ConnectWalletModal";
import { HowToPlayModal } from "@/components/modals/HowToPlayModal";
import { useVaultWarsContract, RoomPhase, type RoomMetadata } from "@/hooks/useVaultWarsContract";
import { useContractEvents } from "@/services/eventHandler";
import { useToast } from "@/hooks/use-toast";
import { Home, Shuffle, Loader2, AlertCircle, Check } from "lucide-react";
import { initializeFHE } from "@/lib/fhe";

export default function JoinRoom() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { address, isConnected } = useAccount();
  const { toast } = useToast();

  // Contract integration with event handlers
  const eventHandlers = useContractEvents({
    onRoomJoined: (event) => {
      if (event.opponent.toLowerCase() === address?.toLowerCase()) {
        toast({
          title: "🎯 Battle begins!",
          description: "Successfully joined the vault war. Good luck!",
        });

        // Navigate to game screen with room details
        navigate(
          `/game?roomId=${roomId}&playerAddress=${address}&opponentAddress=${event.roomId}&wager=0.1`
        );
      }
    },
  });

  const { joinRoom, getRoom, isLoading } =
    useVaultWarsContract(eventHandlers);

  const [roomId, setRoomId] = useState("");
  const [vaultCode, setVaultCode] = useState<string[]>(["", "", "", ""]);
  const [isJoining, setIsJoining] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showInviteMessage, setShowInviteMessage] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [roomData, setRoomData] = useState<RoomMetadata | null>(null);
  const [roomValidation, setRoomValidation] = useState<{
    isValid: boolean;
    isChecking: boolean;
    error?: string;
  }>({ isValid: false, isChecking: false });

  // Initialize crypto on component mount
  useEffect(() => {
    initializeFHE().catch(console.error);
  }, []);

  // Show how to play modal first, then proceed with room joining
  useEffect(() => {
    setShowHowToPlay(true);
  }, []);

  const proceedWithJoining = () => {
    setShowHowToPlay(false);
  };

  // Auto-fill room ID from URL params
  useEffect(() => {
    const urlRoomId = searchParams.get("room") || searchParams.get("roomId");
    if (urlRoomId) {
      setRoomId(urlRoomId);
      setShowInviteMessage(true);
      checkRoomValidity(urlRoomId);
    }
  }, [searchParams]);

  // Check room validity function
  const checkRoomValidity = async (roomIdToCheck: string) => {
    if (!roomIdToCheck.trim()) {
      setRoomValidation({ isValid: false, isChecking: false });
      setRoomData(null);
      return;
    }

    setRoomValidation({ isValid: false, isChecking: true });

    try {
      const room = await getRoom(roomIdToCheck);
      
      if (!room) {
        setRoomValidation({
          isValid: false,
          isChecking: false,
          error: "Room not found"
        });
        setRoomData(null);
        return;
      }

      // Check if room.creator is a valid address (not zero address)
      if (room.creator === "0x0000000000000000000000000000000000000000") {
        setRoomValidation({
          isValid: false,
          isChecking: false,
          error: "Invalid room"
        });
        setRoomData(null);
        return;
      }

      // Check room phase - only allow joining if waiting for join
      if (room.phase !== RoomPhase.WAITING_FOR_JOIN) {
        const phaseText = room.phase === RoomPhase.IN_PROGRESS ? "in progress" : 
                         room.phase === RoomPhase.COMPLETED ? "completed" : "cancelled";
        setRoomValidation({
          isValid: false,
          isChecking: false,
          error: `Room is ${phaseText}`
        });
        setRoomData(null);
        return;
      }

      // Check if user is trying to join their own room
      if (room.creator.toLowerCase() === address?.toLowerCase()) {
        setRoomValidation({
          isValid: false,
          isChecking: false,
          error: "Cannot join your own room"
        });
        setRoomData(null);
        return;
      }

      setRoomValidation({ isValid: true, isChecking: false });
      setRoomData(room);
    } catch (error) {
      console.error("Error checking room:", error);
      setRoomValidation({
        isValid: false,
        isChecking: false,
        error: "Failed to check room"
      });
      setRoomData(null);
    }
  };

  // Check room validity when roomId changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkRoomValidity(roomId);
    }, 500); // Debounce

    return () => clearTimeout(timeoutId);
  }, [roomId, address]);

  const handleVaultCodeChange = (index: number, value: string) => {
    if (value === "" || (/^\d$/.test(value) && !vaultCode.includes(value))) {
      const newCode = [...vaultCode];
      newCode[index] = value;
      setVaultCode(newCode);
    }
  };

  const generateRandomCode = () => {
    const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const shuffled = numbers.sort(() => Math.random() - 0.5);
    const randomCode = shuffled.slice(0, 4).map(String);
    setVaultCode(randomCode);
  };

  const clearVaultCode = () => {
    setVaultCode(["", "", "", ""]);
  };

  const isVaultComplete = vaultCode.every((digit) => digit !== "");
  const isFormValid = isVaultComplete && roomValidation.isValid && roomData;

  const handleJoinRoom = async () => {
    // Show How to Play modal first if user clicked join room directly
    if (showHowToPlay) {
      setShowHowToPlay(true);
      return;
    }

    if (!isConnected) {
      setShowConnectModal(true);
      return;
    }

    if (!isFormValid) {
      toast({
        title: "❌ Invalid input",
        description: !roomValidation.isValid 
          ? `Room issue: ${roomValidation.error || "Invalid room"}`
          : "Please complete your 4-digit vault code.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsJoining(true);

      toast({
        title: "🔐 Joining vault battle...",
        description: "Encrypting your vault and connecting to the battle.",
      });

      // Convert string array to number array
      const vaultNumbers = vaultCode.map(Number);

      await joinRoom(roomId, vaultNumbers, roomData!.wager);

      // Navigation will be handled by event handler
    } catch (error: any) {
      console.error("Failed to join room:", error);
      // Error toast already shown by contract hook
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      <MatrixBackground />

      <Navbar />

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <CyberCard className="p-8">
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                  🎯 Join Vault Battle 🎯
                </h1>
                <p className="text-muted-foreground">
                  Enter room ID and secure your 4-digit vault code
                </p>
              </div>

              {/* Invite Message */}
              {showInviteMessage && (
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-center">
                  <p className="text-primary font-semibold">
                    🎪 You've been invited to join Room {roomId}!
                  </p>
                </div>
              )}

              {/* Room ID Input */}
              <div className="space-y-2">
                <Label htmlFor="roomId" className="text-lg font-semibold">
                  Room ID
                </Label>
                <div className="relative">
                  <Input
                    id="roomId"
                    type="text"
                    placeholder="Enter room ID"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    onBlur={() => checkRoomValidity(roomId)}
                    className="text-lg h-12 text-center pr-10"
                  />
                  {roomValidation.isChecking && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                  {!roomValidation.isChecking && roomId && (
                    roomValidation.isValid ? (
                      <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-500" />
                    )
                  )}
                </div>
                {roomValidation.error && !roomValidation.isChecking && (
                  <p className="text-sm text-red-500">{roomValidation.error}</p>
                )}
              </div>

              {/* Room Details */}
              {roomData && roomValidation.isValid && (
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-primary">Room Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Creator:</span>
                      <span className="font-mono text-xs">{roomData.creator.slice(0, 6)}...{roomData.creator.slice(-4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Wager:</span>
                      <span className="font-semibold">{roomData.wager} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="text-yellow-500">Waiting for opponent</span>
                    </div>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3 mt-3">
                    <p className="text-yellow-500 text-sm font-medium">
                      💰 You will be charged {roomData.wager} ETH to join this battle
                    </p>
                  </div>
                </div>
              )}

              {/* Vault Code Section */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold">Your Vault Code</Label>

                {/* Vault Display */}
                <VaultDisplay
                  isOwner={true}
                  vaultDigits={vaultCode}
                  masked={false}
                  breachedIndices={[]}
                  label="Your Vault"
                />

                {/* Number Keypad */}
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
                    <Button
                      key={num}
                      variant="outline"
                      onClick={() => {
                        const emptyIndex = vaultCode.findIndex(
                          (digit) => digit === ""
                        );
                        if (
                          emptyIndex !== -1 &&
                          !vaultCode.includes(String(num))
                        ) {
                          handleVaultCodeChange(emptyIndex, String(num));
                        }
                      }}
                      disabled={vaultCode.includes(String(num))}
                      className="h-12 text-lg font-bold"
                    >
                      {num}
                    </Button>
                  ))}
                </div>

                {/* Utility Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={clearVaultCode}
                    className="flex-1"
                  >
                    Clear
                  </Button>
                  <Button
                    variant="outline"
                    onClick={generateRandomCode}
                    className="flex-1"
                  >
                    <Shuffle className="w-4 h-4 mr-2" />
                    Random
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <Button
                  onClick={handleJoinRoom}
                  disabled={!isFormValid || isJoining || isLoading || roomValidation.isChecking}
                  className="w-full h-12 text-lg font-bold"
                >
                  {isJoining || isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Joining Battle...
                    </>
                  ) : roomValidation.isChecking ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Checking Room...
                    </>
                  ) : (
                    "🎯 Join Vault Battle 🎯"
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="w-full"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Return Home
                </Button>
              </div>
            </div>
          </CyberCard>
        </div>
      </div>

      {/* Modals */}
      <ConnectWalletModal
        open={showConnectModal}
        onOpenChange={setShowConnectModal}
      />

      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
        onProceed={proceedWithJoining}
        showProceedButton={true}
      />
    </div>
  );
}
