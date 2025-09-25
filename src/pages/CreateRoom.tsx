import { useState } from "react";
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
import { useVaultWarsContract } from "@/hooks/useVaultWarsContract";
import { useToast } from "@/hooks/use-toast";
import { Home, Shuffle } from "lucide-react";

export default function CreateRoom() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isConnected } = useAccount();
  const { createRoom } = useVaultWarsContract();
  const [wager, setWager] = useState("");
  const [vaultCode, setVaultCode] = useState<string[]>(["", "", "", ""]);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showRoomCreatedModal, setShowRoomCreatedModal] = useState(false);
  const [createdRoomId, setCreatedRoomId] = useState("");

  const handleVaultCodeChange = (index: number, value: string) => {
    if (value === "" || (/^\d$/.test(value) && !vaultCode.includes(value))) {
      const newCode = [...vaultCode];
      newCode[index] = value;
      setVaultCode(newCode);
    }
  };

  const generateRandomCode = () => {
    const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const shuffled = numbers.sort(() => Math.random() - 0.5);
    setVaultCode(shuffled.slice(0, 4));
  };

  const isNumberAvailable = (number: string) => {
    return !vaultCode.includes(number);
  };

  const handleCreateRoom = async () => {
    if (!isConnected) {
      setShowConnectModal(true);
      return;
    }

    if (!wager || !isVaultComplete) {
      toast({
        title: "Please complete the form",
        description: "Enter a wager amount and set your 4-digit vault code.",
        variant: "destructive",
      });
      return;
    }

    try {
      const code = vaultCode.map(Number);
      const roomId = await createRoom(code, wager);
      
      setCreatedRoomId(roomId);
      setShowRoomCreatedModal(true);
      
      // Auto-navigate to game after showing modal
      setTimeout(() => {
        navigate(`/game?roomId=${roomId}&playerAddress=creator&wager=${wager}`);
      }, 3000);
    } catch (error) {
      toast({
        title: "Failed to create room",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const isVaultComplete = vaultCode.every(code => code !== "");
  const isFormValid = wager && isVaultComplete;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      <Navbar />
      <MatrixBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-4 font-mono">
              CREATE ROOM
            </h1>
            <p className="text-muted-foreground">Set up your vault and place your wager</p>
          </div>

          <CyberCard className="p-6">
            <div className="space-y-6">
              {/* Wager Input */}
              <div>
                <Label htmlFor="wager" className="text-primary font-mono">
                  Enter Wager Amount (ETH)
                </Label>
                <Input
                  id="wager"
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="0.100"
                  value={wager}
                  onChange={(e) => setWager(e.target.value)}
                  className="cyber-border mt-2"
                />
              </div>

              {/* Vault Code Selection */}
              <div>
                <Label className="text-primary font-mono">
                  Set Your Vault Code (4 digits)
                </Label>
                
                {/* Vault Code Display */}
                <div className="grid grid-cols-4 gap-2 mt-2 mb-4">
                  {vaultCode.map((code, index) => (
                    <div key={index} className="aspect-square">
                      <div className="w-full h-full border border-primary/30 rounded-md flex items-center justify-center bg-card/50">
                        {code ? (
                          <span className="text-2xl font-mono text-primary">{code}</span>
                        ) : (
                          <span className="text-2xl text-muted-foreground">_</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Number Keypad */}
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].map((number) => (
                    <Button
                      key={number}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const emptyIndex = vaultCode.findIndex(code => !code);
                        if (emptyIndex !== -1 && isNumberAvailable(number)) {
                          handleVaultCodeChange(emptyIndex, number);
                        }
                      }}
                      disabled={!isNumberAvailable(number)}
                      className="cyber-border aspect-square"
                    >
                      {number}
                    </Button>
                  ))}
                </div>

                <div className="flex justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setVaultCode(['', '', '', ''])}
                  >
                    Clear All
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={generateRandomCode}
                  >
                    <Shuffle className="w-4 h-4 mr-2" />
                    Randomize Code
                  </Button>
                </div>
              </div>

              {/* Vault Preview */}
              <div className="text-center p-4 bg-card/30 rounded-lg border border-primary/20">
                <h3 className="text-sm font-mono text-primary mb-2">Vault Preview</h3>
                <div className="text-2xl font-mono text-primary">
                  {isVaultComplete 
                    ? vaultCode.map(() => '●').join(' ')
                    : '_ _ _ _'
                  }
                </div>
              </div>

              {/* Create Button */}
              <Button
                onClick={handleCreateRoom}
                disabled={!isFormValid}
                className="w-full cyber-border bg-primary hover:bg-primary/90"
                size="lg"
              >
                Create Room
              </Button>
            </div>
          </CyberCard>
        </div>
      </div>

      <ConnectWalletModal 
        open={showConnectModal} 
        onOpenChange={setShowConnectModal} 
      />
      
      <RoomCreatedModal
        open={showRoomCreatedModal}
        onOpenChange={setShowRoomCreatedModal}
        roomId={createdRoomId}
      />
    </div>
  );
}