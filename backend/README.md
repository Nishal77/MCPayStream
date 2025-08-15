# MCPayStream Backend

A modern Node.js backend for MCPayStream, a blockchain-powered payment tracking dashboard for content creators.

## 🚀 Features

- **Prisma ORM** with PostgreSQL (Supabase)
- **Solana Blockchain Integration** for real-time payment tracking
- **WebSocket Support** via Socket.IO for real-time updates
- **RESTful API** with comprehensive endpoints
- **Rate Limiting** and security middleware
- **Comprehensive Logging** with Winston
- **QR Code Generation** for wallet addresses
- **Export Functionality** (CSV/JSON)

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Blockchain**: Solana Web3.js
- **Real-time**: Socket.IO
- **Authentication**: JWT
- **Logging**: Winston
- **Validation**: Express-validator

## 📋 Prerequisites

- Node.js 18+ 
- Supabase account and project
- Solana wallet address

## 🔧 Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create `env.development` file with your Supabase credentials:

```env
# Environment
NODE_ENV=development
PORT=5000

# Supabase Database Connection
DATABASE_URL="postgresql://postgres.oiaofdufyanysebbspky:[YOUR-PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.oiaofdufyanysebbspky:[YOUR-PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"

# Solana Configuration
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_WS_URL=wss://api.mainnet-beta.solana.com
SOLANA_WALLET_ADDRESS=9nGxKEUZkJAJAiaBZfvQVJPVvbpfndVjmPm5SBj5rHmr
SOLANA_NETWORK=mainnet-beta

# CoinGecko API
COINGECKO_API_URL=https://api.coingecko.com/api/v3
COINGECKO_API_KEY=

# JWT Configuration
JWT_SECRET=mcpaystream-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Webhook Configuration
WEBHOOK_URL=
WEBHOOK_SECRET=

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=http://localhost:3000

# Compression
COMPRESSION_LEVEL=6
```

### 3. Initialize Database

```bash
# Run the initialization script
npm run init-db

# Or run manually:
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

## 📊 Database Schema

### Creator Model
- `id`: Unique identifier
- `name`: Creator's display name
- `email`: Creator's email address
- `solanaAddress`: Solana wallet address
- `commissionRate`: Commission rate (default: 30%)
- `totalEarnings`: Total earnings in USD
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### Transaction Model
- `id`: Unique identifier
- `txHash`: Solana transaction hash
- `senderAddress`: Sender's wallet address
- `receiverAddress`: Receiver's wallet address
- `amountSOL`: Amount in SOL
- `usdValue`: USD equivalent at transaction time
- `status`: Transaction status (PENDING, CONFIRMED, FAILED)
- `timestamp`: Transaction timestamp
- `creatorId`: Reference to creator

## 🔌 API Endpoints

### Wallets (Creators)
- `GET /api/wallets/:address` - Get creator by Solana address
- `PUT /api/wallets/:address` - Update creator details
- `GET /api/wallets/:address/qr` - Get QR code for address
- `GET /api/wallets/:address/stats` - Get creator statistics
- `GET /api/wallets` - Get all creators
- `GET /api/wallets/search` - Search creators

### Transactions
- `GET /api/transactions/creator/:address` - Get creator transactions
- `GET /api/transactions/:id` - Get transaction by ID
- `GET /api/transactions/hash/:hash` - Get transaction by hash
- `GET /api/transactions/stats/:address` - Get transaction statistics
- `GET /api/transactions/export/:address` - Export transactions
- `PATCH /api/transactions/:id/status` - Update transaction status
- `GET /api/transactions/recent` - Get recent transactions
- `GET /api/transactions/address/:address` - Get transactions by address

### Statistics
- `GET /api/stats/global` - Get global platform statistics
- `GET /api/stats/top-senders` - Get top senders
- `GET /api/stats/daily-summary` - Get daily summary
- `GET /api/stats/rankings` - Get creator rankings
- `GET /api/stats/trends/:creatorId` - Get trend analysis
- `GET /api/stats/insights` - Get platform insights
- `GET /api/stats/performance` - Get performance metrics

## 🗄️ Database Management

### Prisma Commands

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio

# Reset database
npm run prisma:reset

# Seed database
npm run db:seed
```

### View Database

```bash
npx prisma studio
```

## 🔍 Health Check

```bash
curl http://localhost:5000/health
```

## 📝 Logging

Logs are stored in the `logs/` directory:
- `combined.log` - All logs
- `error.log` - Error logs only

## 🚀 Production Deployment

1. Set `NODE_ENV=production`
2. Use secure JWT secret
3. Configure production database URL
4. Set up proper CORS origins
5. Configure webhook endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details


