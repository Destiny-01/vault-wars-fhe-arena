import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CyberCard } from "@/components/ui/cyber-card";
import MatrixBackground from "@/components/MatrixBackground";
import VaultDisplay from "@/components/game/VaultDisplay";
import { Navbar } from "@/components/layout/Navbar";
import { ConnectWalletModal } from "@/components/wallet/ConnectWalletModal";
import { RoomCreatedModal } from "@/components/modals/RoomCreatedModal";
import { HowToPlayModal } from "@/components/modals/HowToPlayModal";
import { useVaultWarsContract } from "@/hooks/useVaultWarsContract";
import { useContractEvents } from "@/services/eventHandler";
import { useToast } from "@/hooks/use-toast";
import { Home, Shuffle } from "lucide-react";
import { initializeFHE } from "@/lib/fhe";

export default function CreateRoom() {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { toast } = useToast();

  // Contract integration with event handlers
  const eventHandlers = useContractEvents({
    onRoomCreated: (event) => {
      if (event.creator.toLowerCase() === address?.toLowerCase()) {
        setCreatedRoomId(event.roomId);
        setShowRoomCreatedModal(true);
      }
    },
  });

  const { createRoom, isLoading } = useVaultWarsContract(eventHandlers);

  const [wager, setWager] = useState("");
  const [vaultCode, setVaultCode] = useState<string[]>(["", "", "", ""]);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showRoomCreatedModal, setShowRoomCreatedModal] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [createdRoomId, setCreatedRoomId] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Initialize crypto on component mount
  useEffect(() => {
    initializeFHE().catch(console.error);
  }, []);

  // Show how to play modal first, then proceed with room creation
  useEffect(() => {
    setShowHowToPlay(true);
  }, []);

  const proceedWithCreation = () => {
    setShowHowToPlay(false);
  };

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
  const MIN_WAGER = 0.01;
  const isWagerValid = wager !== "" && parseFloat(wager) >= MIN_WAGER;
  const isFormValid = isVaultComplete && isWagerValid;

  const handleCreateRoom = async () => {
    // Show How to Play modal first if user clicked create room directly
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
        description:
          "Please enter a valid wager and complete 4-digit vault code.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreating(true);

      // Convert string array to number array
      const vaultNumbers = vaultCode.map(Number);

      toast({
        title: "🏦 Creating vault room...",
        description: "Encrypting your vault and submitting to blockchain.",
      });

      const roomId = await createRoom(vaultNumbers, wager);

      // Room created modal will be shown via event handler
    } catch (error: any) {
      console.error("Failed to create room:", error);
      // Error toast already shown by contract hook
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloseRoomCreatedModal = () => {
    setShowRoomCreatedModal(false);
    setCreatedRoomId("");
  };

  const handleGoToGame = () => {
    navigate(`/game/${createdRoomId}`);
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
                  ⚡ Create Vault Room ⚡
                </h1>
                <p className="text-muted-foreground">
                  Set your wager and secure your 4-digit vault code
                </p>
              </div>

              {/* Wager Input */}
              <div className="space-y-2">
                <Label htmlFor="wager" className="text-lg font-semibold">
                  Wager Amount (ETH)
                </Label>
                <Input
                  id="wager"
                  type="number"
                  step="0.01"
                  min={MIN_WAGER}
                  placeholder={`${MIN_WAGER} (minimum)`}
                  value={wager}
                  onChange={(e) => setWager(e.target.value)}
                  className="text-lg h-12"
                />
                <p className="text-sm text-muted-foreground">
                  Minimum wager: {MIN_WAGER} ETH
                </p>
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
                  onClick={handleCreateRoom}
                  disabled={!isFormValid || isCreating || isLoading}
                  className="w-full h-12 text-lg font-bold"
                >
                  {isCreating || isLoading ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                      Creating Room...
                    </>
                  ) : (
                    "⚡ Create Vault Room ⚡"
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

      <RoomCreatedModal
        open={showRoomCreatedModal}
        onOpenChange={handleCloseRoomCreatedModal}
        roomId={createdRoomId}
      />

      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
        onProceed={proceedWithCreation}
        showProceedButton={true}
      />
    </div>
  );
}
