import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Hash, Zap } from 'lucide-react';
import { CyberButton } from '@/components/ui/cyber-button';
import { CyberInput } from '@/components/ui/cyber-input';
import { CyberCard, CyberCardContent, CyberCardHeader, CyberCardTitle } from '@/components/ui/cyber-card';
import MatrixBackground from '@/components/MatrixBackground';
import { useToast } from '@/hooks/use-toast';

const JoinRoom = () => {
  const [roomId, setRoomId] = useState('');
  const [vaultCode, setVaultCode] = useState(['', '', '', '']);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const numberOptions = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

  const handleVaultCodeChange = (index: number, value: string) => {
    const newCode = [...vaultCode];
    newCode[index] = value;
    setVaultCode(newCode);
  };

  const generateRandomCode = () => {
    const shuffled = [...numberOptions].sort(() => Math.random() - 0.5);
    setVaultCode(shuffled.slice(0, 4));
  };

  const isNumberAvailable = (number: string) => {
    return !vaultCode.includes(number);
  };

  const handleJoinRoom = () => {
    if (!roomId || vaultCode.some(code => !code)) {
      toast({
        title: "Missing Information",
        description: "Please enter room ID and complete your vault code",
        variant: "destructive"
      });
      return;
    }

    // Check for duplicate numbers
    const uniqueNumbers = new Set(vaultCode);
    if (uniqueNumbers.size !== 4) {
      toast({
        title: "Invalid Vault Code",
        description: "Each digit must be unique (no repeating numbers)",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);
    
    // Simulate connection delay
    setTimeout(() => {
      setIsConnecting(false);
      toast({
        title: "Connection Established!",
        description: "Preparing for vault battle...",
      });

      // Navigate to game screen
      setTimeout(() => {
        window.location.href = `/game?roomId=${roomId}&player=0x5678&opponent=0x1234&wager=0.1&vaultCode=${vaultCode.join('')}`;
      }, 1000);
    }, 2000);
  };

  const isVaultComplete = vaultCode.every(code => code !== '');
  const isFormValid = roomId && isVaultComplete;

  return (
    <div className="min-h-screen matrix-bg relative">
      <MatrixBackground />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <div className="max-w-2xl mx-auto w-full">
          {/* Header */}
          <div className="mb-8 text-center animate-fade-in">
            <Link to="/" className="inline-flex items-center gap-2 text-primary hover:text-accent transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" />
              <span className="font-mono text-sm">Back to Base</span>
            </Link>
            
            <h1 className="text-4xl md:text-5xl font-cyber font-bold text-accent text-glow mb-4">
              JOIN ROOM
            </h1>
            <p className="text-muted-foreground font-mono">
              Enter the battlefield and breach enemy vaults
            </p>
          </div>

          {/* Main Form */}
          <CyberCard className="animate-fade-in delay-300">
            <CyberCardHeader>
              <CyberCardTitle className="flex items-center gap-3">
                <Hash className="w-6 h-6" />
                Connection Protocol
              </CyberCardTitle>
            </CyberCardHeader>
            
            <CyberCardContent className="space-y-8">
              {/* Room ID Input */}
              <div>
                <label className="block text-sm font-mono text-accent mb-3">
                  Room ID
                </label>
                <CyberInput
                  type="text"
                  placeholder="VW-XXXXXXXX"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  className="text-lg font-mono text-center tracking-widest"
                />
                <p className="text-xs text-muted-foreground mt-2 font-mono">
                  Enter the 8-character battle room identifier
                </p>
              </div>

              {/* Opponent's Vault (locked/hidden) */}
              <div className="text-center p-6 bg-card/30 rounded-lg cyber-border">
                <h3 className="text-lg font-mono text-accent mb-4">Opponent Vault — Encrypted</h3>
                <div className="text-4xl font-mono text-accent mb-4 opacity-60">
                  ● ● ● ●
                </div>
                <p className="text-sm text-muted-foreground font-mono">
                  Encrypted and secured. Ready to be breached.
                </p>
              </div>

              {/* Your Vault Code Selection */}
              <div>
                <label className="block text-sm font-mono text-primary mb-3">
                  Set Your Vault Code (4 digits)
                </label>
                
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {vaultCode.map((code, index) => (
                    <div key={index} className="text-center">
                      <div className="cyber-border rounded-lg p-4 h-20 flex items-center justify-center bg-card/50 mb-2">
                        {code ? (
                          <span className="text-3xl font-mono text-primary animate-pulse-glow">{code}</span>
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

                {/* Number Selector Keypad */}
                <div className="grid grid-cols-5 gap-2">
                  {numberOptions.map((number) => (
                    <CyberButton
                      key={number}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const emptyIndex = vaultCode.findIndex(code => !code);
                        if (emptyIndex !== -1 && isNumberAvailable(number)) {
                          handleVaultCodeChange(emptyIndex, number);
                        }
                      }}
                      className="text-lg h-12 font-mono"
                      disabled={!isNumberAvailable(number)}
                    >
                      {number}
                    </CyberButton>
                  ))}
                </div>

                <div className="flex justify-between mt-4">
                  <CyberButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setVaultCode(['', '', '', ''])}
                  >
                    Clear All
                  </CyberButton>
                  
                  <CyberButton
                    variant="ghost"
                    size="sm"
                    onClick={generateRandomCode}
                  >
                    Randomize Code
                  </CyberButton>
                  
                  <span className="text-xs font-mono text-muted-foreground">
                    {vaultCode.filter(code => code).length}/4 selected
                  </span>
                </div>
              </div>

              {/* Your Vault Preview */}
              <div className="text-center p-6 bg-card/30 rounded-lg cyber-border">
                <h3 className="text-lg font-mono text-primary mb-4">Your Vault</h3>
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

              {/* Join Button */}
              <CyberButton
                variant="accent"
                size="lg"
                className="w-full"
                onClick={handleJoinRoom}
                disabled={!isFormValid || isConnecting}
              >
                {isConnecting ? (
                  <>
                    <div className="animate-spin">⚡</div>
                    Connecting to Battle...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Join Room
                  </>
                )}
              </CyberButton>
            </CyberCardContent>
          </CyberCard>
        </div>
      </div>
    </div>
  );
};

export default JoinRoom;