import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { useState } from 'react';
import { useToast } from './use-toast';

// Contract ABI - replace with actual ABI when available
const VAULT_WARS_ABI = [
  {
    inputs: [{ name: 'player', type: 'address' }],
    name: 'getPlayerWins',
    outputs: [{ name: 'wins', type: 'uint256' }],
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
      { name: 'status', type: 'uint8' },
      { name: 'winner', type: 'address' }
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'roomId', type: 'uint256' }],
    name: 'roomExists',
    outputs: [{ name: 'exists', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'encryptedVault', type: 'bytes32' }],
    name: 'createRoom',
    outputs: [{ name: 'roomId', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'roomId', type: 'uint256' },
      { name: 'encryptedVault', type: 'bytes32' }
    ],
    name: 'joinRoom',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
] as const;

// Contract address - replace with actual deployed address
const VAULT_WARS_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000';

// Contract configuration
export const contractConfig = {
  address: VAULT_WARS_CONTRACT_ADDRESS,
  abi: VAULT_WARS_ABI,
} as const;

// Room status enum
export enum RoomStatus {
  WAITING = 0,
  ACTIVE = 1,
  COMPLETED = 2,
}

// Room metadata type
export interface RoomMetadata {
  creator: string;
  opponent: string;
  wager: string;
  status: RoomStatus;
  winner: string;
}

export function useVaultWarsContract() {
  const { address } = useAccount();
  const { writeContract } = useWriteContract();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Read player wins
  const { data: playerWins, refetch: refetchWins } = useReadContract({
    ...contractConfig,
    functionName: 'getPlayerWins',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Helper function to encrypt vault code (placeholder)
  const encryptVaultCode = (code: number[]): string => {
    // TODO: Implement proper encryption
    return `0x${code.join('')}${'0'.repeat(56)}`;
  };

  // Read Functions
  const getRoom = async (roomId: string): Promise<RoomMetadata | null> => {
    try {
      setIsLoading(true);
      
      // TODO: Replace with actual contract read
      // const result = await readContract({
      //   ...contractConfig,
      //   functionName: 'getRoom',
      //   args: [BigInt(roomId)],
      // });
      
      // Mock implementation
      const mockRoom: RoomMetadata = {
        creator: '0x1234567890123456789012345678901234567890',
        opponent: '0x0987654321098765432109876543210987654321',
        wager: '0.1',
        status: RoomStatus.WAITING,
        winner: '0x0000000000000000000000000000000000000000',
      };
      
      return mockRoom;
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
      // TODO: Replace with actual contract read
      // const result = await readContract({
      //   ...contractConfig,
      //   functionName: 'roomExists',
      //   args: [BigInt(roomId)],
      // });
      
      // Mock implementation
      return roomId.length === 4 && !isNaN(Number(roomId));
    } catch (error) {
      console.error('Error checking room existence:', error);
      return false;
    }
  };

  const getPlayerWins = async (playerAddress: string): Promise<number> => {
    try {
      // TODO: Replace with actual contract read
      // const result = await readContract({
      //   ...contractConfig,
      //   functionName: 'getPlayerWins',
      //   args: [playerAddress as `0x${string}`],
      // });
      
      // Mock implementation
      return Math.floor(Math.random() * 10);
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
      const encryptedVault = encryptVaultCode(vaultCode);
      
      toast({
        title: "Creating room...",
        description: "Processing transaction on blockchain.",
      });

      // TODO: Replace with actual contract write
      // const hash = await writeContract({
      //   ...contractConfig,
      //   functionName: 'createRoom',
      //   args: [encryptedVault as `0x${string}`],
      //   value: parseEther(wager),
      // });
      
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate tx time
      const roomId = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
      
      toast({
        title: "Room created successfully!",
        description: `Room ID: ${roomId}. Share this with your opponent.`,
      });
      
      return roomId;
    } catch (error: any) {
      console.error('Error creating room:', error);
      toast({
        title: "Failed to create room",
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
      const encryptedVault = encryptVaultCode(vaultCode);
      
      // Check if room exists first
      const exists = await roomExists(roomId);
      if (!exists) {
        throw new Error('Room does not exist');
      }
      
      toast({
        title: "Joining room...",
        description: "Processing transaction on blockchain.",
      });

      // TODO: Replace with actual contract write
      // const hash = await writeContract({
      //   ...contractConfig,
      //   functionName: 'joinRoom',
      //   args: [BigInt(roomId), encryptedVault as `0x${string}`],
      //   value: parseEther(wager),
      // });
      
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate tx time
      
      toast({
        title: "Joined room successfully!",
        description: `Connected to room ${roomId}. Battle begins!`,
      });
    } catch (error: any) {
      console.error('Error joining room:', error);
      toast({
        title: "Failed to join room",
        description: error.message || "Transaction failed or room doesn't exist.",
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
    
    // Read Functions
    getRoom,
    roomExists,
    getPlayerWins,
    
    // Write Functions
    createRoom,
    joinRoom,
    
    // Utils
    refetchWins,
    contractConfig,
  };
}