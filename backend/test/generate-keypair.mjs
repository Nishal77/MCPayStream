import { Keypair } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load backend .env relative to this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

function expandHome(p) {
  if (!p) return p;
  return p.startsWith('~/') ? path.join(os.homedir(), p.slice(2)) : p;
}

async function main() {
  const targetPathArg = process.argv[2];
  const targetPath = expandHome(targetPathArg || process.env.SOLANA_WALLET_KEYPAIR || path.join(os.homedir(), '.config/solana/mcpaystream.json'));
  const dir = path.dirname(targetPath);

  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (fs.existsSync(targetPath)) {
    const secret = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
    const keypair = Keypair.fromSecretKey(new Uint8Array(secret));
    console.log(`Keypair already exists at ${targetPath}`);
    console.log(`Public Key: ${keypair.publicKey.toBase58()}`);
    return;
  }

  const keypair = Keypair.generate();
  fs.writeFileSync(targetPath, JSON.stringify(Array.from(keypair.secretKey)));
  console.log(`Generated new keypair at ${targetPath}`);
  console.log(`Public Key: ${keypair.publicKey.toBase58()}`);
}

main().catch((e) => {
  console.error('Failed to generate keypair:', e);
  process.exit(1);
});


