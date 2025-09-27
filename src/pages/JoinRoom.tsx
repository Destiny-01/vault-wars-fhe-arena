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
import { useVaultWarsContract } from "@/hooks/useVaultWarsContract";
import { useContractEvents } from "@/services/eventHandler";
import { initializeCrypto } from "@/crypto";
import { useToast } from "@/hooks/use-toast";
import { Home, Shuffle, Loader2 } from "lucide-react";

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
        navigate(`/game?roomId=${roomId}&playerAddress=${address}&opponentAddress=${event.roomId}&wager=0.1`);
      }
    },
  });
  
  const { joinRoom, roomExists, isLoading } = useVaultWarsContract(eventHandlers);
  
  const [roomId, setRoomId] = useState("");
  const [vaultCode, setVaultCode] = useState<string[]>(["", "", "", ""]);
  const [isJoining, setIsJoining] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showInviteMessage, setShowInviteMessage] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  // Initialize crypto on component mount
  useEffect(() => {
    initializeCrypto().catch(console.error);
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
    const urlRoomId = searchParams.get('room') || searchParams.get('roomId');
    if (urlRoomId) {
      setRoomId(urlRoomId);
      setShowInviteMessage(true);
    }
  }, [searchParams]);

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

  const isVaultComplete = vaultCode.every(digit => digit !== "");
  const isRoomIdValid = roomId.length === 4 && /^\d{4}$/.test(roomId);
  const isFormValid = isVaultComplete && isRoomIdValid;

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
        description: "Please enter a valid room ID and complete 4-digit vault code.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsJoining(true);
      
      // Check if room exists first
      const exists = await roomExists(roomId);
      if (!exists) {
        toast({
          title: "❌ Room not found",
          description: `Room ${roomId} does not exist or has expired.`,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "🔐 Joining vault battle...",
        description: "Encrypting your vault and connecting to the battle.",
      });

      // Convert string array to number array
      const vaultNumbers = vaultCode.map(Number);
      
      await joinRoom(roomId, vaultNumbers, '0.1'); // TODO: Get wager from room metadata
      
      // Navigation will be handled by event handler
    } catch (error: any) {
      console.error('Failed to join room:', error);
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
                <Input
                  id="roomId"
                  type="text"
                  placeholder="Enter 4-digit room ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  maxLength={4}
                  className="text-lg h-12 text-center"
                />
              </div>

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
                        const emptyIndex = vaultCode.findIndex(digit => digit === "");
                        if (emptyIndex !== -1 && !vaultCode.includes(String(num))) {
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
                  disabled={!isFormValid || isJoining || isLoading}
                  className="w-full h-12 text-lg font-bold"
                >
                  {isJoining || isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Joining Battle...
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