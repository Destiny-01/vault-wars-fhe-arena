import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import { Contract, ethers } from 'ethers';
import { eventHandler, EventHandlers } from '@/services/eventHandler';
import { encryptVault, encryptGuess, decryptResult } from '@/crypto';

// Contract ABI - Will be replaced with actual ABI when provided
const VAULT_WARS_ABI = [
  // Read Functions
  {
    inputs: [{ name: 'roomId', type: 'uint256' }],
    name: 'roomExists',
    outputs: [{ name: 'exists', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'roomId', type: 'uint256' }],
    name: 'getRoom',
    outputs: [
      { name: 'creator', type: 'address' },
      { name: 'opponent', type: 'address' },
      { name: 'wager', type: 'uint256' },
      { name: 'phase', type: 'uint8' },
      { name: 'turnCount', type: 'uint256' },
      { name: 'encryptedWinner', type: 'bytes' },
      { name: 'createdAt', type: 'uint256' },
      { name: 'lastActiveAt', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'roomId', type: 'uint256' },
      { name: 'turnIndex', type: 'uint256' }
    ],
    name: 'getProbe',
    outputs: [
      { name: 'submitter', type: 'address' },
      { name: 'encryptedGuess', type: 'bytes' },
      { name: 'encryptedBreaches', type: 'bytes' },
      { name: 'encryptedSignals', type: 'bytes' },
      { name: 'isWinningProbe', type: 'bool' },
      { name: 'timestamp', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'roomId', type: 'uint256' }],
    name: 'getLastResultEncrypted',
    outputs: [
      { name: 'breaches', type: 'bytes' },
      { name: 'signals', type: 'bytes' }
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'roomId', type: 'uint256' },
      { name: 'player', type: 'address' }
    ],
    name: 'isPlayerTurn',
    outputs: [{ name: 'isTurn', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'player', type: 'address' }],
    name: 'getPlayerWins',
    outputs: [{ name: 'wins', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  
  // Write Functions
  {
    inputs: [{ name: 'encryptedVault', type: 'bytes' }],
    name: 'createRoom',
    outputs: [{ name: 'roomId', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'roomId', type: 'uint256' },
      { name: 'encryptedVault', type: 'bytes' }
    ],
    name: 'joinRoom',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'roomId', type: 'uint256' },
      { name: 'encryptedGuess', type: 'bytes' }
    ],
    name: 'submitProbe',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'roomId', type: 'uint256' }],
    name: 'cancelRoom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'roomId', type: 'uint256' }],
    name: 'claimTimeout',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'roomId', type: 'uint256' }],
    name: 'requestWinnerDecryption',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },

  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'roomId', type: 'uint256' },
      { indexed: true, name: 'creator', type: 'address' },
      { indexed: false, name: 'wager', type: 'uint256' },
      { indexed: false, name: 'token', type: 'address' }
    ],
    name: 'RoomCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'roomId', type: 'uint256' },
      { indexed: true, name: 'opponent', type: 'address' }
    ],
    name: 'RoomJoined',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'roomId', type: 'uint256' },
      { indexed: true, name: 'who', type: 'address' }
    ],
    name: 'VaultSubmitted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'roomId', type: 'uint256' },
      { indexed: false, name: 'turnIndex', type: 'uint256' },
      { indexed: true, name: 'submitter', type: 'address' }
    ],
    name: 'ProbeSubmitted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'roomId', type: 'uint256' },
      { indexed: false, name: 'turnIndex', type: 'uint256' },
      { indexed: true, name: 'submitter', type: 'address' },
      { indexed: false, name: 'isWin', type: 'bool' },
      { indexed: false, name: 'signedResult', type: 'bytes' }
    ],
    name: 'ResultComputed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'roomId', type: 'uint256' },
      { indexed: false, name: 'requestId', type: 'uint256' }
    ],
    name: 'DecryptionRequested',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'roomId', type: 'uint256' },
      { indexed: false, name: 'winner', type: 'address' },
      { indexed: false, name: 'signature', type: 'bytes' }
    ],
    name: 'WinnerDecrypted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'roomId', type: 'uint256' },
      { indexed: false, name: 'winner', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' }
    ],
    name: 'GameFinished',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'roomId', type: 'uint256' },
      { indexed: true, name: 'by', type: 'address' }
    ],
    name: 'RoomCancelled',
    type: 'event',
  }
] as const;

// Contract address - replace with actual deployed address
const VAULT_WARS_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000';

// Contract configuration
export const contractConfig = {
  address: VAULT_WARS_CONTRACT_ADDRESS,
  abi: VAULT_WARS_ABI,
} as const;

// Room phase enum
export enum RoomPhase {
  WAITING_FOR_JOIN = 0,
  IN_PROGRESS = 1,
  COMPLETED = 2,
  CANCELLED = 3,
}

// Enhanced room metadata type
export interface RoomMetadata {
  creator: string;
  opponent: string;
  wager: string;
  phase: RoomPhase;
  turnCount: number;
  encryptedWinner?: string;
  createdAt: number;
  lastActiveAt: number;
  winner?: string; // Decrypted winner when available
}

// Probe metadata type
export interface ProbeMetadata {
  submitter: string;
  encryptedGuess: string;
  encryptedBreaches?: string;
  encryptedSignals?: string;
  isWinningProbe: boolean;
  timestamp: number;
  // Decrypted results (when available)
  breaches?: number;
  signals?: number;
}

export function useVaultWarsContract(eventHandlers?: EventHandlers) {
  const { address } = useAccount();
  const { writeContract } = useWriteContract();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [contract, setContract] = useState<Contract | null>(null);
  const [roomCache, setRoomCache] = useState<Map<string, RoomMetadata>>(new Map());
  const [probeCache, setProbeCache] = useState<Map<string, ProbeMetadata[]>>(new Map());

  // Initialize contract and event handlers
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contractInstance = new Contract(
        VAULT_WARS_CONTRACT_ADDRESS,
        VAULT_WARS_ABI,
        provider
      );
      
      setContract(contractInstance);
      
      // Initialize event handler
      if (eventHandlers) {
        eventHandler.initialize(contractInstance, eventHandlers);
      }

      return () => {
        eventHandler.cleanup();
      };
    }
  }, [eventHandlers]);

  // Read player wins
  const { data: playerWins, refetch: refetchWins } = useReadContract({
    ...contractConfig,
    functionName: 'getPlayerWins',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Cache management
  const updateRoomCache = useCallback((roomId: string, roomData: RoomMetadata) => {
    setRoomCache(prev => new Map(prev).set(roomId, roomData));
  }, []);

  const updateProbeCache = useCallback((roomId: string, probes: ProbeMetadata[]) => {
    setProbeCache(prev => new Map(prev).set(roomId, probes));
  }, []);

  // Read Functions
  const getRoom = async (roomId: string): Promise<RoomMetadata | null> => {
    try {
      // Check cache first
      const cached = roomCache.get(roomId);
      if (cached) return cached;

      setIsLoading(true);
      
      if (!contract) {
        // Mock implementation for development
        const mockRoom: RoomMetadata = {
          creator: '0x1234567890123456789012345678901234567890',
          opponent: '0x0987654321098765432109876543210987654321',
          wager: '0.1',
          phase: RoomPhase.WAITING_FOR_JOIN,
          turnCount: 0,
          createdAt: Date.now() - 300000, // 5 minutes ago
          lastActiveAt: Date.now() - 60000, // 1 minute ago
        };
        updateRoomCache(roomId, mockRoom);
        return mockRoom;
      }

      const result = await contract.getRoom(BigInt(roomId));
      const roomData: RoomMetadata = {
        creator: result.creator,
        opponent: result.opponent,
        wager: formatEther(result.wager),
        phase: result.phase,
        turnCount: result.turnCount.toNumber(),
        encryptedWinner: result.encryptedWinner,
        createdAt: result.createdAt.toNumber() * 1000,
        lastActiveAt: result.lastActiveAt.toNumber() * 1000,
      };
      
      updateRoomCache(roomId, roomData);
      return roomData;
    } catch (error) {
      console.error('Error fetching room:', error);
      toast({
        title: "Failed to load room",
        description: "Could not fetch room data from contract.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const roomExists = async (roomId: string): Promise<boolean> => {
    try {
      if (!contract) {
        // Mock implementation for development
        return roomId.length === 4 && !isNaN(Number(roomId));
      }

      const result = await contract.roomExists(BigInt(roomId));
      return result;
    } catch (error) {
      console.error('Error checking room existence:', error);
      return false;
    }
  };

  const getProbe = async (roomId: string, turnIndex: number): Promise<ProbeMetadata | null> => {
    try {
      if (!contract) {
        // Mock implementation
        return {
          submitter: '0x1234567890123456789012345678901234567890',
          encryptedGuess: btoa(`guess_${turnIndex}_encrypted`),
          encryptedBreaches: btoa(`breaches_${turnIndex}`),
          encryptedSignals: btoa(`signals_${turnIndex}`),
          isWinningProbe: false,
          timestamp: Date.now(),
          breaches: Math.floor(Math.random() * 5),
          signals: Math.floor(Math.random() * 4),
        };
      }

      const result = await contract.getProbe(BigInt(roomId), BigInt(turnIndex));
      return {
        submitter: result.submitter,
        encryptedGuess: result.encryptedGuess,
        encryptedBreaches: result.encryptedBreaches,
        encryptedSignals: result.encryptedSignals,
        isWinningProbe: result.isWinningProbe,
        timestamp: result.timestamp.toNumber() * 1000,
      };
    } catch (error) {
      console.error('Error fetching probe:', error);
      return null;
    }
  };

  const getLastResultEncrypted = async (roomId: string): Promise<{ breaches: string; signals: string } | null> => {
    try {
      if (!contract) {
        return {
          breaches: btoa('encrypted_breaches'),
          signals: btoa('encrypted_signals'),
        };
      }

      const result = await contract.getLastResultEncrypted(BigInt(roomId));
      return {
        breaches: result.breaches,
        signals: result.signals,
      };
    } catch (error) {
      console.error('Error fetching encrypted result:', error);
      return null;
    }
  };

  const isPlayerTurn = async (roomId: string, playerAddress: string): Promise<boolean> => {
    try {
      if (!contract) {
        // Mock: alternating turns
        return true;
      }

      const result = await contract.isPlayerTurn(BigInt(roomId), playerAddress);
      return result;
    } catch (error) {
      console.error('Error checking player turn:', error);
      return false;
    }
  };

  const getPlayerWins = async (playerAddress: string): Promise<number> => {
    try {
      if (!contract) {
        // Mock implementation
        return Math.floor(Math.random() * 10);
      }

      const result = await contract.getPlayerWins(playerAddress);
      return result.toNumber();
    } catch (error) {
      console.error('Error fetching player wins:', error);
      return 0;
    }
  };

  // Write Functions
  const createRoom = async (vaultCode: number[], wager: string): Promise<string> => {
    if (!address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create a room.",
        variant: "destructive",
      });
      throw new Error('Wallet not connected');
    }

    try {
      setIsLoading(true);
      
      // Encrypt vault using crypto module
      const encryptedVault = await encryptVault(vaultCode);
      
      toast({
        title: "⚡ Encrypting vault...",
        description: "Securing your code with FHE encryption.",
      });

      if (!contract) {
        // Mock implementation for development
        await new Promise(resolve => setTimeout(resolve, 2000));
        const roomId = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
        
        toast({
          title: "🏦 Room created successfully!",
          description: `Room ID: ${roomId}. Share this with your opponent.`,
        });
        
        return roomId;
      }

      // Real contract call
      const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
      const contractWithSigner = contract.connect(signer);
      const tx = await contractWithSigner.createRoom(encryptedVault, {
        value: parseEther(wager),
      });
      
      toast({
        title: "📡 Transaction submitted...",
        description: "Waiting for blockchain confirmation.",
      });

      const receipt = await tx.wait();
      
      // Extract room ID from event
      const roomCreatedEvent = receipt.events?.find(
        (event: any) => event.event === 'RoomCreated'
      );
      const roomId = roomCreatedEvent?.args?.roomId?.toString() || '0000';
      
      return roomId;
    } catch (error: any) {
      console.error('Error creating room:', error);
      toast({
        title: "❌ Failed to create room",
        description: error.message || "Transaction failed or was rejected.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const joinRoom = async (roomId: string, vaultCode: number[], wager: string): Promise<void> => {
    if (!address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to join a room.",
        variant: "destructive",
      });
      throw new Error('Wallet not connected');
    }

    try {
      setIsLoading(true);
      
      // Check if room exists first
      const exists = await roomExists(roomId);
      if (!exists) {
        throw new Error('Room does not exist');
      }
      
      // Encrypt vault using crypto module
      const encryptedVault = await encryptVault(vaultCode);
      
      toast({
        title: "⚡ Encrypting vault...",
        description: "Securing your code with FHE encryption.",
      });

      if (!contract) {
        // Mock implementation for development
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        toast({
          title: "🎯 Joined room successfully!",
          description: `Connected to room ${roomId}. Battle begins!`,
        });
        return;
      }

      // Real contract call
      const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
      const contractWithSigner = contract.connect(signer);
      const tx = await contractWithSigner.joinRoom(BigInt(roomId), encryptedVault, {
        value: parseEther(wager),
      });
      
      toast({
        title: "📡 Transaction submitted...",
        description: "Joining the vault battle.",
      });

      await tx.wait();
      
      toast({
        title: "🎯 Joined room successfully!",
        description: `Connected to room ${roomId}. Battle begins!`,
      });
    } catch (error: any) {
      console.error('Error joining room:', error);
      toast({
        title: "❌ Failed to join room",
        description: error.message || "Transaction failed or room doesn't exist.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const submitProbe = async (roomId: string, guessCode: number[]): Promise<void> => {
    if (!address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to submit a probe.",
        variant: "destructive",
      });
      throw new Error('Wallet not connected');
    }

    try {
      setIsLoading(true);
      
      // Encrypt guess using crypto module
      const encryptedGuess = await encryptGuess(guessCode);
      
      toast({
        title: "🔍 Launching probe...",
        description: "Encrypting your guess and submitting to blockchain.",
      });

      if (!contract) {
        // Mock implementation for development
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        toast({
          title: "🚀 Probe launched!",
          description: "Your encrypted guess has been submitted.",
        });
        return;
      }

      // Real contract call
      const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
      const contractWithSigner = contract.connect(signer);
      const tx = await contractWithSigner.submitProbe(BigInt(roomId), encryptedGuess);
      
      await tx.wait();
      
      toast({
        title: "🚀 Probe launched!",
        description: "Your encrypted guess has been submitted.",
      });
    } catch (error: any) {
      console.error('Error submitting probe:', error);
      toast({
        title: "❌ Failed to submit probe",
        description: error.message || "Transaction failed.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelRoom = async (roomId: string): Promise<void> => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    try {
      setIsLoading(true);
      
      if (!contract) {
        // Mock implementation
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        toast({
          title: "🚫 Room cancelled",
          description: "The game room has been cancelled and wager refunded.",
        });
        return;
      }

      const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
      const contractWithSigner = contract.connect(signer);
      const tx = await contractWithSigner.cancelRoom(BigInt(roomId));
      await tx.wait();
      
      toast({
        title: "🚫 Room cancelled",
        description: "The game room has been cancelled and wager refunded.",
      });
    } catch (error: any) {
      console.error('Error cancelling room:', error);
      toast({
        title: "❌ Failed to cancel room",
        description: error.message || "Transaction failed.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const claimTimeout = async (roomId: string): Promise<void> => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    try {
      setIsLoading(true);
      
      if (!contract) {
        // Mock implementation
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        toast({
          title: "⏰ Timeout claimed",
          description: "You win by timeout! Wager has been transferred.",
        });
        return;
      }

      const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
      const contractWithSigner = contract.connect(signer);
      const tx = await contractWithSigner.claimTimeout(BigInt(roomId));
      await tx.wait();
      
      toast({
        title: "⏰ Timeout claimed",
        description: "You win by timeout! Wager has been transferred.",
      });
    } catch (error: any) {
      console.error('Error claiming timeout:', error);
      toast({
        title: "❌ Failed to claim timeout",
        description: error.message || "Transaction failed.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const requestWinnerDecryption = async (roomId: string): Promise<void> => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    try {
      setIsLoading(true);
      
      toast({
        title: "🔓 Requesting decryption...",
        description: "Asking gateway to decrypt the winner.",
      });

      if (!contract) {
        // Mock implementation
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        toast({
          title: "🔍 Decryption requested",
          description: "Gateway is processing winner decryption.",
        });
        return;
      }

      const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
      const contractWithSigner = contract.connect(signer);
      const tx = await contractWithSigner.requestWinnerDecryption(BigInt(roomId));
      await tx.wait();
      
      toast({
        title: "🔍 Decryption requested",
        description: "Gateway is processing winner decryption.",
      });
    } catch (error: any) {
      console.error('Error requesting decryption:', error);
      toast({
        title: "❌ Failed to request decryption",
        description: error.message || "Transaction failed.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // State
    isLoading,
    playerWins: playerWins ? Number(playerWins) : 0,
    contract,
    
    // Cache
    roomCache,
    probeCache,
    updateRoomCache,
    updateProbeCache,
    
    // Read Functions
    getRoom,
    roomExists,
    getProbe,
    getLastResultEncrypted,
    isPlayerTurn,
    getPlayerWins,
    
    // Write Functions
    createRoom,
    joinRoom,
    submitProbe,
    cancelRoom,
    claimTimeout,
    requestWinnerDecryption,
    
    // Utils
    refetchWins,
    contractConfig,
  };
}