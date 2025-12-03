# Vault Wars FHE Arena 🔐⚔️

> **The first blockchain game where vault codes remain encrypted during gameplay using Fully Homomorphic Encryption**

Vault Wars FHE Arena is a competitive puzzle game that combines the classic Mastermind gameplay with blockchain technology and **Zama's Fully Homomorphic Encryption (FHE)**. Two players battle to crack each other's encrypted vault codes while wagering ETH, with the revolutionary twist that **vault codes never need to be decrypted on-chain**—all game logic runs on encrypted data.

---

## 🎯 Why Vault Wars & The Need for FHE

### The Problem

Traditional blockchain games face a fundamental privacy challenge: **all game state is publicly visible on-chain**. In a competitive puzzle game like Mastermind, this means:

- Players' secret codes would be exposed before the game even starts
- Game strategies become transparent and exploitable
- The competitive integrity of the game is compromised
- Trustless gameplay becomes impossible without revealing secrets

### The Solution: FHE-Powered Privacy

Vault Wars leverages **Zama's FHEVM** to enable **private competitive gaming on-chain**. With Fully Homomorphic Encryption:

- ✅ Vault codes are encrypted before submission and **never decrypted on-chain**
- ✅ Game logic (breaches/signals calculation) runs entirely on **encrypted data**
- ✅ Winner determination happens **without revealing the winning code**
- ✅ Players can verify game fairness **without trusting a central authority**
- ✅ True **trustless, private puzzle battles** with ETH wagering

### Why FHE is Essential

Without FHE, Vault Wars would be impossible to build as a trustless blockchain game. Traditional approaches would require:
- A trusted third party to hold secrets (defeats the purpose of blockchain)
- Commit-reveal schemes (complex, multi-step, and still reveal secrets eventually)
- Zero-knowledge proofs (would require proving game logic without revealing state, extremely complex)

**FHE is the only technology that enables computation on encrypted data while maintaining privacy**, making it the perfect fit for this use case.

---

## 🔐 FHE Integration Deep Dive

Fully Homomorphic Encryption is the **core technology** that makes Vault Wars possible. The game leverages FHE throughout its entire lifecycle:

**Vault Code Encryption**: All 4-digit vault codes are encrypted using `euint8[4]` arrays before being submitted to the contract. These encrypted vaults remain on-chain throughout the game without ever being decrypted.

**Encrypted Game Logic**: The entire breaches/signals calculation runs on encrypted data. The `_computeBreachesAndSignals()` function performs all comparisons using FHE operations like `FHE.eq()`, `FHE.select()`, and `FHE.add()`, ensuring that vault codes and guesses never need to be decrypted during computation.

**Encrypted Winner Determination**: Winner addresses are stored as `eaddress` (encrypted address handles) until game finalization. This ensures that even the winner's identity remains private until the game is complete.

**Public Output Decryption**: Game feedback (breaches, signals, isWin) is made publicly decryptable via `FHE.makePubliclyDecryptable()` after computation completes, allowing players to see results without revealing their inputs.

Vault Wars maximizes FHE usage with **100% of vault codes encrypted**, **100% of guesses encrypted**, and **100% of game logic running on encrypted data**. The contract uses key FHE operations including `FHE.fromExternal()` for input encryption, `FHE.eq()` for encrypted comparisons, `FHE.select()` for conditional logic, `FHE.add()` for counting, boolean operations for signal detection, and `FHE.checkSignatures()` for KMS verification during winner finalization.

---

## 🏗️ Architecture & Flow

### System Architecture

```
┌─────────────────┐
│  React Frontend │
│  (Client-side)   │
└────────┬────────┘
         │
         │ encryptValue()
         │ (Zama FHE Relayer SDK)
         ▼
┌─────────────────┐
│  FHE Relayer    │
│  (@zama-fhe/    │
│   relayer-sdk)  │
└────────┬────────┘
         │
         │ External encrypted inputs
         │ + Input proofs
         ▼
┌─────────────────┐
│  VaultWars.sol  │
│  (Smart Contract)│
│  on FHEVM       │
└─────────────────┘
```

### Component Breakdown

1. **Frontend (React + TypeScript)**
   - User interface and game state management
   - Wallet integration (RainbowKit)
   - FHE encryption via Zama Relayer SDK
   - Event listening and decryption

2. **Zama FHE Relayer SDK**
   - Client-side encryption of vault codes and guesses
   - Public decryption of game results
   - Winner address decryption for finalization

3. **VaultWars.sol (Smart Contract)**
   - Encrypted vault storage
   - Encrypted game logic execution
   - Turn management and game state
   - Decryption callback handling

4. **Event Handler Service**
   - Real-time blockchain event monitoring
   - Automatic decryption of public outputs
   - UI state synchronization

### Data Flow Diagrams

#### Room Creation Flow

```
1. User enters 4-digit vault code + wager
   │
   ▼
2. Frontend: encryptValue(address, vaultCode)
   │
   ▼
3. FHE Relayer: createEncryptedInput() → encrypt()
   │
   ▼
4. Contract: createRoom(externalEuint8[4], inputProof)
   │
   ▼
5. Contract: FHE.fromExternal() → store as euint8[4]
   │
   ▼
6. Contract: FHE.allowThis() + FHE.allow() for permissions
   │
   ▼
7. Event: RoomCreated(roomId, creator, wager)
   │
   ▼
8. Frontend: Navigate to game screen
```

#### Probe Submission Flow

```
1. User submits encrypted guess
   │
   ▼
2. Frontend: encryptValue(address, guess)
   │
   ▼
3. Contract: submitProbe(roomId, externalEuint8[4], inputProof)
   │
   ▼
4. Contract: FHE.fromExternal() → euint8[4] guess
   │
   ▼
5. Contract: _computeBreachesAndSignals(encryptedVault, encryptedGuess)
   │   ├─ FHE.eq() comparisons
   │   ├─ FHE.select() conditional logic
   │   ├─ FHE.add() counting
   │   └─ FHE.and/or/not() boolean operations
   │
   ▼
6. Contract: FHE.makePubliclyDecryptable(breaches, signals, isWin)
   │
   ▼
7. Event: ResultComputed(roomId, submitter, isWin, guess, breaches, signals)
   │
   ▼
8. Frontend: fetchPublicDecryption(handles) → decrypt results
   │
   ▼
9. UI: Display breaches/signals to user
```

#### Winner Decryption Flow

```
1. Game detects winning probe (isWin = true)
   │
   ▼
2. Contract: room.encryptedWinner = FHE.select(isWin, eaddress(submitter), ...)
   │
   ▼
3. Contract: FHE.makePubliclyDecryptable(encryptedWinner)
   │
   ▼
4. Frontend: Detects WinnerDecrypted event OR auto-triggers
   │
   ▼
5. Frontend: fetchPublicDecryption([encryptedWinnerHandle])
   │
   ▼
6. Frontend: fulfillDecryption(roomId, abiEncodedClearValues, decryptionProof)
   │
   ▼
7. Contract: FHE.checkSignatures() → verify KMS signatures
   │
   ▼
8. Contract: _finalizeGameAndPayout(winner) → transfer ETH
   │
   ▼
9. Event: GameFinished(roomId, winner, amount)
```

### Smart Contract Architecture

The `VaultWars.sol` contract is structured around encrypted data:

- **Room Management**: Creation, joining, cancellation with encrypted vault storage
- **Encrypted Vault Storage**: `euint8[VAULT_CODE_LENGTH]` arrays for creator and opponent vaults
- **Encrypted Game Logic**: `_computeBreachesAndSignals()` performs all comparisons on encrypted data
- **Decryption Callback**: `fulfillDecryption()` verifies KMS signatures and finalizes games
- **Access Control**: FHE permissions managed via `FHE.allow()` and `FHE.allowThis()`

---

## 🎮 Application Flow

### Complete User Journey

#### Phase 1: Room Creation
1. **User Action**: Player navigates to "Create Room" and enters a 4-digit vault code
2. **Encryption**: Frontend calls `encryptValue()` which uses Zama's FHE Relayer SDK to encrypt each digit
3. **Blockchain Submission**: Encrypted vault (`externalEuint8[4]`) + input proof sent to `createRoom()`
4. **Contract Processing**: Contract converts external inputs to internal handles via `FHE.fromExternal()`
5. **Storage**: Encrypted vault stored as `euint8[4]` array in `Room.creatorVault`
6. **Permissions**: Contract grants access permissions using `FHE.allowThis()` and `FHE.allow()`
7. **Confirmation**: `RoomCreated` event emitted, user redirected to game screen

#### Phase 2: Room Joining
1. **User Action**: Opponent enters room ID and their own 4-digit vault code
2. **Encryption**: Same encryption process as room creation
3. **Blockchain Submission**: Encrypted vault sent to `joinRoom()` with matching wager
4. **Contract Processing**: Opponent vault stored as `euint8[4]` in `Room.opponentVault`
5. **Game Start**: Room phase changes to `InProgress`, `RoomJoined` event emitted

#### Phase 3: Probe Submission (Gameplay)
1. **User Action**: Player submits a 4-digit guess
2. **Encryption**: Guess encrypted using FHE Relayer SDK
3. **Blockchain Submission**: Encrypted guess sent to `submitProbe()`
4. **Encrypted Computation**: Contract calls `_computeBreachesAndSignals()`:
   - Compares encrypted guess digits with encrypted vault digits using `FHE.eq()`
   - Counts exact matches (breaches) using `FHE.select()` and `FHE.add()`
   - Detects signals (right digit, wrong position) with complex encrypted boolean logic
   - Determines if guess is winning (4 breaches) using `FHE.eq(breaches, 4)`
5. **Public Decryption Setup**: Results made publicly decryptable via `FHE.makePubliclyDecryptable()`
6. **Event Emission**: `ResultComputed` event with encrypted handles
7. **Client Decryption**: Frontend fetches public decryption for breaches, signals, and isWin
8. **UI Update**: Results displayed to user (e.g., "2 breaches, 1 signal")

#### Phase 4: Winner Determination
1. **Win Detection**: When a probe achieves 4 breaches, `isWin = true`
2. **Encrypted Winner Storage**: Contract sets `room.encryptedWinner = FHE.select(isWin, eaddress(submitter), ...)`
3. **Decryption Trigger**: Frontend detects win condition and calls `fulfillDecryption()`
4. **KMS Verification**: Contract verifies decryption signatures using `FHE.checkSignatures()`
5. **Payout**: Contract transfers 2x wager to winner
6. **Game End**: `GameFinished` event emitted, UI shows winner modal

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Version 18 or higher
- **npm/yarn/bun**: Package manager
- **MetaMask** or compatible Web3 wallet
- **Testnet ETH**: For Sepolia testnet (get from [faucets](https://sepoliafaucet.com/))

### Repository Structure

This project consists of two repositories:

1. **Frontend**: This repository (vault-wars-fhe-arena)
2. **Smart Contracts**: Separate repository (vault-wars-ca) containing the Hardhat project

### Installation

#### Frontend Setup

```bash
# Install dependencies
npm install

# Create .env file
echo "VITE_CONTRACT_ADDRESS=your_deployed_contract_address" > .env

# Start development server
npm run dev

# Build for production
npm run build
```

#### Smart Contract Setup

```bash
# Navigate to the contract repository
cd ../vault-wars-ca

# Install dependencies
npm install

# Set up environment variables
npx hardhat vars set MNEMONIC
npx hardhat vars set INFURA_API_KEY
npx hardhat vars set ETHERSCAN_API_KEY  # Optional, for verification

# Compile contracts
npm run compile

# Run tests
npm run test
```

### Environment Variables

#### Frontend (.env)
```env
VITE_CONTRACT_ADDRESS=0x...  # Deployed VaultWars contract address
```

#### Smart Contracts (Hardhat vars)
- `MNEMONIC`: Your wallet mnemonic for deployment
- `INFURA_API_KEY`: Infura API key for network access
- `ETHERSCAN_API_KEY`: (Optional) For contract verification

### Deployment

#### Deploy to Local Network

```bash
# Terminal 1: Start local FHEVM node (in contract repo)
npx hardhat node

# Terminal 2: Deploy contracts
npx hardhat deploy --network localhost
```

#### Deploy to Sepolia Testnet

```bash
# In the contract repository
npx hardhat deploy --network sepolia

# Verify contract (optional)
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

After deployment, update the frontend `.env` file with the deployed contract address.

### Running the Application

1. **Start Frontend**:
   ```bash
   npm run dev
   ```

2. **Connect Wallet**: Open the app in your browser and connect your MetaMask wallet

3. **Switch to Sepolia**: Ensure your wallet is connected to Sepolia testnet

4. **Create or Join a Room**: Start playing!

### Navigation

- **Frontend**: React app with routes for creating/joining rooms and gameplay
- **Contracts**: Solidity contracts in the contract repository at `contracts/VaultWars.sol`
- **Tests**: Comprehensive test suite in `hardhat/test/VaultWars.ts` (in contract repo)

---

## 🔒 Privacy Guarantees

Vault Wars provides **strong privacy guarantees** through FHE:

### What Stays Encrypted

1. **Vault Codes**: Never decrypted on-chain. Stored as `euint8[4]` arrays throughout the entire game lifecycle
2. **Guesses**: Encrypted before submission and remain encrypted during computation
3. **Winner Address**: Stored as `eaddress` (encrypted address handle) until finalization
4. **Game Logic**: All comparisons and calculations happen on encrypted data

### When Decryption Occurs

Decryption only happens in **controlled, necessary scenarios**:

1. **Public Outputs**: Breaches, signals, and isWin are made publicly decryptable **after** computation completes, allowing players to see game feedback without revealing inputs
2. **Winner Finalization**: Winner address is decrypted **only** when a win is detected and the game is being finalized, with KMS signature verification
3. **Client-Side Only**: All decryption happens client-side via Zama's Relayer SDK, never exposing plaintext on-chain

### KMS Verification

The contract uses **KMS (Key Management Service) signature verification** to ensure decryption integrity:

```solidity
function fulfillDecryption(uint256 roomId, bytes memory cleartexts, bytes memory decryptionProof) external {
    // Verify KMS/Gateway signatures
    FHE.checkSignatures(cts, cleartexts, decryptionProof);
    // Only proceed if signatures are valid
}
```

This ensures that:
- Decryptions are authorized by the FHEVM network
- No malicious decryption can occur
- Game integrity is maintained

### Security Properties

- **Input Privacy**: Vault codes and guesses never appear in plaintext on-chain
- **Computation Privacy**: Game logic runs on encrypted data, revealing nothing about inputs
- **Output Privacy**: Only necessary outputs (game feedback) are decrypted
- **Verifiability**: All game logic is on-chain and verifiable, while maintaining privacy
- **Trustlessness**: No trusted third party needed; FHE enables trustless private computation

---

## 🛠️ Technology Stack

### Frontend
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Styling
- **shadcn/ui + Radix UI**: Component library
- **React Router v6**: Client-side routing

### Blockchain Integration
- **Solidity 0.8.19**: Smart contract language
- **Hardhat**: Development environment
- **ethers.js v6**: Ethereum library
- **wagmi + viem**: React hooks for Ethereum
- **RainbowKit**: Wallet connection UI

### FHE Technology
- **@zama-fhe/relayer-sdk**: Client-side FHE encryption/decryption
- **@fhevm/solidity**: FHE operations in Solidity
- **FHEVM**: Zama's FHE-enabled Ethereum Virtual Machine
- **@fhevm/hardhat-plugin**: Hardhat plugin for FHE testing

### Testing
- **Chai**: Assertion library
- **Hardhat FHEVM Plugin**: FHE testing utilities
- **Mocha**: Test framework (via Hardhat)

### Additional Tools
- **TypeChain**: TypeScript bindings for contracts
- **Hardhat Deploy**: Deployment management
- **Solidity Coverage**: Test coverage reporting

---

## 🧪 Testing Overview

### Test Suite Location

All tests are located in: `hardhat/test/VaultWars.ts` (in the contract repository)

### Test Execution

```bash
# In the contract repository
npm run test
```

### Test Categories

#### 1. Room Creation Tests
- ✅ **Valid wager**: Creates room with sufficient ETH
- ✅ **Insufficient wager**: Rejects creation below minimum
- ✅ **Multiple rooms**: Supports concurrent room creation
- ✅ **Event emission**: Verifies `RoomCreated` and `VaultSubmitted` events

**What it verifies**: FHE encryption of vault codes, proper contract state initialization, event correctness

#### 2. Room Joining Tests
- ✅ **Matching wager**: Allows joining with correct wager amount
- ✅ **Mismatched wager**: Rejects joining with wrong wager
- ✅ **Own room rejection**: Prevents creator from joining their own room
- ✅ **Phase enforcement**: Rejects joining rooms already in progress

**What it verifies**: Encrypted vault storage for opponent, phase transitions, access control

#### 3. Probe Submission & Game Logic Tests
- ✅ **Exact match**: Correctly calculates 4 breaches for perfect guess
- ✅ **Partial match**: Accurately counts breaches for partial matches
- ✅ **Signals detection**: Correctly identifies right digit, wrong position
- ✅ **Mixed results**: Handles combinations of breaches and signals
- ✅ **No matches**: Returns 0 breaches, 0 signals for completely wrong guesses
- ✅ **Duplicate digits**: Handles duplicate digits in guesses correctly
- ✅ **Turn order**: Enforces alternating turns between players
- ✅ **Turn count tracking**: Increments turn count correctly

**What it verifies**: 
- **FHE computation accuracy**: All game logic runs correctly on encrypted data
- **Encrypted equality checks**: `FHE.eq()` comparisons work properly
- **Encrypted counting**: `FHE.add()` and `FHE.select()` for breach/signal counting
- **Complex encrypted logic**: Nested boolean operations for signal detection

#### 4. Room Cancellation Tests
- ✅ **Creator cancel**: Allows creator to cancel before opponent joins
- ✅ **Post-join rejection**: Prevents cancellation after game starts
- ✅ **Non-creator rejection**: Only creator can cancel

**What it verifies**: Phase management, access control, refund logic

#### 5. Player Statistics Tests
- ✅ **Win tracking**: Correctly increments `playerWins` mapping

**What it verifies**: State management, winner determination

#### 6. Edge Cases & Error Handling
- ✅ **Invalid room**: Rejects operations on non-existent rooms
- ✅ **Phase checks**: Enforces correct phase for each operation
- ✅ **No probes yet**: Handles queries before any probes submitted
- ✅ **Turn identification**: Correctly identifies whose turn it is

**What it verifies**: Robust error handling, state validation

#### 7. Complex Game Scenarios
- ✅ **Full game flow**: Complete game from creation to win
- ✅ **Multiple wrong guesses**: Handles extended gameplay
- ✅ **Concurrent rooms**: Supports multiple simultaneous games

**What it verifies**: End-to-end game flow, state isolation between rooms

### What Tests Verify

The test suite comprehensively verifies:

1. **FHE Encryption/Decryption Correctness**
   - Vault codes are properly encrypted before submission
   - Encrypted data is correctly stored and retrieved
   - Public decryption works for game results

2. **Encrypted Computation Accuracy**
   - Breaches calculation matches expected results
   - Signals detection works correctly
   - Winner determination logic is accurate

3. **Turn Order Enforcement**
   - Players can only submit on their turn
   - Turn alternation works correctly
   - Turn count increments properly

4. **Winner Determination Logic**
   - Winning probes correctly set `isWinner = true`
   - Encrypted winner address is set when win detected
   - Game finalization works correctly

5. **Contract State Management**
   - Room phases transition correctly
   - Encrypted vaults are stored properly
   - Player statistics are tracked accurately

### Test Results

All tests pass successfully, providing comprehensive coverage of:
- ✅ FHE operations and encrypted computations
- ✅ Game logic and state management
- ✅ Access control and permissions
- ✅ Error handling and edge cases
- ✅ End-to-end game flows

The test suite demonstrates that **FHE is working correctly** and that **all game logic runs accurately on encrypted data**.

---

## 🗺️ Roadmap

### Phase 1: Core Enhancements
- [ ] **Tournament Mode**: Multi-player tournaments with bracket-style competition
- [ ] **Leaderboards**: Global and per-room leaderboards with encrypted statistics
- [ ] **Custom Game Modes**: Variable code lengths, time limits, difficulty settings

### Phase 2: Advanced Features
- [ ] **NFT Integration**: Mintable NFTs for winners, achievements, and collectibles
- [ ] **Cross-Chain Support**: Deploy on multiple FHEVM-enabled chains
- [ ] **Mobile App**: Native mobile application with optimized FHE performance

### Phase 3: Community & Ecosystem
- [ ] **Open Source SDK**: Publish SDK for building FHE games
- [ ] **Game Templates**: Templates for other FHE-based games
- [ ] **Community Governance**: DAO for game parameter management

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

Built with **Zama's FHEVM** technology, enabling private computation on Ethereum.

- [Zama Documentation](https://docs.zama.ai)
- [FHEVM GitHub](https://github.com/zama-ai/fhevm)
- [Zama Discord](https://discord.gg/zama)

---

**Vault Wars FHE Arena** - Demonstrating the power of Fully Homomorphic Encryption for private, trustless blockchain gaming. 🔐⚔️
