#!/usr/bin/env bash
set -euo pipefail

KEYPATH=${HOME}/.config/solana/mcpaystream.json
RPC_URL=${SOLANA_NETWORK:-https://api.devnet.solana.com}

ensure_cli() {
  if command -v solana >/dev/null 2>&1; then
    return 0
  fi
  echo "Installing Solana CLI..." >&2
  sh -c "$(curl -sSfL https://release.solana.com/stable/install)" || {
    echo "Failed to install via curl. If on macOS, try: brew install solana" >&2
    return 1
  }
  export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
}

cmd=${1:-help}
case "$cmd" in
  install)
    ensure_cli
    ;;
  use)
    ensure_cli
    mkdir -p "$(dirname "$KEYPATH")"
    if [ ! -f "$KEYPATH" ]; then
      solana-keygen new --no-bip39-passphrase --outfile "$KEYPATH"
    fi
    solana config set --url "$RPC_URL"
    solana config set -k "$KEYPATH"
    ;;
  airdrop)
    ensure_cli
    solana config set --url "$RPC_URL" >/dev/null
    addr=${2:-$(solana address)}
    solana airdrop 2 "$addr"
    ;;
  address)
    ensure_cli
    solana config set --url "$RPC_URL" >/dev/null
    solana address
    ;;
  balance)
    ensure_cli
    solana config set --url "$RPC_URL" >/dev/null
    addr=${2:-$(solana address)}
    solana balance "$addr"
    ;;
  *)
    cat <<USAGE
Usage: $(basename "$0") <command>
  install            Install Solana CLI
  use                Ensure keypair and set Devnet RPC + keypair in CLI config
  airdrop [address]  Airdrop 2 SOL to address (defaults to current CLI address)
  address            Print current CLI address
  balance [address]  Show balance (defaults to current CLI address)
USAGE
    ;;
esac


