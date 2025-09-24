export interface Guess {
  turnIndex: number;
  tiles: string[];
  result?: {
    breaches: number;
    signals: number;
  };
  timestamp: number;
  txHash?: string;
  pending?: boolean;
}

export interface RoomState {
  roomId: string;
  playerAddress: string;
  opponentAddress: string;
  currentTurn: string;
  wager: string;
  guesses: Guess[];
  playerVault: string[];
  gameStatus: 'waiting' | 'active' | 'completed';
  winner?: string;
}

export interface ResultPosted {
  roomId: string;
  turnIndex: number;
  targetPlayer: string;
  signedPlainResult: {
    breaches: number;
    signals: number;
  };
  resultCipher: string;
  signature: string;
}