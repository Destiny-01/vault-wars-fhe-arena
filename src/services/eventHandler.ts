/**
 * Event Handler Service - Centralized Contract Event Router
 *
 * This service listens to all Vault Wars contract events and routes them
 * to appropriate UI updates and state changes.
 */

import { Contract, EventLog, Log } from "ethers";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { getFhevmInstance, fetchPublicDecryption } from "@/lib/fhe";

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
  submitter: string;
  isWin: boolean; // decrypted boolean
  guess: number[]; // decrypted [euint8;4]
  breaches: number; // decrypted euint8
  signals: number; // decrypted euint8
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
  private pollInterval: NodeJS.Timeout | null = null;
  // Deduplication and rate limiting
  private lastProcessedBlock: number | null = null;
  private processedEventKeys: Set<string> = new Set();
  private perRoomEventCounts: Map<string, number> = new Map();
  private static MAX_REPEATS_PER_EVENT_PER_ROOM = 3;

  /**
   * Initialize event handling with contract instance
   */
  initialize(contract: Contract, handlers: EventHandlers = {}) {
    this.contract = contract;
    this.handlers = handlers;
    // reset trackers on init
    this.lastProcessedBlock = null;
    this.processedEventKeys.clear();
    this.perRoomEventCounts.clear();
    this.startListening();
  }

  /**
   * Update event handlers
   */
  updateHandlers(handlers: Partial<EventHandlers>) {
    this.handlers = { ...this.handlers, ...handlers };
  }

  /**
   * Start listening to all contract events using polling instead of filters
   */
  private startListening() {
    if (!this.contract || this.isListening) return;

    console.log("[EventHandler] Starting to listen for contract events");
    this.isListening = true;

    // Use polling instead of filters to avoid filter management issues
    this.startPolling();
  }

  /**
   * Start polling for events instead of using filters
   */
  private startPolling() {
    if (!this.contract || !this.isListening) return;

    // Poll every 3 seconds for new events
    const pollInterval = setInterval(async () => {
      if (!this.isListening) {
        clearInterval(pollInterval);
        return;
      }

      try {
        await this.checkForNewEvents();
      } catch (error) {
        console.warn("[EventHandler] Error polling for events:", error);
      }
    }, 3000);

    // Store the interval ID for cleanup
    this.pollInterval = pollInterval;
  }

  /**
   * Check for new events by querying recent blocks
   */
  private async checkForNewEvents() {
    if (!this.contract) return;

    try {
      // Determine block range to scan
      const latestBlock =
        await this.contract.runner!.provider!.getBlockNumber();
      const fromBlock =
        this.lastProcessedBlock === null
          ? Math.max(0, latestBlock - 10)
          : this.lastProcessedBlock + 1;

      if (fromBlock > latestBlock) return;

      // Query all events in range
      const allEvents = await this.contract.queryFilter(
        "*",
        fromBlock,
        latestBlock
      );

      for (const event of allEvents) {
        await this.processEvent(event as EventLog | Log);
        // update last processed block progressively
        if (typeof event.blockNumber === "number") {
          this.lastProcessedBlock = Math.max(
            this.lastProcessedBlock ?? 0,
            event.blockNumber
          );
        }
      }
    } catch (error) {
      console.warn("[EventHandler] Error checking for events:", error);
    }
  }

  /**
   * Process a single event and route to appropriate handler
   */
  private async processEvent(event: EventLog | Log) {
    // Only process EventLog events (not raw Log events)
    if (!event || !("eventName" in event) || !event.eventName) return;

    const eventName = event.eventName;
    const args = event.args;

    // Build a stable key to deduplicate (txHash + logIndex)
    const ev = event as EventLog;
    const key = `${ev.transactionHash}:${
      (ev as unknown as { index?: number; logIndex?: number }).index ??
      (ev as unknown as { index?: number; logIndex?: number }).logIndex ??
      ""
    }`;
    if (this.processedEventKeys.has(key)) {
      return; // already handled
    }

    try {
      // Extract roomId for rate limiting (best-effort)
      const roomId = String(args?.[0] ?? "");
      if (roomId) {
        const counterKey = `${roomId}:${eventName}`;
        const count = this.perRoomEventCounts.get(counterKey) ?? 0;
        if (count >= VaultWarsEventHandler.MAX_REPEATS_PER_EVENT_PER_ROOM) {
          return; // drop excessive repeats
        }
        this.perRoomEventCounts.set(counterKey, count + 1);
      }

      switch (eventName) {
        case "RoomCreated": {
          const roomCreatedData: RoomCreatedEvent = {
            roomId: String(args[0]),
            creator: String(args[1]),
            wager: String(args[2]),
            token: String(args[3]),
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            timestamp: Date.now(),
          };
          console.log("[EventHandler] RoomCreated:", roomCreatedData);
          this.handlers.onRoomCreated?.(roomCreatedData);
          break;
        }

        case "RoomJoined": {
          const roomJoinedData: RoomJoinedEvent = {
            roomId: String(args[0]),
            opponent: String(args[1]),
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            timestamp: Date.now(),
          };
          console.log("[EventHandler] RoomJoined:", roomJoinedData);
          this.handlers.onRoomJoined?.(roomJoinedData);
          break;
        }

        case "VaultSubmitted": {
          const vaultSubmittedData: VaultSubmittedEvent = {
            roomId: String(args[0]),
            who: String(args[1]),
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            timestamp: Date.now(),
          };
          console.log("[EventHandler] VaultSubmitted:", vaultSubmittedData);
          this.handlers.onVaultSubmitted?.(vaultSubmittedData);
          break;
        }

        case "ResultComputed": {
          // Decrypt public outputs (third argument to the last)
          void (async () => {
            try {
              console.log(
                args[0], // roomId
                args[1], // submitter
                args[2], // isWinHandle
                args[3], // guessHandles
                args[4], // breachesHandle
                args[5], // signalsHandle
                event
              );
              await getFhevmInstance();
              const handleStrings: string[] = [
                args[2]?.toString?.() ?? String(args[2]), // isWinHandle
                ...[0, 1, 2, 3].map(
                  (i) => args[3]?.[i]?.toString?.() ?? String(args[3]?.[i]) // guessHandles[i]
                ),
                args[4]?.toString?.() ?? String(args[4]), // breachesHandle
                args[5]?.toString?.() ?? String(args[5]), // signalsHandle
              ];

              const decryptedMap = await fetchPublicDecryption(handleStrings);

              const resolve = (idx: number) => {
                const key = handleStrings[idx];
                const val = decryptedMap?.[key];
                return typeof val === "string" ? Number(val) : Number(val ?? 0);
              };

              const isWin = Boolean(resolve(0));
              const guess = [resolve(1), resolve(2), resolve(3), resolve(4)];
              const breaches = resolve(5);
              const signals = resolve(6);

              const resultComputedData: ResultComputedEvent = {
                roomId: String(args[0]),
                submitter: String(args[1]),
                isWin,
                guess,
                breaches,
                signals,
                transactionHash: event.transactionHash,
                blockNumber: event.blockNumber,
                timestamp: Date.now(),
              };

              console.log(
                "[EventHandler] ResultComputed (decrypted):",
                resultComputedData
              );
              this.handlers.onResultComputed?.(resultComputedData);
            } catch (error) {
              console.error(
                "[EventHandler] Failed to decrypt ResultComputed:",
                error
              );
            }
          })();
          break;
        }

        case "DecryptionRequested": {
          const decryptionRequestedData: DecryptionRequestedEvent = {
            roomId: String(args[0]),
            requestId: String(args[1]),
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            timestamp: Date.now(),
          };
          console.log(
            "[EventHandler] DecryptionRequested:",
            decryptionRequestedData
          );
          this.handlers.onDecryptionRequested?.(decryptionRequestedData);
          break;
        }

        case "WinnerDecrypted": {
          const winnerDecryptedData: WinnerDecryptedEvent = {
            roomId: String(args[0]),
            winner: String(args[1]),
            signature: undefined,
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            timestamp: Date.now(),
          };
          console.log("[EventHandler] WinnerDecrypted:", winnerDecryptedData);
          this.handlers.onWinnerDecrypted?.(winnerDecryptedData);
          break;
        }

        case "GameFinished": {
          const gameFinishedData: GameFinishedEvent = {
            roomId: String(args[0]),
            winner: String(args[1]),
            amount: String(args[2]),
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            timestamp: Date.now(),
          };
          console.log("[EventHandler] GameFinished:", gameFinishedData);
          this.handlers.onGameFinished?.(gameFinishedData);
          break;
        }

        case "RoomCancelled": {
          const roomCancelledData: RoomCancelledEvent = {
            roomId: String(args[0]),
            by: String(args[1]),
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            timestamp: Date.now(),
          };
          console.log("[EventHandler] RoomCancelled:", roomCancelledData);
          this.handlers.onRoomCancelled?.(roomCancelledData);
          break;
        }
      }
    } catch (error) {
      console.warn(
        `[EventHandler] Error processing ${eventName} event:`,
        error
      );
    } finally {
      // mark as processed after successful switch (or even on error, to avoid hot loops)
      this.processedEventKeys.add(key);
    }
  }

  /**
   * Stop listening to contract events
   */
  stopListening() {
    if (!this.isListening) return;

    console.log("[EventHandler] Stopping contract event listeners");

    // Clear the polling interval
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    this.isListening = false;
    // Do not clear processed caches here; keep them to avoid immediate replays on quick restart
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
          description: `Probe submitted to blockchain.`,
        });
      }
    },

    onResultComputed: (event) => {
      if (handlers.onResultComputed) {
        handlers.onResultComputed(event);
      } else {
        toast({
          title: "📊 Result Computed",
          description: `Result analyzed by FHE network.`,
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
