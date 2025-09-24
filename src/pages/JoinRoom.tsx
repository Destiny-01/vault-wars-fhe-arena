import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Hash, Lock, Zap } from 'lucide-react';
import { CyberButton } from '@/components/ui/cyber-button';
import { CyberInput } from '@/components/ui/cyber-input';
import { CyberCard, CyberCardContent, CyberCardHeader, CyberCardTitle } from '@/components/ui/cyber-card';
import MatrixBackground from '@/components/MatrixBackground';
import VaultIcon from '@/components/VaultIcon';
import { useToast } from '@/hooks/use-toast';

const JoinRoom = () => {
  const [roomId, setRoomId] = useState('');
  const [vaultCode, setVaultCode] = useState(['', '', '', '']);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const vaultOptions = ['🔒', '🔑', '⚡', '🛡️', '💎', '🔥', '❄️', '⭐'];

  const handleVaultCodeChange = (index: number, value: string) => {
    const newCode = [...vaultCode];
    newCode[index] = value;
    setVaultCode(newCode);
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
        window.location.href = `/game?roomId=${roomId}&player=0x5678&opponent=0x1234&wager=0.1`;
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
                <h3 className="text-lg font-mono text-accent mb-4">Opponent's Vault</h3>
                <VaultIcon 
                  variant="locked" 
                  size="xl" 
                  className="mx-auto mb-4 opacity-60"
                />
                <p className="text-sm text-muted-foreground font-mono">
                  Encrypted and secured. Ready to be breached.
                </p>
              </div>

              {/* Your Vault Code Selection */}
              <div>
                <label className="block text-sm font-mono text-primary mb-3">
                  Your Vault Code (4 Elements)
                </label>
                
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {vaultCode.map((code, index) => (
                    <div key={index} className="text-center">
                      <div className="cyber-border rounded-lg p-4 h-20 flex items-center justify-center bg-card/50 mb-2">
                        {code ? (
                          <span className="text-3xl animate-pulse-glow">{code}</span>
                        ) : (
                          <Lock className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      <span className="text-xs font-mono text-muted-foreground">
                        Slot {index + 1}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Vault Option Selector */}
                <div className="grid grid-cols-4 gap-2">
                  {vaultOptions.map((option, index) => (
                    <CyberButton
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const emptyIndex = vaultCode.findIndex(code => !code);
                        if (emptyIndex !== -1) {
                          handleVaultCodeChange(emptyIndex, option);
                        }
                      }}
                      className="text-lg h-12"
                      disabled={vaultCode.includes(option)}
                    >
                      {option}
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
                  
                  <span className="text-xs font-mono text-muted-foreground">
                    {vaultCode.filter(code => code).length}/4 selected
                  </span>
                </div>
              </div>

              {/* Your Vault Preview */}
              <div className="text-center p-6 bg-card/30 rounded-lg cyber-border">
                <h3 className="text-lg font-mono text-primary mb-4">Your Vault</h3>
                <VaultIcon 
                  variant={isVaultComplete ? "locked" : "unlocked"} 
                  size="xl" 
                  className="mx-auto mb-4"
                />
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
                    Enter Battle Room
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