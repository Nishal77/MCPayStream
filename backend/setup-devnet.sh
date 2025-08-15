#!/bin/bash

echo "🚀 Setting up MCPayStream Devnet Environment"
echo "=============================================="

# Check if Solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo "❌ Solana CLI not found. Installing..."
    sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
    echo "✅ Solana CLI installed. Please restart your terminal and run this script again."
    exit 1
fi

echo "✅ Solana CLI found: $(solana --version)"

# Create Solana config directory if it doesn't exist
mkdir -p ~/.config/solana

# Switch to Devnet
echo "🌐 Switching to Solana Devnet..."
solana config set --url https://api.devnet.solana.com

# Check if keypair already exists
if [ -f ~/.config/solana/mcpaystream.json ]; then
    echo "🔑 Existing keypair found at ~/.config/solana/mcpaystream.json"
    echo "📋 Public Key: $(solana address -k ~/.config/solana/mcpaystream.json)"
else
    echo "🔑 Generating new Devnet keypair..."
    solana-keygen new --outfile ~/.config/solana/mcpaystream.json --no-bip39-passphrase
    
    if [ $? -eq 0 ]; then
        echo "✅ Keypair generated successfully!"
        echo "📋 Public Key: $(solana address -k ~/.config/solana/mcpaystream.json)"
    else
        echo "❌ Failed to generate keypair"
        exit 1
    fi
fi

# Check current balance
echo "💰 Checking current balance..."
BALANCE=$(solana balance -k ~/.config/solana/mcpaystream.json)
echo "💎 Current Balance: $BALANCE"

# If balance is 0, try to airdrop
if [[ $BALANCE == "0 SOL" ]]; then
    echo "🪂 Balance is 0. Attempting airdrop..."
    
    # Try airdrop with retry logic
    for i in {1..3}; do
        echo "🪂 Airdrop attempt $i/3..."
        if solana airdrop 2 -k ~/.config/solana/mcpaystream.json; then
            echo "✅ Airdrop successful! New balance: $(solana balance -k ~/.config/solana/mcpaystream.json)"
            break
        else
            echo "⚠️  Airdrop attempt $i failed. Waiting 10 seconds..."
            sleep 10
        fi
    done
    
    if [[ $i -eq 3 ]]; then
        echo "❌ All airdrop attempts failed. This is normal due to rate limits."
        echo "💡 Alternative options:"
        echo "   1. Wait a few minutes and try: solana airdrop 2 -k ~/.config/solana/mcpaystream.json"
        echo "   2. Use web faucet: https://faucet.solana.com"
        echo "   3. Check if your wallet already has SOL from previous testing"
    fi
fi

echo ""
echo "🎯 Devnet Setup Complete!"
echo "=========================="
echo "🔑 Keypair: ~/.config/solana/mcpaystream.json"
echo "📋 Address: $(solana address -k ~/.config/solana/mcpaystream.json)"
echo "🌐 Network: Devnet"
echo "💰 Balance: $(solana balance -k ~/.config/solana/mcpaystream.json)"
echo ""
echo "🚀 Next steps:"
echo "   1. Copy the address above to use in your dashboard"
echo "   2. Start your backend: npm run dev"
echo "   3. Test with the wallet address in your frontend"
echo ""
echo "💡 Testing Commands:"
echo "   • Check balance: solana balance -k ~/.config/solana/mcpaystream.json"
echo "   • Send SOL: solana transfer <RECIPIENT> 0.1 -k ~/.config/solana/mcpaystream.json"
echo "   • Airdrop (if needed): solana airdrop 2 -k ~/.config/solana/mcpaystream.json"
