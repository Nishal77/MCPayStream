# MCPayStream

A modern, blockchain-powered payment tracking dashboard for content creators built with React, Node.js, and Solana.

## 🚀 Features

- **Real-time Payment Tracking**: Monitor Solana transactions in real-time
- **Live Dashboard**: Beautiful, responsive dashboard with live updates
- **Blockchain Integration**: Direct integration with Solana blockchain
- **QR Code Generation**: Generate QR codes for wallet addresses
- **Export Functionality**: Export transaction data to CSV
- **Dark/Light Theme**: Toggle between themes
- **WebSocket Support**: Real-time updates via Socket.IO
- **Responsive Design**: Mobile-first, modern UI built with Tailwind CSS

## 🏗️ Architecture

### Backend
- **Node.js + Express**: RESTful API server
- **MongoDB**: Database for storing transaction data
- **Solana Web3.js**: Blockchain integration
- **Socket.IO**: Real-time communication
- **Winston**: Comprehensive logging
- **CoinGecko API**: Live SOL price data

### Frontend
- **React 18**: Modern React with hooks
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Recharts**: Beautiful, responsive charts
- **Socket.IO Client**: Real-time updates
- **Lucide React**: Beautiful icons

## 📁 Project Structure

```
mcpaystream/
├── backend/                    # Backend server
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   ├── blockchain/        # Solana integration
│   │   ├── controllers/       # API controllers
│   │   ├── models/            # Database models
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   ├── utils/             # Utilities
│   │   └── index.js           # Server entry point
│   └── package.json
├── src/                       # Frontend React app
│   ├── components/            # Reusable components
│   ├── pages/                 # Page components
│   ├── context/               # React context
│   ├── hooks/                 # Custom hooks
│   ├── services/              # API services
│   └── styles/                # Global styles
├── shared/                    # Shared utilities
├── docker-compose.yml         # Docker setup
└── package.json
```

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- MongoDB 7.0+
- Docker & Docker Compose (optional)

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mcpaystream
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - MongoDB: localhost:27017

### Manual Installation

1. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Install frontend dependencies**
   ```bash
   cd ..
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp backend/env.example backend/.env
   # Edit backend/.env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # Start MongoDB service
   ```

5. **Start backend**
   ```bash
   cd backend
   npm run dev
   ```

6. **Start frontend**
   ```bash
   cd ..
   npm run dev
   ```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
JWT_SECRET=your-secret-key

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/mcpaystream

# Solana Configuration
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_WS_URL=wss://api.mainnet-beta.solana.com
SOLANA_WALLET_ADDRESS=your-wallet-address

# CoinGecko API
COINGECKO_API_URL=https://api.coingecko.com/api/v3
COINGECKO_API_KEY=your-api-key-optional

# Webhook Configuration
WEBHOOK_URL=your-webhook-url
WEBHOOK_SECRET=your-webhook-secret
```

## 🚀 Usage

1. **Default Phantom Wallet**: The dashboard comes pre-loaded with a Phantom wallet address: `9nGxKEUZkJAJAiaBZfvQVJPVvbpfndVjmPm5SBj5rHmr`
2. **Load a Wallet**: Enter any Solana wallet address to start tracking
3. **Monitor Transactions**: View real-time transaction updates
4. **Analyze Earnings**: Use charts to analyze payment patterns
5. **Export Data**: Download transaction data as CSV
6. **Customize Settings**: Configure webhooks and preferences

### Quick Phantom Wallet Setup

```bash
# Run the automated setup script
./setup-phantom.sh

# Or manually:
cd backend
npm run init-wallet          # Initialize the wallet
npm run seed-demo            # (Optional) Add demo transaction data
cd ..
npm run full:dev            # Start the application
```

## 🔧 Development

### Available Scripts

```bash
# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Backend
npm run backend:dev  # Start backend in development mode
npm run backend:start # Start backend in production mode

# Full Stack
npm run full:dev     # Start both frontend and backend
```

### Code Quality

```bash
npm run lint         # Run ESLint
npm run test         # Run tests
```

## 🐳 Docker

### Services

- **Frontend**: React app served on port 3000
- **Backend**: Node.js API server on port 5000
- **MongoDB**: Database on port 27017

### Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

## 📊 API Endpoints

### Wallet
- `GET /api/wallet/:address` - Get wallet information
- `PUT /api/wallet/:address` - Update wallet settings

### Transactions
- `GET /api/transactions` - Get transaction history
- `GET /api/transactions/:id` - Get specific transaction

### Statistics
- `GET /api/stats/earnings` - Get earnings statistics
- `GET /api/stats/leaderboard` - Get top senders

## 🔒 Security Features

- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Protection**: Configurable CORS settings
- **Input Validation**: Comprehensive input validation
- **Helmet**: Security headers
- **Environment Variables**: Secure configuration management

## 📈 Performance

- **Real-time Updates**: WebSocket-based live updates
- **Optimized Queries**: Efficient MongoDB queries with indexes
- **Caching**: Redis caching for frequently accessed data
- **Compression**: Gzip compression for API responses

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code examples

## 🔮 Roadmap

- [ ] Multi-wallet support
- [ ] Advanced analytics
- [ ] Mobile app
- [ ] Payment scheduling
- [ ] Integration with other blockchains
- [ ] Advanced webhook system
- [ ] User authentication
- [ ] Team collaboration features

---

Built with ❤️ for the Solana ecosystem
