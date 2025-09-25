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
import { useToast } from "@/hooks/use-toast";
import { Home, Shuffle } from "lucide-react";

export default function CreateRoom() {
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const { createRoom } = useVaultWarsContract();
  const { toast } = useToast();
  
  const [wager, setWager] = useState("");
  const [vaultCode, setVaultCode] = useState<string[]>(["", "", "", ""]);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showRoomCreatedModal, setShowRoomCreatedModal] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [createdRoomId, setCreatedRoomId] = useState("");

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
    <div className="min-h-screen matrix-bg relative">
      <Navbar />
      <MatrixBackground />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <div className="max-w-2xl mx-auto w-full">
          {/* Header */}
          <div className="mb-8 text-center animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-cyber font-bold text-primary text-glow mb-4">
              CREATE ROOM
            </h1>
            <p className="text-muted-foreground font-mono">
              Set up your vault and prepare for battle
            </p>
          </div>

          <CyberCard className="animate-fade-in delay-300">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center cyber-border">
                  <span className="text-primary">⚡</span>
                </div>
                <h2 className="text-xl font-cyber font-bold text-primary">Battle Configuration</h2>
              </div>
              <div className="space-y-8">
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
                    className="input-cyber mt-2 text-lg"
                  />
                  <p className="text-xs text-muted-foreground mt-2 font-mono">
                    Winner takes the vault. Choose wisely.
                  </p>
                </div>

                {/* Vault Code Selection */}
                <div>
                  <Label className="text-primary font-mono mb-3 block">
                    Set Your Vault Code (4 digits)
                  </Label>
                  {/* Vault Code Display */}
                  <div className="grid grid-cols-4 gap-4 mt-2 mb-6">
                    {vaultCode.map((code, index) => (
                      <div key={index} className="text-center">
                        <div className="cyber-border rounded-lg p-4 h-20 flex items-center justify-center bg-card/50 mb-2">
                          {code ? (
                            <span className="text-3xl font-mono text-primary animate-pulse glow-primary">{code}</span>
                          ) : (
                            <span className="text-3xl text-muted-foreground">_</span>
                          )}
                        </div>
                        <span className="text-xs font-mono text-muted-foreground">
                          Digit {index + 1}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Number Keypad */}
                  <div className="grid grid-cols-5 gap-2 mb-6">
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
                        className="btn-cyber h-12 text-lg font-mono"
                      >
                        {number}
                      </Button>
                    ))}
                  </div>

                  <div className="flex justify-between items-center mb-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setVaultCode(['', '', '', ''])}
                      className="text-muted-foreground hover:text-primary"
                    >
                      Clear All
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={generateRandomCode}
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Shuffle className="w-4 h-4 mr-2" />
                      Randomize Code
                    </Button>
                    
                    <span className="text-xs font-mono text-muted-foreground">
                      {vaultCode.filter(code => code).length}/4 selected
                    </span>
                  </div>
                </div>

                {/* Vault Preview */}
                <div className="text-center p-6 bg-card/30 rounded-lg cyber-border">
                  <h3 className="text-lg font-mono text-primary mb-4">Vault Preview</h3>
                  <div className="text-4xl font-mono text-primary mb-4">
                    {isVaultComplete 
                      ? vaultCode.map(() => '●').join(' ')
                      : '_ _ _ _'
                    }
                  </div>
                  <p className="text-sm text-muted-foreground font-mono">
                    {isVaultComplete ? "Vault secured and ready" : "Configure your vault code"}
                  </p>
                </div>

                {/* Create Button */}
                <Button
                  onClick={handleCreateRoom}
                  disabled={!isFormValid}
                  className="btn-cyber-primary w-full"
                  size="lg"
                >
                  <span className="text-lg">Create Room</span>
                </Button>
              </div>
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

      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => navigate('/')}
        onProceed={proceedWithCreation}
        showProceedButton={true}
      />
    </div>
  );
}