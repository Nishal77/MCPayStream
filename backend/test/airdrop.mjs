import { Connection, PublicKey, LAMPORTS_PER_SOL, Keypair } from '@solana/web3.js';
import fs from 'fs';
import os from 'os';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

function expandHome(p) {
  if (!p) return p;
  return p.startsWith('~/') ? path.join(os.homedir(), p.slice(2)) : p;
}

async function main() {
  const rpcUrl = process.env.SOLANA_NETWORK || 'https://api.devnet.solana.com';
  const connection = new Connection(rpcUrl, 'confirmed');

  let addressArg = process.argv[2];
  let publicKey;

  if (addressArg) {
    publicKey = new PublicKey(addressArg);
  } else {
    const keyPath = expandHome(process.env.SOLANA_WALLET_KEYPAIR || path.join(os.homedir(), '.config/solana/mcpaystream.json'));
    const secret = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    const kp = Keypair.fromSecretKey(new Uint8Array(secret));
    publicKey = kp.publicKey;
  }

  console.log(`Requesting airdrop for ${publicKey.toBase58()} on ${rpcUrl} ...`);
  const sig = await connection.requestAirdrop(publicKey, 2 * LAMPORTS_PER_SOL);
  await connection.confirmTransaction({ signature: sig }, 'confirmed');
  const bal = await connection.getBalance(publicKey, 'confirmed');
  console.log(`Airdrop signature: ${sig}`);
  console.log(`New balance: ${(bal / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
}

main().catch((e) => {
  console.error('Airdrop failed:', e.message || e);
  process.exit(1);
});


