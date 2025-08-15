# 🚀 MCPayStream Devnet Setup Guide

This guide will help you set up a Solana Devnet environment for testing MCPayStream.

## 📋 Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Terminal/Command Prompt access

## 🔧 Quick Setup

### Option 1: Using the Setup Script (Recommended)

```bash
# Make the script executable and run it
chmod +x setup-devnet.sh
./setup-devnet.sh
```

### Option 2: Using npm Scripts

```bash
# Generate a new Devnet keypair
npm run devnet:keypair

# View your wallet address
npm run devnet:address

# Check balance info
npm run devnet:balance
```

### Option 3: Manual Setup

1. **Create Solana config directory:**
   ```bash
   mkdir -p ~/.config/solana
   ```

2. **Generate keypair using Node.js:**
   ```bash
   node scripts/generate-devnet-keypair.js
   ```

## 🌐 Environment Configuration

Create a `.env` file in the backend directory with:

```env
# Server Configuration
NODE_ENV=development
PORT=5001
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Database Configuration
DATABASE_URL="postgresql://postgres:password@localhost:5432/mcpaystream?schema=public"

# Solana Configuration (Devnet)
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_WS_URL=wss://api.devnet.solana.com
SOLANA_NETWORK=devnet
SOLANA_KEYPAIR_PATH=~/.config/solana/mcpaystream.json

# CoinGecko API
COINGECKO_API_URL=https://api.coingecko.com/api/v3
COINGECKO_API_KEY=your-coingecko-api-key-optional

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🔑 Getting Test SOL

### Method 1: Web Faucet (Recommended)
Visit [https://faucet.solana.com](https://faucet.solana.com) and enter your wallet address.

### Method 2: CLI Airdrop (Rate Limited)
```bash
# Check if Solana CLI is installed
solana --version

# If not installed, install it
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Switch to Devnet
solana config set --url https://api.devnet.solana.com

# Airdrop test SOL (may fail due to rate limits)
solana airdrop 2 ~/.config/solana/mcpaystream.json
```

## 🧪 Testing Your Setup

1. **Start the backend:**
   ```bash
   npm run dev
   ```

2. **Copy your wallet address** from the setup output

3. **Use the address in your frontend** dashboard

4. **Test with the web faucet** to get test SOL

## 📱 Available Commands

```bash
# Generate new keypair
npm run devnet:keypair

# View wallet address
npm run devnet:address

# Check balance info
npm run devnet:balance

# Full setup (if Solana CLI available)
npm run devnet:setup
```

## 🔍 Troubleshooting

### Rate Limiting Issues
- **Problem**: 429 "Too Many Requests" errors
- **Solution**: Wait a few minutes between requests or use the web faucet

### Keypair Not Found
- **Problem**: "No keypair found" error
- **Solution**: Run `npm run devnet:keypair` to generate a new one

### Connection Issues
- **Problem**: Can't connect to Devnet
- **Solution**: Check your internet connection and firewall settings

### Balance Issues
- **Problem**: Wallet shows 0 SOL
- **Solution**: Use the web faucet at https://faucet.solana.com

## 💡 Pro Tips

1. **Save your wallet address** - you'll need it for testing
2. **Use the web faucet** - it's more reliable than CLI airdrops
3. **Keep your keypair safe** - it's only for testing, but still secure it
4. **Test with small amounts** - Devnet SOL has no real value
5. **Check the explorer** - view your wallet at [Solana Explorer](https://explorer.solana.com/?cluster=devnet)

## 🚀 Next Steps

After setup:
1. ✅ Your Devnet wallet is ready
2. ✅ Backend is configured for Devnet
3. ✅ You can test the full MCPayStream experience
4. ✅ Real-time blockchain data will work
5. ✅ All features will function with test data

Happy testing! 🎉
