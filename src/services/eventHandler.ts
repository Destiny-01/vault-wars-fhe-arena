/**
 * Event Handler Service - Centralized Contract Event Router
 *
 * This service listens to all Vault Wars contract events and routes them
 * to appropriate UI updates and state changes.
 */

import { Contract } from "ethers";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

// Event type definitions
export interface ContractEvent {
  roomId: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
}

export interface RoomCreatedEvent extends ContractEvent {
  creator: string;
  wager: string;
  token: string;
}

export interface RoomJoinedEvent extends ContractEvent {
  opponent: string;
}

export interface VaultSubmittedEvent extends ContractEvent {
  who: string;
}

export interface ProbeSubmittedEvent extends ContractEvent {
  turnIndex: number;
  submitter: string;
}

export interface ResultComputedEvent extends ContractEvent {
  turnIndex: number;
  submitter: string;
  isWin: boolean; // This might be encrypted
  signedResult?: {
    breaches: number;
    signals: number;
    signature: string;
  };
}

export interface DecryptionRequestedEvent extends ContractEvent {
  requestId: string;
}

export interface WinnerDecryptedEvent extends ContractEvent {
  winner: string;
  signature?: string;
}

export interface GameFinishedEvent extends ContractEvent {
  winner: string;
  amount: string;
}

export interface RoomCancelledEvent extends ContractEvent {
  by: string;
}

// Event handler callbacks
export type EventHandlers = {
  onRoomCreated?: (event: RoomCreatedEvent) => void;
  onRoomJoined?: (event: RoomJoinedEvent) => void;
  onVaultSubmitted?: (event: VaultSubmittedEvent) => void;
  onProbeSubmitted?: (event: ProbeSubmittedEvent) => void;
  onResultComputed?: (event: ResultComputedEvent) => void;
  onDecryptionRequested?: (event: DecryptionRequestedEvent) => void;
  onWinnerDecrypted?: (event: WinnerDecryptedEvent) => void;
  onGameFinished?: (event: GameFinishedEvent) => void;
  onRoomCancelled?: (event: RoomCancelledEvent) => void;
};

class VaultWarsEventHandler {
  private contract: Contract | null = null;
  private handlers: EventHandlers = {};
  private activeListeners: string[] = [];
  public isListening = false;

  /**
   * Initialize event handling with contract instance
   */
  initialize(contract: Contract, handlers: EventHandlers = {}) {
    this.contract = contract;
    this.handlers = handlers;
    this.startListening();
  }

  /**
   * Update event handlers
   */
  updateHandlers(handlers: Partial<EventHandlers>) {
    this.handlers = { ...this.handlers, ...handlers };
  }

  /**
   * Start listening to all contract events
   */
  private startListening() {
    if (!this.contract || this.isListening) return;

    console.log("[EventHandler] Starting to listen for contract events");
    this.isListening = true;

    // RoomCreated Event
    this.contract.on("RoomCreated", (roomId, creator, wager, token, event) => {
      const eventData: RoomCreatedEvent = {
        roomId: roomId.toString(),
        creator,
        wager: wager.toString(),
        token,
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
        timestamp: Date.now(),
      };

      console.log("[EventHandler] RoomCreated:", eventData);
      this.handlers.onRoomCreated?.(eventData);
    });

    // RoomJoined Event
    this.contract.on("RoomJoined", (roomId, opponent, event) => {
      const eventData: RoomJoinedEvent = {
        roomId: roomId.toString(),
        opponent,
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
        timestamp: Date.now(),
      };

      console.log("[EventHandler] RoomJoined:", eventData);
      this.handlers.onRoomJoined?.(eventData);
    });

    // VaultSubmitted Event
    this.contract.on("VaultSubmitted", (roomId, who, event) => {
      const eventData: VaultSubmittedEvent = {
        roomId: roomId.toString(),
        who,
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
        timestamp: Date.now(),
      };

      console.log("[EventHandler] VaultSubmitted:", eventData);
      this.handlers.onVaultSubmitted?.(eventData);
    });

    // ProbeSubmitted Event
    this.contract.on(
      "ProbeSubmitted",
      (roomId, turnIndex, submitter, event) => {
        const eventData: ProbeSubmittedEvent = {
          roomId: roomId.toString(),
          turnIndex: turnIndex.toNumber(),
          submitter,
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
          timestamp: Date.now(),
        };

        console.log("[EventHandler] ProbeSubmitted:", eventData);
        this.handlers.onProbeSubmitted?.(eventData);
      }
    );

    // ResultComputed Event
    this.contract.on(
      "ResultComputed",
      (roomId, turnIndex, submitter, isWin, signedResult, event) => {
        const eventData: ResultComputedEvent = {
          roomId: roomId.toString(),
          turnIndex: turnIndex.toNumber(),
          submitter,
          isWin, // This might be encrypted boolean
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
          timestamp: Date.now(),
        };

        // If signed result is provided, verify signature
        if (signedResult && signedResult.signature) {
          const payload = JSON.stringify({
            roomId: eventData.roomId,
            turnIndex: eventData.turnIndex,
            breaches: signedResult.breaches,
            signals: signedResult.signals,
          });

          // const isValidSignature = verifySignature(
          //   'gateway_public_key', // TODO: Use real gateway public key
          //   payload,
          //   signedResult.signature
          // );

          // if (isValidSignature) {
          eventData.signedResult = signedResult;
          // } else {
          //   console.warn('[EventHandler] Invalid signature on ResultComputed event');
          // }
        }

        console.log("[EventHandler] ResultComputed:", eventData);
        this.handlers.onResultComputed?.(eventData);
      }
    );

    // DecryptionRequested Event
    this.contract.on("DecryptionRequested", (roomId, requestId, event) => {
      const eventData: DecryptionRequestedEvent = {
        roomId: roomId.toString(),
        requestId: requestId.toString(),
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
        timestamp: Date.now(),
      };

      console.log("[EventHandler] DecryptionRequested:", eventData);
      this.handlers.onDecryptionRequested?.(eventData);
    });

    // WinnerDecrypted Event
    this.contract.on("WinnerDecrypted", (roomId, winner, signature, event) => {
      const eventData: WinnerDecryptedEvent = {
        roomId: roomId.toString(),
        winner,
        signature,
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
        timestamp: Date.now(),
      };

      // Verify signature if provided
      // if (signature) {
      //   const payload = JSON.stringify({ roomId: eventData.roomId, winner });
      //   const isValidSignature = verifySignature(
      //     'gateway_public_key', // TODO: Use real gateway public key
      //     payload,
      //     signature
      //   );

      //   if (!isValidSignature) {
      //     console.warn('[EventHandler] Invalid signature on WinnerDecrypted event');
      //     return; // Don't process invalid results
      //   }
      // }

      console.log("[EventHandler] WinnerDecrypted:", eventData);
      this.handlers.onWinnerDecrypted?.(eventData);
    });

    // GameFinished Event
    this.contract.on("GameFinished", (roomId, winner, amount, event) => {
      const eventData: GameFinishedEvent = {
        roomId: roomId.toString(),
        winner,
        amount: amount.toString(),
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
        timestamp: Date.now(),
      };

      console.log("[EventHandler] GameFinished:", eventData);
      this.handlers.onGameFinished?.(eventData);
    });

    // RoomCancelled Event
    this.contract.on("RoomCancelled", (roomId, by, event) => {
      const eventData: RoomCancelledEvent = {
        roomId: roomId.toString(),
        by,
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
        timestamp: Date.now(),
      };

      console.log("[EventHandler] RoomCancelled:", eventData);
      this.handlers.onRoomCancelled?.(eventData);
    });

    this.activeListeners = [
      "RoomCreated",
      "RoomJoined",
      "VaultSubmitted",
      "ProbeSubmitted",
      "ResultComputed",
      "DecryptionRequested",
      "WinnerDecrypted",
      "GameFinished",
      "RoomCancelled",
    ];
  }

  /**
   * Stop listening to contract events
   */
  stopListening() {
    if (!this.contract || !this.isListening) return;

    console.log("[EventHandler] Stopping contract event listeners");

    this.activeListeners.forEach((eventName) => {
      this.contract?.removeAllListeners(eventName);
    });

    this.isListening = false;
    this.activeListeners = [];
  }

  /**
   * Get historical events for a room
   */
  async getHistoricalEvents(roomId: string, fromBlock = 0) {
    if (!this.contract) return [];

    try {
      const filter = this.contract.filters.ProbeSubmitted(roomId);
      const events = await this.contract.queryFilter(filter, fromBlock);
      return events;
    } catch (error) {
      console.error("[EventHandler] Failed to fetch historical events:", error);
      return [];
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.stopListening();
    this.contract = null;
    this.handlers = {};
  }
}

// Singleton instance
export const eventHandler = new VaultWarsEventHandler();

// React hook for using event handler in components
export function useContractEvents(handlers: EventHandlers) {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Enhance handlers with common UI patterns
  const enhancedHandlers: EventHandlers = {
    onRoomCreated: (event) => {
      toast({
        title: "⚡ Room Created",
        description: `Room ${event.roomId} created successfully!`,
      });
      handlers.onRoomCreated?.(event);
    },

    onRoomJoined: (event) => {
      toast({
        title: "🎯 Battle Begins",
        description: "Opponent joined! The vault war has started.",
      });
      handlers.onRoomJoined?.(event);
    },

    onProbeSubmitted: (event) => {
      if (handlers.onProbeSubmitted) {
        handlers.onProbeSubmitted(event);
      } else {
        toast({
          title: "🔍 Probe Launched",
          description: `Probe #${event.turnIndex + 1} submitted to blockchain.`,
        });
      }
    },

    onResultComputed: (event) => {
      if (handlers.onResultComputed) {
        handlers.onResultComputed(event);
      } else {
        toast({
          title: "📊 Result Computed",
          description: `Probe #${event.turnIndex + 1} analyzed by FHE network.`,
        });
      }
    },

    onWinnerDecrypted: (event) => {
      toast({
        title: "🏆 Winner Revealed",
        description: "The vault has been breached! Revealing winner...",
      });
      handlers.onWinnerDecrypted?.(event);
    },

    onGameFinished: (event) => {
      toast({
        title: "🎉 Game Complete",
        description: `Payout of ${event.amount} ETH processed!`,
      });
      handlers.onGameFinished?.(event);
      // Auto-redirect after game completion
      setTimeout(() => navigate("/"), 3000);
    },

    onRoomCancelled: (event) => {
      toast({
        title: "❌ Room Cancelled",
        description: "The game room has been cancelled.",
        variant: "destructive",
      });
      handlers.onRoomCancelled?.(event);
      navigate("/");
    },

    // Pass through other handlers as-is
    onVaultSubmitted: handlers.onVaultSubmitted,
    onDecryptionRequested: handlers.onDecryptionRequested,
  };

  return enhancedHandlers;
}
