export const VAULT_WARS_ABI = [
  {
    inputs: [],
    name: "InvalidKMSSignatures",
    type: "error",
  },
  {
    inputs: [],
    name: "ZamaProtocolUnsupported",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "string",
        name: "param",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "ConfigUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "roomId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "winner",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "GameFinished",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "bytes32[]",
        name: "handlesList",
        type: "bytes32[]",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "abiEncodedCleartexts",
        type: "bytes",
      },
    ],
    name: "PublicDecryptionVerified",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "roomId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "submitter",
        type: "address",
      },
      {
        indexed: false,
        internalType: "ebool",
        name: "isWin",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "euint8[4]",
        name: "guess",
        type: "bytes32[4]",
      },
      {
        indexed: false,
        internalType: "euint8",
        name: "breaches",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "euint8",
        name: "signals",
        type: "bytes32",
      },
    ],
    name: "ResultComputed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "roomId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "by",
        type: "address",
      },
    ],
    name: "RoomCancelled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "roomId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "creator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "wager",
        type: "uint256",
      },
    ],
    name: "RoomCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "roomId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "opponent",
        type: "address",
      },
    ],
    name: "RoomJoined",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "roomId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "who",
        type: "address",
      },
    ],
    name: "VaultSubmitted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "roomId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "winner",
        type: "address",
      },
    ],
    name: "WinnerDecrypted",
    type: "event",
  },
  {
    inputs: [],
    name: "VAULT_CODE_LENGTH",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "roomId",
        type: "uint256",
      },
    ],
    name: "cancelRoom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "roomId",
        type: "uint256",
      },
    ],
    name: "claimTimeout",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "confidentialProtocolId",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "externalEuint8[4]",
        name: "externalVault",
        type: "bytes32[4]",
      },
      {
        internalType: "bytes",
        name: "inputProof",
        type: "bytes",
      },
    ],
    name: "createRoom",
    outputs: [
      {
        internalType: "uint256",
        name: "roomId",
        type: "uint256",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "roomId",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "cleartexts",
        type: "bytes",
      },
      {
        internalType: "bytes",
        name: "decryptionProof",
        type: "bytes",
      },
    ],
    name: "fulfillDecryption",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "roomId",
        type: "uint256",
      },
    ],
    name: "getLastResultEncrypted",
    outputs: [
      {
        internalType: "euint8",
        name: "breaches",
        type: "bytes32",
      },
      {
        internalType: "euint8",
        name: "signals",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "player",
        type: "address",
      },
    ],
    name: "getPlayerWins",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "roomId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "turnIndex",
        type: "uint256",
      },
    ],
    name: "getProbe",
    outputs: [
      {
        internalType: "address",
        name: "submitter",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "turn",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "resultPosted",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
      {
        internalType: "ebool",
        name: "isWinningProbe",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "roomId",
        type: "uint256",
      },
    ],
    name: "getRoom",
    outputs: [
      {
        internalType: "address",
        name: "creator",
        type: "address",
      },
      {
        internalType: "address",
        name: "opponent",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "wager",
        type: "uint256",
      },
      {
        internalType: "enum VaultWars.Phase",
        name: "phase",
        type: "uint8",
      },
      {
        internalType: "uint256",
        name: "turnCount",
        type: "uint256",
      },
      {
        internalType: "eaddress",
        name: "winner",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "createdAt",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "lastActiveAt",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalRooms",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "hasPendingRequest",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "roomId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "player",
        type: "address",
      },
    ],
    name: "isPlayerTurn",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "roomId",
        type: "uint256",
      },
      {
        internalType: "externalEuint8[4]",
        name: "externalVault",
        type: "bytes32[4]",
      },
      {
        internalType: "bytes",
        name: "inputProof",
        type: "bytes",
      },
    ],
    name: "joinRoom",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "joinTimeout",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "minWager",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "moveTimeout",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "nextRoomId",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "playerWins",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "probes",
    outputs: [
      {
        internalType: "address",
        name: "submitter",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "turnIndex",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "resultPosted",
        type: "bool",
      },
      {
        internalType: "euint8",
        name: "breaches",
        type: "bytes32",
      },
      {
        internalType: "euint8",
        name: "signals",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
      {
        internalType: "ebool",
        name: "isWinningProbe",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "roomId",
        type: "uint256",
      },
    ],
    name: "roomExists",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "rooms",
    outputs: [
      {
        internalType: "address",
        name: "creator",
        type: "address",
      },
      {
        internalType: "address",
        name: "opponent",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "wager",
        type: "uint256",
      },
      {
        internalType: "enum VaultWars.Phase",
        name: "phase",
        type: "uint8",
      },
      {
        internalType: "uint256",
        name: "turnCount",
        type: "uint256",
      },
      {
        internalType: "eaddress",
        name: "encryptedWinner",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "createdAt",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "lastActiveAt",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "roomId",
        type: "uint256",
      },
      {
        internalType: "externalEuint8[4]",
        name: "externalGuess",
        type: "bytes32[4]",
      },
      {
        internalType: "bytes",
        name: "inputProof",
        type: "bytes",
      },
    ],
    name: "submitProbe",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
