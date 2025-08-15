#!/usr/bin/env node

import { Keypair } from '@solana/web3.js';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';

console.log('🚀 Generating MCPayStream Devnet Keypair');
console.log('==========================================');

try {
  // Create Solana config directory
  const solanaConfigDir = join(homedir(), '.config', 'solana');
  mkdirSync(solanaConfigDir, { recursive: true });
  
  // Generate new keypair
  const keypair = Keypair.generate();
  const keypairPath = join(solanaConfigDir, 'mcpaystream.json');
  
  // Save keypair to file
  const keypairData = {
    publicKey: keypair.publicKey.toString(),
    secretKey: Array.from(keypair.secretKey)
  };
  
  writeFileSync(keypairPath, JSON.stringify(keypairData, null, 2));
  
  console.log('✅ Keypair generated successfully!');
  console.log('');
  console.log('🔑 Keypair saved to:', keypairPath);
  console.log('📋 Public Key (Address):', keypair.publicKey.toString());
  console.log('');
  console.log('🌐 Network: Devnet');
  console.log('💰 Next steps:');
  console.log('   1. Use this address in your dashboard');
  console.log('   2. Get test SOL from: https://faucet.solana.com');
  console.log('   3. Start your backend: npm run dev');
  console.log('');
  console.log('💡 Testing:');
  console.log('   • Copy the address above to test in your frontend');
  console.log('   • Visit https://faucet.solana.com to get test SOL');
  console.log('   • Use the address in your MCPayStream dashboard');
  
} catch (error) {
  console.error('❌ Error generating keypair:', error.message);
  process.exit(1);
}
