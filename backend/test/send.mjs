import { Connection, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
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
  const [,, recipientArg, amountArg] = process.argv;
  if (!recipientArg || !amountArg) {
    console.error('Usage: node ./test/send.mjs <RECIPIENT_ADDRESS> <AMOUNT_SOL>');
    process.exit(1);
  }

  const rpcUrl = process.env.SOLANA_NETWORK || 'https://api.devnet.solana.com';
  const connection = new Connection(rpcUrl, 'confirmed');

  const keyPath = expandHome(process.env.SOLANA_WALLET_KEYPAIR || path.join(os.homedir(), '.config/solana/mcpaystream.json'));
  const secret = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  const payer = Keypair.fromSecretKey(new Uint8Array(secret));

  const recipient = new PublicKey(recipientArg);
  const lamports = Math.floor(parseFloat(amountArg) * LAMPORTS_PER_SOL);
  if (!Number.isFinite(lamports) || lamports <= 0) {
    console.error('Invalid amount. Provide a positive number in SOL.');
    process.exit(1);
  }

  const tx = new Transaction().add(
    SystemProgram.transfer({ fromPubkey: payer.publicKey, toPubkey: recipient, lamports })
  );

  console.log(`Sending ${amountArg} SOL from ${payer.publicKey.toBase58()} to ${recipient.toBase58()} via ${rpcUrl} ...`);
  const signature = await sendAndConfirmTransaction(connection, tx, [payer]);
  console.log('Signature:', signature);
}

main().catch((e) => {
  console.error('Send failed:', e.message || e);
  process.exit(1);
});


