import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Coins, Lock, Play } from 'lucide-react';
import { CyberButton } from '@/components/ui/cyber-button';
import { CyberInput } from '@/components/ui/cyber-input';
import { CyberCard, CyberCardContent, CyberCardHeader, CyberCardTitle } from '@/components/ui/cyber-card';
import MatrixBackground from '@/components/MatrixBackground';
import VaultIcon from '@/components/VaultIcon';
import { useToast } from '@/hooks/use-toast';

const CreateRoom = () => {
  const [wager, setWager] = useState('');
  const [vaultCode, setVaultCode] = useState(['', '', '', '']);
  const { toast } = useToast();

  const vaultOptions = ['🔒', '🔑', '⚡', '🛡️', '💎', '🔥', '❄️', '⭐'];

  const handleVaultCodeChange = (index: number, value: string) => {
    const newCode = [...vaultCode];
    newCode[index] = value;
    setVaultCode(newCode);
  };

  const handleCreateRoom = () => {
    if (!wager || vaultCode.some(code => !code)) {
      toast({
        title: "Incomplete Setup",
        description: "Please set your wager amount and complete vault code",
        variant: "destructive"
      });
      return;
    }

    const roomId = `VW-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    
    toast({
      title: "Room Created Successfully!",
      description: `Room ID: ${roomId}`,
    });

    // Navigate to game screen with room parameters
    setTimeout(() => {
      window.location.href = `/game?roomId=${roomId}&player=0x1234&opponent=0x5678&wager=${wager}`;
    }, 1500);
  };

  const isVaultComplete = vaultCode.every(code => code !== '');
  const isFormValid = wager && isVaultComplete;

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
            
            <h1 className="text-4xl md:text-5xl font-cyber font-bold text-primary text-glow mb-4">
              CREATE ROOM
            </h1>
            <p className="text-muted-foreground font-mono">
              Set up your vault and prepare for battle
            </p>
          </div>

          {/* Main Form */}
          <CyberCard className="animate-fade-in delay-300">
            <CyberCardHeader>
              <CyberCardTitle className="flex items-center gap-3">
                <Coins className="w-6 h-6" />
                Battle Configuration
              </CyberCardTitle>
            </CyberCardHeader>
            
            <CyberCardContent className="space-y-8">
              {/* Wager Input */}
              <div>
                <label className="block text-sm font-mono text-primary mb-3">
                  Wager Amount (ETH)
                </label>
                <CyberInput
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="0.100"
                  value={wager}
                  onChange={(e) => setWager(e.target.value)}
                  className="text-lg"
                />
                <p className="text-xs text-muted-foreground mt-2 font-mono">
                  Winner takes the vault. Choose wisely.
                </p>
              </div>

              {/* Vault Code Selection */}
              <div>
                <label className="block text-sm font-mono text-primary mb-3">
                  Vault Code (4 Elements)
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

              {/* Vault Preview */}
              <div className="text-center p-6 bg-card/30 rounded-lg cyber-border">
                <h3 className="text-lg font-mono text-primary mb-4">Vault Preview</h3>
                <VaultIcon 
                  variant={isVaultComplete ? "locked" : "unlocked"} 
                  size="xl" 
                  className="mx-auto mb-4"
                />
                <p className="text-sm text-muted-foreground font-mono">
                  {isVaultComplete ? "Vault secured and ready" : "Configure your vault code"}
                </p>
              </div>

              {/* Create Button */}
              <CyberButton
                size="lg"
                className="w-full"
                onClick={handleCreateRoom}
                disabled={!isFormValid}
              >
                <Play className="w-5 h-5" />
                Initialize Battle Room
              </CyberButton>
            </CyberCardContent>
          </CyberCard>
        </div>
      </div>
    </div>
  );
};

export default CreateRoom;