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
import { useVaultWarsContract } from "@/hooks/useVaultWarsContract";
import { useToast } from "@/hooks/use-toast";
import { Home, Shuffle, Loader2 } from "lucide-react";

export default function JoinRoom() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { isConnected } = useAccount();
  const { joinRoom } = useVaultWarsContract();
  const [roomId, setRoomId] = useState("");
  const [vaultCode, setVaultCode] = useState<string[]>(["", "", "", ""]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showInviteMessage, setShowInviteMessage] = useState(false);

  // Auto-fill room ID from URL params
  useEffect(() => {
    const urlRoomId = searchParams.get('room');
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
    const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const shuffled = numbers.sort(() => Math.random() - 0.5);
    setVaultCode(shuffled.slice(0, 4));
  };

  const isNumberAvailable = (number: string) => {
    return !vaultCode.includes(number);
  };

  const handleJoinRoom = async () => {
    if (!isConnected) {
      setShowConnectModal(true);
      return;
    }

    if (!roomId || !isVaultComplete) {
      toast({
        title: "Please complete the form",
        description: "Enter a room ID and set your 4-digit vault code.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    
    try {
      const code = vaultCode.map(Number);
      await joinRoom(roomId, code, "0.1"); // Mock wager
      
      toast({
        title: "Joined room successfully!",
        description: `Connected to room ${roomId}`,
      });

      // Navigate to game
      navigate(`/game?roomId=${roomId}&playerAddress=joiner&wager=0.1`);
    } catch (error) {
      toast({
        title: "Failed to join room",
        description: "Please check the room ID and try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const isVaultComplete = vaultCode.every(code => code !== "");
  const isFormValid = roomId && isVaultComplete;

  return (
    <div className="min-h-screen matrix-bg relative">
      <Navbar />
      <MatrixBackground />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <div className="max-w-2xl mx-auto w-full">
          {showInviteMessage && (
            <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg text-center cyber-border glow-primary animate-fade-in">
              <p className="text-primary font-medium">You've been invited to Vault Wars!</p>
              <p className="text-sm text-muted-foreground mt-1">Room ID autofilled from link</p>
            </div>
          )}
          
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-cyber font-bold text-accent text-glow mb-4">
              JOIN ROOM
            </h1>
            <p className="text-muted-foreground font-mono">
              Enter the battlefield and breach enemy vaults
            </p>
          </div>

          <CyberCard className="animate-fade-in delay-300">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center cyber-border">
                  <span className="text-accent">#</span>
                </div>
                <h2 className="text-xl font-cyber font-bold text-accent">Connection Protocol</h2>
              </div>
              {/* Room ID Input */}
              <div>
                <Label htmlFor="roomId" className="text-primary font-mono">
                  Room ID
                </Label>
                <Input
                  id="roomId"
                  type="text"
                  placeholder="Enter room ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="cyber-border mt-2 font-mono"
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
                <h3 className="text-sm font-mono text-primary mb-2">Your Vault</h3>
                <div className="text-2xl font-mono text-primary">
                  {isVaultComplete 
                    ? vaultCode.map(() => '●').join(' ')
                    : '_ _ _ _'
                  }
                </div>
              </div>

              {/* Join Button */}
              <Button
                onClick={handleJoinRoom}
                disabled={!isFormValid || isConnecting}
                className="w-full cyber-border bg-primary hover:bg-primary/90"
                size="lg"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Join Room"
                )}
              </Button>
            </div>
          </CyberCard>
        </div>
      </div>

      <ConnectWalletModal 
        open={showConnectModal} 
        onOpenChange={setShowConnectModal} 
      />
    </div>
  );
}