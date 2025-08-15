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

## 🧪 Devnet Testing Setup

### Generate Test Wallet

```bash
cd backend
npm run devnet:keypair
```

This creates `~/.config/solana/mcpaystream.json` and displays your wallet address.

### Get Test SOL

Visit [Solana Devnet Faucet](https://faucet.solana.com) and enter your wallet address.

### Test Commands

```bash
# View wallet address
npm run devnet:address

# Check balance
npm run devnet:balance

# Solana CLI commands
solana address -k ~/.config/solana/mcpaystream.json
solana balance -k ~/.config/solana/mcpaystream.json
solana transfer <RECIPIENT> 0.1 -k ~/.config/solana/mcpaystream.json
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

### Analytics
- `GET /api/stats/earnings/:address` - Get earnings data
- `GET /api/stats/top-senders` - Get top senders
- `GET /api/stats/leaderboard` - Get leaderboard

### Real-time Events
- `transaction-update` - New transaction received
- `balance-update` - Balance changed
- `earnings-update` - Earnings updated
- `leaderboard-update` - Leaderboard changed

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
