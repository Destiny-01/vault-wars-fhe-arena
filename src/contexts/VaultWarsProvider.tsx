/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  useEffect,
  useState,
  useCallback,
  createContext,
  useContext,
  useRef,
} from "react";
import { useAccount } from "wagmi";
import {
  BrowserProvider,
  BytesLike,
  Contract,
  ethers,
  Interface,
  JsonRpcProvider,
} from "ethers";
import { parseEther, formatEther } from "viem";
import { useToast } from "@/hooks/use-toast";
import { eventHandler, EventHandlers } from "@/services/eventHandler";
import { VAULT_WARS_ABI } from "@/config/ABI";
import { encryptValue, fetchPublicDecryption } from "@/lib/fhe";
import { RoomPhase } from "@/types/game";
import { VaultWarsContext } from "@/hooks/useVaultWars";

// Contract address
const VAULT_WARS_CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS!;

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

// Guess type for UI state management
export interface Guess {
  turnIndex: number;
  digits: string[];
  timestamp: number;
  pending: boolean;
  submitter?: string;
  result?: {
    breached: number;
    injured: number;
  };
}

export interface VaultWarsContextValue {
  // State
  contract: Contract | null;
  isContractReady: boolean;
  isLoading: boolean;
  playerWins: number;
  probeCache: Map<string, ProbeMetadata[]>;
  address: string | undefined;

  // Room state
  currentRoomId: string | null;
  roomData: RoomMetadata | null;
  roomGuesses: Guess[];
  isListeningToEvents: boolean;

  // Contract methods
  getRoom: (roomId: string) => Promise<RoomMetadata | null>;
  roomExists: (roomId: string) => Promise<boolean>;
  getProbe: (
    roomId: string,
    turnIndex: number
  ) => Promise<ProbeMetadata | null>;
  getLastResultEncrypted: (
    roomId: string
  ) => Promise<{ breaches: string; signals: string } | null>;
  isPlayerTurn: (roomId: string, playerAddress: string) => Promise<boolean>;
  getPlayerWins: (playerAddress: string) => Promise<number>;

  // Write methods
  createRoom: (vaultCode: number[], wager: string) => Promise<string>;
  joinRoom: (
    roomId: string,
    vaultCode: number[],
    wager: string
  ) => Promise<void>;
  submitProbe: (roomId: string, guessCode: number[]) => Promise<void>;
  cancelRoom: (roomId: string) => Promise<void>;
  claimTimeout: (roomId: string) => Promise<void>;
  fulfillWinnerDecryption: (roomId: string) => Promise<void>;

  // Room state management
  setCurrentRoom: (roomId: string | null) => void;
  loadRoomData: (roomId: string) => Promise<RoomMetadata | null>;
  addGuess: (guess: Guess) => void;
  removeGuess: (turnIndex: number) => void;
  updateProbeCache: (roomId: string, probes: ProbeMetadata[]) => void;
}

export const VaultWarsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { address } = useAccount();
  const { toast } = useToast();
  // no router hook usage here; provider can mount above Router

  // Contract state
  const [contract, setContract] = useState<Contract | null>(null);
  const [provider, setProvider] = useState<JsonRpcProvider | null>(null);
  const [isContractReady, setIsContractReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playerWins, setPlayerWins] = useState(0);
  const [probeCache, setProbeCache] = useState<Map<string, ProbeMetadata[]>>(
    new Map()
  );

  // Room state - derive directly from URL path `/game/:roomId`
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const match = window.location.pathname.match(/\/game\/([^/?#]+)/);
    return match?.[1] ?? null;
  });
  const [roomData, setRoomData] = useState<RoomMetadata | null>(null);
  const [roomGuesses, setRoomGuesses] = useState<Guess[]>([]);
  const [isListeningToEvents, setIsListeningToEvents] = useState(false);
  console.log(currentRoomId, "currentRoomId");

  // Deduplication for ResultComputed events
  const processedResultsRef = useRef<Set<string>>(new Set());
  const winnerFinalizationInFlightRef = useRef<Set<string>>(new Set());

  // Track if guesses for current room have been restored from storage
  const guessesLoadedRef = useRef<boolean>(false);

  // Restore guesses from localStorage when room changes
  useEffect(() => {
    guessesLoadedRef.current = false;
    if (!currentRoomId) {
      setRoomGuesses([]);
      return;
    }
    const key = `vaultwars.guesses.${currentRoomId}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setRoomGuesses(parsed as Guess[]);
        } else {
          setRoomGuesses([]);
        }
      } else {
        setRoomGuesses([]);
      }
    } catch (e) {
      console.warn("Failed to restore room guesses from storage", e);
      setRoomGuesses([]);
    } finally {
      guessesLoadedRef.current = true;
    }
  }, [currentRoomId]);

  // Persist guesses to localStorage when they change
  useEffect(() => {
    if (!currentRoomId) return;
    if (!guessesLoadedRef.current) return;
    // Only save if there are actual guesses (not empty array)
    if (roomGuesses.length === 0) return;
    const key = `vaultwars.guesses.${currentRoomId}`;
    try {
      localStorage.setItem(key, JSON.stringify(roomGuesses));
    } catch (e) {
      console.warn("Failed to persist room guesses to storage", e);
    }
  }, [roomGuesses, currentRoomId]);

  // Hoisted room loader to avoid "used before declaration" in effects
  const loadRoomData = useCallback(
    async (roomId: string): Promise<RoomMetadata | null> => {
      try {
        // Use RPC provider for read calls
        const rpcProvider =
          provider ||
          new JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
        const readContract = new Contract(
          VAULT_WARS_CONTRACT_ADDRESS,
          VAULT_WARS_ABI,
          rpcProvider
        ) as any;

        const result = await readContract.getRoom(BigInt(roomId));
        const data: RoomMetadata = {
          creator: result[0],
          opponent: result[1],
          wager: formatEther(result[2]),
          phase: Number(result[3]),
          turnCount: Number(result[4]),
          encryptedWinner: result[5],
          createdAt: Number(result[6]) * 1000,
          lastActiveAt: Number(result[7]) * 1000,
        };
        setRoomData(data);
        return data;
      } catch (error) {
        console.error("Failed to load room data:", error);
        setRoomData(null);
        throw error;
      }
    },
    [provider]
  );

  const finalizeWinnerOnChain = useCallback(
    async (roomIdInput: string, options?: { silent?: boolean }) => {
      const roomId = roomIdInput?.toString();
      const silent = options?.silent ?? false;

      if (!contract) {
        const message = "Contract not initialized";
        if (!silent) {
          throw new Error(message);
        }
        console.warn(`[VaultWars] ${message}, skipping winner finalization.`);
        return;
      }

      if (typeof window === "undefined" || !window.ethereum) {
        const message = "Browser wallet unavailable";
        if (!silent) {
          throw new Error(message);
        }
        console.warn(`[VaultWars] ${message}, skipping winner finalization.`);
        return;
      }

      if (!address) {
        const message = "Wallet not connected";
        if (!silent) {
          throw new Error(message);
        }
        console.warn(`[VaultWars] ${message}, skipping winner finalization.`);
        return;
      }

      if (winnerFinalizationInFlightRef.current.has(roomId)) {
        if (!silent) {
          toast({
            title: "Finalization in progress",
            description: "Winner finalization is already running.",
          });
        }
        return;
      }

      winnerFinalizationInFlightRef.current.add(roomId);

      const stopLoading = () => {
        if (!silent) {
          setIsLoading(false);
        }
        winnerFinalizationInFlightRef.current.delete(roomId);
      };

      try {
        if (!silent) {
          setIsLoading(true);
          toast({
            title: "🔐 Finalizing winner",
            description: "Decrypting winner handle and submitting on-chain...",
          });
        } else {
          console.log(`[VaultWars] Auto finalizing winner for room ${roomId}`);
        }

        const signer = await new BrowserProvider(window.ethereum).getSigner();
        const contractWithSigner = contract.connect(signer) as Contract;

        let encryptedWinnerHandle: string | undefined =
          currentRoomId === roomId ? roomData?.encryptedWinner : undefined;

        if (
          !encryptedWinnerHandle ||
          encryptedWinnerHandle === ethers.ZeroHash
        ) {
          const latestRoom = await contract.getRoom(BigInt(roomId));
          encryptedWinnerHandle = latestRoom?.[5];
        }

        if (
          !encryptedWinnerHandle ||
          encryptedWinnerHandle === ethers.ZeroHash
        ) {
          throw new Error(
            "Winner ciphertext not ready yet. Please wait for the ResultComputed event."
          );
        }

        const winnerHandle = encryptedWinnerHandle as `0x${string}`;
        const { abiEncodedClearValues, decryptionProof, clearValues } =
          await fetchPublicDecryption([winnerHandle]);

        const decryptedWinner = clearValues?.[winnerHandle] as
          | `0x${string}`
          | undefined;

        const tx = await contractWithSigner.fulfillDecryption(
          BigInt(roomId),
          abiEncodedClearValues,
          decryptionProof
        );
        await tx.wait();

        if (!silent) {
          toast({
            title: "🏁 Winner submitted",
            description: decryptedWinner
              ? `Winner ${decryptedWinner} finalized on-chain.`
              : "Winner finalized on-chain.",
          });
        } else {
          console.log(
            `[VaultWars] Winner finalized for room ${roomId}: ${decryptedWinner}`
          );
        }

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("vaultwars:reward-finalized", {
              detail: {
                roomId,
                winner: decryptedWinner,
              },
            })
          );
        }

        if (currentRoomId === roomId) {
          void loadRoomData(roomId);
        }
      } catch (error: any) {
        const normalizedMessage = (error?.message || "").toLowerCase();
        const alreadyFinalized =
          normalizedMessage.includes("game not in progress") ||
          normalizedMessage.includes("already finalized");

        if (alreadyFinalized) {
          if (!silent) {
            toast({
              title: "🏁 Winner already finalized",
              description: "Payout has already been processed on-chain.",
            });
          }
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("vaultwars:reward-finalized", {
                detail: { roomId },
              })
            );
          }
          return;
        }

        console.error("Error fulfilling decryption:", error);
        const description =
          error?.message ||
          "Automatic winner finalization failed. Please retry.";

        toast({
          title: silent
            ? "⚠️ Finalization pending"
            : "❌ Failed to finalize winner",
          description,
          variant: "destructive",
        });

        throw error;
      } finally {
        stopLoading();
      }
    },
    [
      address,
      contract,
      currentRoomId,
      loadRoomData,
      roomData?.encryptedWinner,
      toast,
    ]
  );

  const fulfillWinnerDecryption = useCallback(
    async (roomId: string): Promise<void> => {
      await finalizeWinnerOnChain(roomId);
    },
    [finalizeWinnerOnChain]
  );

  // Initialize contract
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum && !contract) {
      const browserProvider = new BrowserProvider(window.ethereum);
      const contractInstance = new Contract(
        VAULT_WARS_CONTRACT_ADDRESS,
        VAULT_WARS_ABI,
        browserProvider
      ) as any;

      setContract(contractInstance);
      setIsContractReady(true);
    }
  }, [contract]);

  // Keep currentRoomId in sync with URL changes only
  useEffect(() => {
    if (typeof window === "undefined") return;

    const resolveFromUrl = () => {
      const match = window.location.pathname.match(/\/game\/([^/?#]+)/);
      const fromPath = match?.[1] ?? null;
      setCurrentRoomId(fromPath);
    };

    // Patch history methods to emit an event on navigation
    const origPush = history.pushState;
    const origReplace = history.replaceState;
    const notify = () => window.dispatchEvent(new Event("locationchange"));
    history.pushState = function (...args: Parameters<History["pushState"]>) {
      const ret = origPush.apply(this, args);
      notify();
      return ret;
    } as typeof history.pushState;
    history.replaceState = function (
      ...args: Parameters<History["replaceState"]>
    ) {
      const ret = origReplace.apply(this, args);
      notify();
      return ret;
    } as typeof history.replaceState;

    window.addEventListener("popstate", resolveFromUrl);
    window.addEventListener("locationchange", resolveFromUrl);

    // Initial sync
    resolveFromUrl();

    return () => {
      window.removeEventListener("popstate", resolveFromUrl);
      window.removeEventListener("locationchange", resolveFromUrl);
      history.pushState = origPush;
      history.replaceState = origReplace;
    };
  }, []);

  // Initialize event listeners when contract is ready
  useEffect(() => {
    if (contract && isContractReady && !isListeningToEvents) {
      console.log("Initializing event listeners...");

      // Create a contract instance with a provider that supports event subscription
      const eventProvider = new JsonRpcProvider(
        "https://ethereum-sepolia-rpc.publicnode.com"
      );
      const contractWithProvider = new Contract(
        VAULT_WARS_CONTRACT_ADDRESS,
        VAULT_WARS_ABI,
        eventProvider
      );
      setProvider(eventProvider);

      const eventHandlers: EventHandlers = {
        onRoomJoined: (event) => {
          console.log("Room joined event:", event, currentRoomId);
          if (event.roomId === currentRoomId?.toString()) {
            toast({
              title: "🎯 Battle begins!",
              description: "Opponent joined! The vault war has started.",
            });
            // Load updated room data when opponent joins
            loadRoomData(event.roomId);
          }
        },
        onResultComputed: async (event) => {
          console.log("Result computed event:", event, currentRoomId);
          if (event.roomId === currentRoomId?.toString()) {
            // Deduplicate by tx hash
            const key = event.transactionHash;
            if (processedResultsRef.current.has(key)) {
              return;
            }
            processedResultsRef.current.add(key);

            const isPlayerResult =
              event.submitter.toLowerCase() === address?.toLowerCase();

            const desc = `${event.breaches || 0}B ${event.signals || 0}S`;
            toast({
              title: isPlayerResult
                ? "📊 Your probe analyzed"
                : "📊 Opponent's probe analyzed",
              description: desc,
            });

            // Push guess result into roomGuesses for UI
            setRoomGuesses((prev) => {
              const nextTurnIndex = prev.length;
              const newGuess: Guess = {
                turnIndex: nextTurnIndex,
                digits: (event.guess || []).map((n: number) => String(n)),
                timestamp: event.timestamp || Date.now(),
                pending: false,
                submitter: event.submitter,
                result: {
                  breached: Number(event.breaches || 0),
                  injured: Number(event.signals || 0),
                },
              };
              return [...prev, newGuess];
            });

            // Show win/loss modal if this is a winning guess
            if (event.isWin) {
              finalizeWinnerOnChain(event.roomId, { silent: true }).catch(
                (error) => {
                  console.error(
                    "[VaultWars] Auto winner finalization failed:",
                    error
                  );
                }
              );

              if (isPlayerResult) {
                // Player won - show win modal
                toast({
                  title: "🏆 VICTORY!",
                  description: "You've successfully breached the vault!",
                  duration: 5000,
                });
                // Trigger win modal in GameScreen
                window.dispatchEvent(
                  new CustomEvent("vaultwars:win", {
                    detail: {
                      roomId: event.roomId,
                      wager: roomData?.wager || "0",
                    },
                  })
                );
              } else {
                // Opponent won - show loss modal
                toast({
                  title: "💥 DEFEAT",
                  description: "Your vault has been breached!",
                  variant: "destructive",
                  duration: 5000,
                });
                // Trigger loss modal in GameScreen
                window.dispatchEvent(
                  new CustomEvent("vaultwars:loss", {
                    detail: { roomId: event.roomId },
                  })
                );
              }
            }

            // Refresh room data to get updated turn count and phase
            if (currentRoomId) {
              loadRoomData(currentRoomId);
            }
          }
        },
        onWinnerDecrypted: (event) => {
          console.log("Winner decrypted event:", event);
          if (event.roomId === currentRoomId?.toString()) {
            toast({
              title: "🏆 Winner Revealed",
              description: "The vault has been breached! Revealing winner...",
            });
            // Refresh room data to get final state
            if (currentRoomId) {
              loadRoomData(currentRoomId);
            }
          }
        },
        onGameFinished: (event) => {
          console.log("Game finished event:", event, currentRoomId);
          if (event.roomId === currentRoomId?.toString()) {
            toast({
              title: "🎉 Game Complete",
              description: `Payout of ${formatEther(
                BigInt(event.amount)
              )} ETH processed!`,
            });
            // Refresh room data to get final state
            if (currentRoomId) {
              loadRoomData(currentRoomId);
            }
          }

          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("vaultwars:reward-finalized", {
                detail: {
                  roomId: String(event.roomId),
                  winner: event.winner,
                  amount: event.amount,
                },
              })
            );
          }
        },
      };

      eventHandler.initialize(contractWithProvider, eventHandlers);
      setIsListeningToEvents(true);
    }

    return () => {
      if (isListeningToEvents) {
        eventHandler.stopListening();
        setIsListeningToEvents(false);
      }
    };
  }, [
    contract,
    isContractReady,
    isListeningToEvents,
    currentRoomId,
    address,
    toast,
    loadRoomData,
    roomData?.wager,
    finalizeWinnerOnChain,
  ]);

  // No persistence — currentRoomId is strictly derived from URL per spec

  // Contract read methods with simple in-memory throttling/dedup to avoid rate limits
  const roomFetchCacheRef = useRef(
    new Map<
      string,
      {
        lastTs: number;
        data: RoomMetadata | null;
        inFlight?: Promise<RoomMetadata | null>;
      }
    >()
  );

  const getRoom = useCallback(
    async (roomId: string): Promise<RoomMetadata | null> => {
      const cache = roomFetchCacheRef.current;
      const now = Date.now();
      const ttlMs = 3000; // 3s TTL per room
      const cached = cache.get(roomId);

      if (cached?.inFlight) {
        return cached.inFlight;
      }
      if (cached && now - cached.lastTs < ttlMs) {
        return cached.data;
      }

      const fetchPromise = (async () => {
        try {
          setIsLoading(true);
          const rpcProvider =
            provider ||
            new JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
          const readContract = new Contract(
            VAULT_WARS_CONTRACT_ADDRESS,
            VAULT_WARS_ABI,
            rpcProvider
          ) as any;

          const result = await readContract.getRoom(BigInt(roomId));
          const roomData: RoomMetadata = {
            creator: result[0],
            opponent: result[1],
            wager: formatEther(result[2]),
            phase: Number(result[3]),
            turnCount: Number(result[4]),
            encryptedWinner: result[5],
            createdAt: Number(result[6]) * 1000,
            lastActiveAt: Number(result[7]) * 1000,
          };
          cache.set(roomId, { lastTs: Date.now(), data: roomData });
          return roomData;
        } catch (error) {
          console.error("Error fetching room:", error);
          toast({
            title: "Failed to load room",
            description: "Could not fetch room data from contract.",
            variant: "destructive",
          });
          cache.set(roomId, { lastTs: Date.now(), data: null });
          return null;
        } finally {
          setIsLoading(false);
          const entry = cache.get(roomId);
          if (entry) delete entry.inFlight;
        }
      })();

      cache.set(roomId, {
        lastTs: cached?.lastTs ?? 0,
        data: cached?.data ?? null,
        inFlight: fetchPromise,
      });
      return fetchPromise;
    },
    [toast, provider]
  );

  const roomExists = useCallback(
    async (roomId: string): Promise<boolean> => {
      try {
        if (!contract) {
          // Mock implementation for development
          return roomId.length === 4 && !isNaN(Number(roomId));
        }

        const result = await contract.roomExists(roomId);
        return result;
      } catch (error) {
        console.error("Error checking room existence:", error);
        return false;
      }
    },
    [contract]
  );

  const getProbe = useCallback(
    async (
      roomId: string,
      turnIndex: number
    ): Promise<ProbeMetadata | null> => {
      try {
        if (!contract) {
          // Mock implementation
          return {
            submitter: "0x1234567890123456789012345678901234567890",
            encryptedGuess: btoa(`guess_${turnIndex}_encrypted`),
            encryptedBreaches: btoa(`breaches_${turnIndex}`),
            encryptedSignals: btoa(`signals_${turnIndex}`),
            isWinningProbe: false,
            timestamp: Date.now(),
            breaches: Math.floor(Math.random() * 5),
            signals: Math.floor(Math.random() * 4),
          };
        }

        const result = await contract.getProbe(
          BigInt(roomId),
          BigInt(turnIndex)
        );
        return {
          submitter: result.submitter,
          encryptedGuess: result.encryptedGuess,
          encryptedBreaches: result.encryptedBreaches,
          encryptedSignals: result.encryptedSignals,
          isWinningProbe: result.isWinningProbe,
          timestamp: result.timestamp.toNumber() * 1000,
        };
      } catch (error) {
        console.error("Error fetching probe:", error);
        return null;
      }
    },
    [contract]
  );

  const getLastResultEncrypted = useCallback(
    async (
      roomId: string
    ): Promise<{ breaches: string; signals: string } | null> => {
      try {
        if (!contract) {
          return {
            breaches: btoa("encrypted_breaches"),
            signals: btoa("encrypted_signals"),
          };
        }

        const result = await contract.getLastResultEncrypted(BigInt(roomId));
        return {
          breaches: result.breaches,
          signals: result.signals,
        };
      } catch (error) {
        console.error("Error fetching encrypted result:", error);
        return null;
      }
    },
    [contract]
  );

  const isPlayerTurn = useCallback(
    async (roomId: string, playerAddress: string): Promise<boolean> => {
      try {
        if (!contract) {
          // Mock: alternating turns
          return true;
        }

        const result = await contract.isPlayerTurn(
          BigInt(roomId),
          playerAddress
        );
        return result;
      } catch (error) {
        console.error("Error checking player turn:", error);
        return false;
      }
    },
    [contract]
  );

  const getPlayerWins = useCallback(
    async (playerAddress: string): Promise<number> => {
      try {
        if (!contract) {
          // Mock implementation
          return Math.floor(Math.random() * 10);
        }

        const result = await contract.getPlayerWins(playerAddress);
        return result.toNumber();
      } catch (error) {
        console.error("Error fetching player wins:", error);
        return 0;
      }
    },
    [contract]
  );

  // Contract write methods with FHE encryption
  const createRoom = useCallback(
    async (vaultCode: number[], wager: string): Promise<string> => {
      if (!address) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet to create a room.",
          variant: "destructive",
        });
        throw new Error("Wallet not connected");
      }

      try {
        setIsLoading(true);

        // Encrypt vault using FHE
        const encryptedVault = await encryptValue(address, vaultCode);

        toast({
          title: "⚡ Encrypting vault...",
          description: "Securing your code with FHE encryption.",
        });

        // Real contract call
        const signer = await new ethers.BrowserProvider(
          window.ethereum
        ).getSigner();
        const contractWithSigner = contract.connect(signer) as any;

        console.log(
          signer,
          contractWithSigner,
          encryptedVault.handles,
          encryptedVault.inputProof,
          parseEther(wager)
        );
        const tx = await contractWithSigner.createRoom(
          encryptedVault.handles,
          encryptedVault.inputProof,
          {
            value: parseEther(wager),
          }
        );

        toast({
          title: "📡 Transaction submitted...",
          description: "Waiting for blockchain confirmation.",
        });

        const receipt = await tx.wait();

        // Extract room ID from logs using ABI interface (ethers v6 compatible)
        const iface = new Interface(VAULT_WARS_ABI as any);
        let roomId = "0000";
        for (const l of receipt.logs || []) {
          try {
            const parsed = iface.parseLog({
              topics: (l as any).topics,
              data: (l as any).data,
            });
            if (parsed?.name === "RoomCreated") {
              const rid =
                (parsed as any)?.args?.roomId ?? (parsed as any)?.args?.[0];
              roomId = rid?.toString?.() ?? String(rid);
              break;
            }
          } catch (e) {
            // ignore non-matching logs
          }
        }

        return roomId;
      } catch (error: any) {
        console.error("Error creating room:", error);
        toast({
          title: "❌ Failed to create room",
          description: error.message || "Transaction failed or was rejected.",
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [address, contract, toast]
  );

  const joinRoom = useCallback(
    async (
      roomId: string,
      vaultCode: number[],
      wager: string
    ): Promise<void> => {
      if (!address) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet to join a room.",
          variant: "destructive",
        });
        throw new Error("Wallet not connected");
      }

      try {
        setIsLoading(true);

        // Encrypt vault using FHE
        const encryptedVault = await encryptValue(address, vaultCode);

        toast({
          title: "⚡ Encrypting vault...",
          description: "Securing your code with FHE encryption.",
        });

        if (!contract) {
          // Mock implementation for development
          await new Promise((resolve) => setTimeout(resolve, 2000));

          toast({
            title: "🎯 Joined room successfully!",
            description: `Connected to room ${roomId}. Battle begins!`,
          });
          return;
        }

        // Real contract call
        const signer = await new ethers.BrowserProvider(
          window.ethereum
        ).getSigner();
        const contractWithSigner = contract.connect(signer) as any;
        const tx = await contractWithSigner.joinRoom(
          BigInt(roomId),
          encryptedVault.handles,
          encryptedVault.inputProof,
          {
            value: parseEther(wager),
          }
        );

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
        console.error("Error joining room:", error);
        toast({
          title: "❌ Failed to join room",
          description:
            error.message || "Transaction failed or room doesn't exist.",
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [address, contract, toast]
  );

  const submitProbe = useCallback(
    async (roomId: string, guessCode: number[]): Promise<void> => {
      if (!address) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet to submit a probe.",
          variant: "destructive",
        });
        throw new Error("Wallet not connected");
      }

      try {
        setIsLoading(true);

        // Encrypt guess using FHE
        const encryptedGuess = await encryptValue(address, guessCode);

        toast({
          title: "🔍 Launching probe...",
          description: "Encrypting your guess and submitting to blockchain.",
        });

        if (!contract) {
          // Mock implementation for development
          await new Promise((resolve) => setTimeout(resolve, 1500));

          toast({
            title: "🚀 Probe launched!",
            description: "Your encrypted guess has been submitted.",
          });
          return;
        }

        // Real contract call
        const signer = await new ethers.BrowserProvider(
          window.ethereum
        ).getSigner();
        const contractWithSigner = contract.connect(signer) as any;
        const tx = await contractWithSigner.submitProbe(
          BigInt(roomId),
          encryptedGuess.handles,
          encryptedGuess.inputProof
        );

        await tx.wait();

        toast({
          title: "🚀 Probe launched!",
          description: "Your encrypted guess has been submitted.",
        });
      } catch (error: any) {
        console.error("Error submitting probe:", error);
        toast({
          title: "❌ Failed to submit probe",
          description: error.message || "Transaction failed.",
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [address, contract, toast]
  );

  const cancelRoom = useCallback(
    async (roomId: string): Promise<void> => {
      if (!address) {
        throw new Error("Wallet not connected");
      }

      try {
        setIsLoading(true);

        if (!contract) {
          // Mock implementation
          await new Promise((resolve) => setTimeout(resolve, 1000));

          toast({
            title: "🚫 Room cancelled",
            description: "The game room has been cancelled and wager refunded.",
          });
          return;
        }

        const signer = await new ethers.BrowserProvider(
          window.ethereum
        ).getSigner();
        const contractWithSigner = contract.connect(signer) as any;
        const tx = await contractWithSigner.cancelRoom(BigInt(roomId));
        await tx.wait();

        toast({
          title: "🚫 Room cancelled",
          description: "The game room has been cancelled and wager refunded.",
        });
      } catch (error: any) {
        console.error("Error cancelling room:", error);
        toast({
          title: "❌ Failed to cancel room",
          description: error.message || "Transaction failed.",
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [address, contract, toast]
  );

  const claimTimeout = useCallback(
    async (roomId: string): Promise<void> => {
      if (!address) {
        throw new Error("Wallet not connected");
      }

      try {
        setIsLoading(true);

        if (!contract) {
          // Mock implementation
          await new Promise((resolve) => setTimeout(resolve, 1000));

          toast({
            title: "⏰ Timeout claimed",
            description: "You win by timeout! Wager has been transferred.",
          });
          return;
        }

        const signer = await new ethers.BrowserProvider(
          window.ethereum
        ).getSigner();
        const contractWithSigner = contract.connect(signer) as any;
        const tx = await contractWithSigner.claimTimeout(BigInt(roomId));
        await tx.wait();

        toast({
          title: "⏰ Timeout claimed",
          description: "You win by timeout! Wager has been transferred.",
        });
      } catch (error: any) {
        console.error("Error claiming timeout:", error);
        toast({
          title: "❌ Failed to claim timeout",
          description: error.message || "Transaction failed.",
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [address, contract, toast]
  );

  // Room state management
  const setCurrentRoom = useCallback((roomId: string | null) => {
    setCurrentRoomId(roomId);
    if (roomId) {
      try {
        localStorage.setItem("vaultwars.currentRoomId", roomId);
      } catch (e) {
        console.warn("failed to persist currentRoomId", e);
      }
    } else {
      try {
        localStorage.removeItem("vaultwars.currentRoomId");
      } catch (e) {
        console.warn("failed to clear currentRoomId", e);
      }
      setRoomGuesses([]);
    }
  }, []);

  // (loadRoomData defined above)

  const addGuess = useCallback((guess: Guess) => {
    console.log("addGuess: Adding guess:", guess);
    setRoomGuesses((prev) => {
      const existing = prev.find((g) => g.turnIndex === guess.turnIndex);
      if (existing) {
        return prev.map((g) =>
          g.turnIndex === guess.turnIndex ? { ...g, ...guess } : g
        );
      }
      return [...prev, guess];
    });
  }, []);

  const removeGuess = useCallback((turnIndex: number) => {
    setRoomGuesses((prev) => prev.filter((g) => g.turnIndex !== turnIndex));
  }, []);

  const updateProbeCache = useCallback(
    (roomId: string, probes: ProbeMetadata[]) => {
      setProbeCache((prev) => new Map(prev).set(roomId, probes));
    },
    []
  );

  const value: VaultWarsContextValue = {
    // State
    contract,
    isContractReady,
    isLoading,
    playerWins,
    probeCache,
    address,

    // Room state
    currentRoomId,
    roomData,
    roomGuesses,
    isListeningToEvents,

    // Contract methods
    getRoom,
    roomExists,
    getProbe,
    getLastResultEncrypted,
    isPlayerTurn,
    getPlayerWins,

    // Write methods
    createRoom,
    joinRoom,
    submitProbe,
    cancelRoom,
    claimTimeout,
    fulfillWinnerDecryption,

    // Room state management
    setCurrentRoom,
    loadRoomData,
    addGuess,
    removeGuess,
    updateProbeCache,
  };

  return (
    <VaultWarsContext.Provider value={value}>
      {children}
    </VaultWarsContext.Provider>
  );
};
