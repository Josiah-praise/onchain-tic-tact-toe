const { generateWallet, getStxAddress } = require('@stacks/wallet-sdk');

// Your mnemonic from Testnet.toml
const mnemonic = "other return young struggle absent agent scare crater blush cave fish usual police sound daring scan chest food october sentence song sense annual fitness";

// Generate wallet from mnemonic
const wallet = generateWallet({
  secretKey: mnemonic,
  password: '',
});

// Get the first account (index 0) - this is what Clarinet uses for deployment
const account = wallet.accounts[0];
const testnetAddress = getStxAddress({ account, transactionVersion: 128 }); // 128 = testnet
const mainnetAddress = getStxAddress({ account, transactionVersion: 22 });   // 22 = mainnet

console.log('=== DEPLOYMENT ACCOUNT INFO ===');
console.log('Account Index: 0 (first account)');
console.log('Testnet Address:', testnetAddress);
console.log('Mainnet Address:', mainnetAddress);
console.log('Private Key:', account.stxPrivateKey);
console.log('\n=== CLARINET DEPLOYMENT ===');
console.log('Your contracts were deployed from:', testnetAddress);
console.log('This is the address that owns your deployed contracts on testnet.');