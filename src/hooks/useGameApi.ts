import { useState, useEffect, useCallback } from 'react';
import { RoomState, ResultPosted, Guess } from '@/types/game';

// TODO: Replace with actual API endpoints when backend is ready
const api = {
  async getRoomState(roomId: string): Promise<RoomState> {
    // Placeholder implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      roomId,
      playerAddress: '0x1234...5678',
      opponentAddress: '0x8765...4321',
      currentTurn: Math.random() > 0.5 ? '0x1234...5678' : '0x8765...4321',
      wager: '0.1',
      guesses: [
        {
          turnIndex: 1,
          tiles: ['🔒', '🔑', '⚡', '🛡️'],
          result: { breaches: 1, signals: 2 },
          timestamp: Date.now() - 120000,
          txHash: '0xabc123'
        },
        {
          turnIndex: 2,
          tiles: ['💎', '🔥', '❄️', '⭐'],
          result: { breaches: 0, signals: 1 },
          timestamp: Date.now() - 60000,
          txHash: '0xdef456'
        }
      ],
      playerVault: ['🔒', '🔑', '⚡', '🛡️'],
      gameStatus: 'active'
    };
  },

  async submitProbe(roomId: string, encryptedGuess: string): Promise<{ txHash: string }> {
    // Placeholder implementation - replace with actual blockchain transaction
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      txHash: `0x${Math.random().toString(16).substr(2, 8)}`
    };
  }
};

// TODO: Replace with actual crypto library when FHE is implemented
const crypto = {
  async encryptGuess(tiles: string[]): Promise<string> {
    // Placeholder implementation - replace with actual TFHE encryption
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const mockCiphertext = btoa(JSON.stringify({
      tiles,
      timestamp: Date.now(),
      nonce: Math.random()
    }));
    
    return `CIPHER_${mockCiphertext}`;
  },

  verifySignature(pubKey: string, payload: string, signature: string): boolean {
    // Placeholder implementation - replace with actual signature verification
    return signature === 'DEMO-SIG' || signature.startsWith('0x');
  }
};

export const useGameApi = (roomId: string) => {
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoomState = useCallback(async () => {
    try {
      setLoading(true);
      const state = await api.getRoomState(roomId);
      setRoomState(state);
      setError(null);
    } catch (err) {
      setError('Failed to load room state');
      console.error('Room state error:', err);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  const submitProbe = useCallback(async (tiles: string[]) => {
    if (!roomState) return;

    try {
      // Encrypt guess using placeholder crypto
      const encryptedGuess = await crypto.encryptGuess(tiles);
      
      // Submit to blockchain
      const { txHash } = await api.submitProbe(roomId, encryptedGuess);
      
      // Add pending guess to local state
      const pendingGuess: Guess = {
        turnIndex: roomState.guesses.length + 1,
        tiles,
        timestamp: Date.now(),
        txHash,
        pending: true
      };

      setRoomState(prev => prev ? {
        ...prev,
        guesses: [...prev.guesses, pendingGuess]
      } : null);

      return txHash;
    } catch (err) {
      console.error('Submit probe error:', err);
      throw new Error('Failed to submit probe');
    }
  }, [roomId, roomState]);

  // TODO: Replace with actual WebSocket connection
  const onResultPosted = useCallback((callback: (result: ResultPosted) => void) => {
    // Placeholder WebSocket simulation
    const interval = setInterval(() => {
      if (Math.random() > 0.8 && roomState?.guesses.some(g => g.pending)) {
        const mockResult: ResultPosted = {
          roomId,
          turnIndex: roomState.guesses.length,
          targetPlayer: roomState.playerAddress,
          signedPlainResult: {
            breaches: Math.floor(Math.random() * 3),
            signals: Math.floor(Math.random() * 4)
          },
          resultCipher: 'CIPHER_0xresult123',
          signature: 'DEMO-SIG'
        };
        callback(mockResult);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [roomId, roomState]);

  useEffect(() => {
    fetchRoomState();
  }, [fetchRoomState]);

  return {
    roomState,
    loading,
    error,
    submitProbe,
    onResultPosted,
    refetch: fetchRoomState,
    crypto
  };
};