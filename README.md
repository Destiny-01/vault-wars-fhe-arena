# Vault Wars FHE Arena 🔐⚔️

A blockchain-based competitive puzzle game where two players battle to crack each other's vault codes using **Fully Homomorphic Encryption (FHE)**. Built on Ethereum with a cyberpunk-inspired UI.

## 🎮 What is Vault Wars?

Think Mastermind meets blockchain gaming. Players create secure vaults with 4-digit codes, wager ETH, and take turns trying to crack each other's encrypted vaults. The twist? Vault codes remain encrypted even during gameplay thanks to FHE, ensuring true privacy until a winner is determined.

## ✨ Features

- **🔐 Fully Homomorphic Encryption**: Vault codes stay encrypted during gameplay using Zama's FHE SDK
- **💰 ETH Wagering**: Set and compete for ETH prizes (winner takes 2x wager)
- **🎯 Mastermind-Style Gameplay**: Submit encrypted probes and receive "breached" (exact match) and "injured" (digit exists, wrong position) feedback
- **🔄 Real-Time Updates**: Live game state synchronization via blockchain events
- **🎨 Cyberpunk UI**: Matrix-inspired interface with smooth animations and dark theme
- **👛 Wallet Integration**: Connect with RainbowKit and MetaMask
- **📱 Responsive Design**: Play on desktop or mobile devices

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/bun
- MetaMask or compatible Web3 wallet
- Testnet ETH (for Sepolia testnet)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Environment Variables

Create a `.env` file:

```env
VITE_CONTRACT_ADDRESS=your_contract_address_here
```

## 🎯 How to Play

1. **Create a Room**: Set your 4-digit vault code (all digits must be unique) and wager ETH
2. **Wait for Opponent**: Share your room link or wait for someone to join
3. **Take Turns**: Players alternate submitting encrypted guesses
4. **Crack the Vault**: First player to guess the opponent's code wins 2x the wager
5. **Claim Prize**: Winners can claim their reward directly from the smart contract

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui + Radix UI
- **Blockchain**: wagmi + viem + ethers.js
- **Wallet**: RainbowKit
- **Encryption**: @zama-fhe/relayer-sdk
- **Routing**: React Router v6

## 📄 License

MIT
