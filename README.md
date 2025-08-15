# MCPayStream 🚀

**Live Blockchain Analytics Platform for Solana**

A real-time dashboard for monitoring Solana wallet transactions, earnings, and analytics with live blockchain data integration.

## ✨ Features

- **Live Blockchain Data** - Real-time SOL balance and transaction monitoring
- **Daily Analytics** - Track daily SOL received and transaction counts
- **Top Senders/Wallets** - See who's sending SOL and transaction details
- **Earnings Charts** - Visualize earnings over time with live data
- **Real-time Updates** - WebSocket-powered live updates without page refresh
- **Devnet Testing** - Full Solana Devnet integration for testing
- **Modern UI** - Sleek black theme with responsive design

## 🏗️ Architecture

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express + Socket.IO
- **Database**: PostgreSQL with Prisma ORM
- **Blockchain**: Solana Web3.js integration
- **Real-time**: WebSocket connections for live updates
- **Deployment**: Ready for production deployment

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Solana CLI (optional, for testing)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd MCPayStream

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Environment Setup

Copy the environment template and configure:

```bash
cd backend
cp env.template .env
```

Update `.env` with your configuration:

```env
# Server Configuration
NODE_ENV=development
PORT=5001
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Database Configuration (Supabase/PostgreSQL)
DATABASE_URL="postgresql://postgres:password@localhost:5432/mcpaystream?schema=public"

# Solana Configuration (Devnet)
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_WS_URL=wss://api.devnet.solana.com
SOLANA_NETWORK=devnet
SOLANA_KEYPAIR_PATH=~/.config/solana/mcpaystream.json

# CoinGecko API
COINGECKO_API_URL=https://api.coingecko.com/api/v3
COINGECKO_API_KEY=your-coingecko-api-key-optional

# Webhook Configuration
WEBHOOK_URL=your-webhook-url-here
WEBHOOK_SECRET=your-webhook-secret-here

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Database Setup

#### Option A: Supabase (Recommended)

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your database connection string
3. Update `DATABASE_URL` in `.env`
4. Run database migrations:

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

#### Option B: Local PostgreSQL

```bash
# Install PostgreSQL locally
brew install postgresql  # macOS
sudo apt-get install postgresql  # Ubuntu

# Create database
createdb mcpaystream

# Run migrations
cd backend
npx prisma migrate deploy
npx prisma generate
```

### 4. Start the Application

```bash
# Terminal 1: Start Backend
cd backend
npm run dev

# Terminal 2: Start Frontend
npm run dev
```

Visit: http://localhost:5173 (or the port Vite assigns)

## 🧪 Solana Devnet Testing Setup

### Install Solana CLI

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Restart terminal or reload shell
source ~/.bashrc  # or source ~/.zshrc
```

### Configure Solana for Devnet

```bash
# Switch to Devnet
solana config set --url https://api.devnet.solana.com

# Verify configuration
solana config get
```

### Generate Test Wallets

#### Method 1: Using Solana CLI (Recommended)

```bash
# Generate main test wallet
solana-keygen new --outfile ~/.config/solana/mcpaystream.json --no-bip39-passphrase

# Generate additional sender wallet
solana-keygen new --outfile ~/.config/solana/sender.json --no-bip39-passphrase

# Generate random test wallet
solana-keygen new --outfile ~/.config/solana/random1.json --no-bip39-passphrase
```

#### Method 2: Using Our Backend Script

```bash
cd backend
npm run devnet:keypair
```

### Get Test SOL (Airdrop)

#### Method 1: Solana CLI Airdrop

```bash
# Airdrop to main wallet
solana airdrop 2 -k ~/.config/solana/mcpaystream.json

# Airdrop to sender wallet
solana airdrop 1 -k ~/.config/solana/sender.json

# Airdrop to random wallet
solana airdrop 1 -k ~/.config/solana/random1.json
```

#### Method 2: Web Faucet (If CLI rate limited)

Visit [Solana Devnet Faucet](https://faucet.solana.com) and enter your wallet address.

### View Wallet Information

```bash
# View wallet address
solana address -k ~/.config/solana/mcpaystream.json
solana address -k ~/.config/solana/sender.json

# Check wallet balance
solana balance -k ~/.config/solana/mcpaystream.json
solana balance -k ~/.config/solana/sender.json

# Check any wallet balance (without keypair)
solana balance AWnVcuqiHSXxe4vLZVBxHPhKc6kzZWaCBTAvBqY5iDeQ
```

### Send SOL Transactions

#### Send to Specific Address

```bash
# Send 0.5 SOL to a specific address
solana transfer AWnVcuqiHSXxe4vLZVBxHPhKc6kzZWaCBTAvBqY5iDeQ 0.5 -k ~/.config/solana/mcpaystream.json

# Send 0.3 SOL to another address
solana transfer 9B5XszUGdMaxCZ7uSQhPzdks5ZQSmWxrmzCSvtJ6Ns6g 0.3 -k ~/.config/solana/mcpaystream.json

# Send from sender wallet to main wallet
solana transfer AWnVcuqiHSXxe4vLZVBxHPhKc6kzZWaCBTAvBqY5iDeQ 0.2 -k ~/.config/solana/sender.json
```

#### Send to Random Addresses

```bash
# Send to random address 1
solana transfer 9B5XszUGdMaxCZ7uSQhPzdks5ZQSmWxrmzCSvtJ6Ns6g 0.1 -k ~/.config/solana/mcpaystream.json

# Send to random address 2
solana transfer 56UjHEdHADpgc4Eqdzbk2HEVxpQQ2tdCwGptYAgTfXGe 0.2 -k ~/.config/solana/mcpaystream.json

# Send to random address 3
solana transfer D8FL9VwTjXgyLfvGwEZNyxUxyCTPXzcVnjhWPAZcgsS9 0.3 -k ~/.config/solana/mcpaystream.json
```

#### Self-Transfer (Send to Yourself)

```bash
# Send to your own wallet (self-transfer)
solana transfer AWnVcuqiHSXxe4vLZVBxHPhKc6kzZWaCBTAvBqY5iDeQ 0.1 -k ~/.config/solana/mcpaystream.json
```

### View Transaction History

```bash
# View transaction history for a wallet
solana transaction-history AWnVcuqiHSXxe4vLZVBxHPhKc6kzZWaCBTAvBqY5iDeQ -k ~/.config/solana/mcpaystream.json

# Confirm a specific transaction
solana confirm -v 5xb8GeKpiaHS6TpLYPWjhhDCgdVbGAfpnCsPK1deUtxHbf2S4B2LdNzFnNgNk6kEKqaG5eb5bsaxC8zp61aH92ef
```

### Backend Devnet Commands

```bash
cd backend

# Generate keypair using our script
npm run devnet:keypair

# View wallet address
npm run devnet:address

# Check balance
npm run devnet:balance

# Send SOL (if you have our send script)
node test/send.mjs <RECIPIENT_ADDRESS> <AMOUNT>
```

## 📊 Usage

### 1. Enter Wallet Address

- Input any Solana wallet address in the dashboard
- The system will fetch live blockchain data
- Real-time monitoring begins automatically

### 2. View Analytics

- **Daily Received**: Today's SOL received
- **Total Received**: All-time earnings
- **Current Balance**: Live wallet balance
- **SOL Price**: Current market price
- **Transactions**: Total transaction count

### 3. Real-time Features

- Live transaction updates via WebSocket
- Automatic balance refresh
- Real-time earnings chart updates
- Live leaderboard updates

## 🔧 Development

### Project Structure

```
MCPayStream/
├── src/                    # Frontend React app
│   ├── components/        # React components
│   ├── context/          # React context providers
│   ├── pages/            # Page components
│   └── utils/            # Utility functions
├── backend/               # Node.js backend
│   ├── src/              # Backend source code
│   ├── prisma/           # Database schema & migrations
│   ├── scripts/          # Utility scripts
│   └── logs/             # Application logs
├── shared/                # Shared utilities
└── README.md             # This file
```

### Key Backend Files

- `backend/src/index.js` - Express server setup
- `backend/src/socket.js` - WebSocket configuration
- `backend/src/controllers/` - API controllers
- `backend/src/models/` - Database models
- `backend/src/blockchain/` - Solana integration
- `backend/src/services/` - Business logic services

### Key Frontend Files

- `src/pages/Dashboard.jsx` - Main dashboard
- `src/context/WalletContext.jsx` - Wallet state management
- `src/components/` - Reusable components
- `src/utils/` - Utility functions

### Database Schema

The application uses Prisma with the following main models:

- **Creator** - Wallet owners and their metadata
- **Transaction** - All blockchain transactions
- **Analytics** - Computed statistics and metrics

## 🚀 Production Deployment

### Environment Variables

Update `.env` for production:

```env
NODE_ENV=production
DATABASE_URL=your-production-postgresql-url
JWT_SECRET=your-production-jwt-secret
CORS_ORIGIN=your-frontend-domain
```

### Build Commands

```bash
# Frontend
npm run build

# Backend
cd backend
npm run build
```

### Deployment Options

- **Vercel/Netlify** - Frontend deployment
- **Railway/Render** - Backend deployment
- **Supabase** - Database hosting
- **Docker** - Containerized deployment

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure `CORS_ORIGIN` matches your frontend URL
   - Check backend is running on correct port

2. **Database Connection**
   - Verify `DATABASE_URL` is correct
   - Ensure PostgreSQL is running
   - Run `npx prisma migrate deploy`

3. **Solana Connection**
   - Check `SOLANA_RPC_URL` is accessible
   - Verify network is set to `devnet`
   - Test with `npm run devnet:balance`

4. **Real-time Updates Not Working**
   - Check WebSocket connection in browser console
   - Verify Socket.IO server is running
   - Check for firewall/network issues

5. **Airdrop Rate Limited**
   - Use web faucet: https://faucet.solana.com
   - Wait a few minutes between airdrops
   - Try smaller amounts (0.5 SOL instead of 2 SOL)

6. **Transaction Not Appearing**
   - Check if transaction is incoming (not outgoing)
   - Verify wallet address is correct
   - Check transaction status with `solana confirm`

### Debug Mode

```bash
# Backend with debug logging
cd backend
LOG_LEVEL=debug npm run dev

# Frontend with debug info
npm run dev
```

## 📝 API Endpoints

### Wallet Management
- `GET /api/wallets/:address` - Get wallet data
- `POST /api/wallets` - Create wallet

### Transactions
- `GET /api/transactions/:address` - Get transactions
- `GET /api/transactions/:address/stats` - Get transaction stats
- `POST /api/transactions/refresh/:address` - Refresh transactions

### Analytics
- `GET /api/stats/earnings/:address` - Get earnings data
- `GET /api/stats/top-senders` - Get top senders
- `GET /api/stats/leaderboard` - Get leaderboard

### Real-time Events
- `transaction-update` - New transaction received
- `balance-update` - Balance changed
- `earnings-update` - Earnings updated
- `leaderboard-update` - Leaderboard changed

## 🎯 Quick Command Reference

### Essential Commands

```bash
# Setup
solana config set --url https://api.devnet.solana.com
solana-keygen new --outfile ~/.config/solana/mcpaystream.json --no-bip39-passphrase

# Get SOL
solana airdrop 2 -k ~/.config/solana/mcpaystream.json

# Check balance
solana balance -k ~/.config/solana/mcpaystream.json

# Send SOL
solana transfer <RECIPIENT> <AMOUNT> -k ~/.config/solana/mcpaystream.json

# View address
solana address -k ~/.config/solana/mcpaystream.json
```

### Testing Commands

```bash
# Generate sender wallet
solana-keygen new --outfile ~/.config/solana/sender.json --no-bip39-passphrase

# Send from sender to main wallet
solana transfer <MAIN_WALLET_ADDRESS> 0.5 -k ~/.config/solana/sender.json

# Check transaction
solana confirm -v <TRANSACTION_SIGNATURE>
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- **Issues**: Create a GitHub issue
- **Documentation**: Check this README
- **Community**: Join our Discord/Telegram

---

**Built with ❤️ for the Solana ecosystem**
