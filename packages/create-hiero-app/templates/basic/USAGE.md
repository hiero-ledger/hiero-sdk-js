# Usage Guide

This guide walks you through using your Hiero SDK starter application.

## 🚀 Getting Started

### 1. Set Up Your Environment

First, copy the example environment file:

```bash
cp .env.example .env
```

Then edit `.env` and add your Hiero testnet credentials:

```env
VITE_HEDERA_NETWORK=testnet
VITE_OPERATOR_ID=0.0.YOUR_ACCOUNT_ID
VITE_OPERATOR_KEY=YOUR_PRIVATE_KEY_HERE
```

#### Getting Testnet Credentials

1. Visit [portal.hedera.com](https://portal.hedera.com/)
2. Sign up or log in
3. Generate a new testnet account
4. Copy your Account ID and Private Key
5. Paste them into your `.env` file

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Start Development Server

```bash
npm run dev
```

Your browser will open automatically at `http://localhost:3000`

## 📚 Features & Usage

### Check Account Balance

**Purpose**: Query the current HBAR balance and token holdings of your account.

**Steps**:

1. Click the "Check Balance" button in the Account Operations section
2. View your HBAR balance and any token balances
3. Results appear in the card below the button

**Example Output**:

```json
{
  "accountId": "0.0.12345",
  "hbarBalance": "100 ℏ",
  "tokens": []
}
```

### Create New Account

**Purpose**: Generate a new Hiero account with a new key pair and initial balance.

**Steps**:

1. Click the "Create Account" button
2. Wait for the transaction to complete
3. **IMPORTANT**: Save the displayed private key securely!
4. Note the new account ID for future use

**Example Output**:

```json
{
  "status": "Account created successfully!",
  "accountId": "0.0.67890",
  "publicKey": "302a300506032b6570032100...",
  "privateKey": "302e020100300506032b657004220420...",
  "initialBalance": "10 HBAR",
  "transactionId": "0.0.12345@1234567890.123456789",
  "warning": "⚠️ Save the private key securely!"
}
```

⚠️ **Security Note**: The private key is only shown once. Store it securely - you'll need it to control the account!

### Transfer HBAR

**Purpose**: Send HBAR from your account to another account.

**Steps**:

1. Enter the recipient's Account ID (format: `0.0.12345`)
2. Enter the amount in HBAR (e.g., `10` or `0.5`)
3. Click "Send HBAR"
4. Wait for confirmation

**Example**:

- Recipient: `0.0.67890`
- Amount: `5`
- Result: 5 HBAR transferred from your account to 0.0.67890

**Example Output**:

```json
{
  "status": "Transfer successful!",
  "from": "0.0.12345",
  "to": "0.0.67890",
  "amount": "5 HBAR",
  "transactionId": "0.0.12345@1234567890.123456789",
  "transactionStatus": "SUCCESS"
}
```

### Network Queries

#### Get Network Status

**Purpose**: View information about the Hiero network nodes.

**Steps**:

1. Click "Get Network Status"
2. View the list of network nodes and their account IDs

**Example Output**:

```json
{
  "network": "testnet",
  "nodes": [
    {
      "address": "0.testnet.hedera.com:50211",
      "accountId": "0.0.3"
    },
    {
      "address": "1.testnet.hedera.com:50211",
      "accountId": "0.0.4"
    }
  ],
  "nodeCount": 2
}
```

#### Get Exchange Rate

**Purpose**: View exchange rate information between HBAR and USD cents.

**Note**: Exchange rates are available in transaction receipts. This query provides your current balance and explains how to access exchange rates.

## 🔧 Development

### Project Structure

```
src/
├── main.ts          # Main application logic and UI handlers
└── vite-env.d.ts    # TypeScript environment types
```

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Create production build
- `npm run preview` - Preview production build
- `npm run type-check` - Check TypeScript types
- `npm run lint` - Lint code with ESLint
- `npm run format` - Format code with Prettier

### Modifying the UI

The application is a single-page app with all logic in `src/main.ts` and UI in `index.html`.

**To add new features**:

1. Add UI elements in `index.html`
2. Add event handlers in `src/main.ts`
3. Use the existing `client` instance for Hiero SDK calls

**Example**: Adding a new button

```html
<!-- In index.html -->
<button id="myNewFeatureBtn">My Feature</button>
<div id="myFeatureResult" class="result hidden"></div>
```

```typescript
// In src/main.ts
const myFeatureBtn = document.getElementById('myNewFeatureBtn')!;
const myFeatureResult = document.getElementById('myFeatureResult')!;

async function myNewFeature() {
  if (!client) return;

  try {
    myFeatureBtn.textContent = 'Loading...';
    // Your Hiero SDK code here
    const result = {
      /* ... */
    };
    showResult(myFeatureResult, result);
  } catch (error) {
    showResult(myFeatureResult, (error as Error).message, true);
  } finally {
    myFeatureBtn.textContent = 'My Feature';
  }
}

myFeatureBtn.addEventListener('click', myNewFeature);
```

## 🛡️ Security Best Practices

### Development vs Production

This template is designed for **development and testing** purposes. The setup exposes private keys in the frontend, which is acceptable for local development.

### For Production Applications

**NEVER expose private keys in production!** Instead:

1. **Use a Backend API**

   - Store private keys on your backend server
   - Frontend makes API calls to sign transactions
   - Backend executes transactions on behalf of users

2. **Use Wallet Integration**

   - Integrate [HashConnect](https://docs.hashconnect.dev/)
   - Integrate [Blade Wallet](https://bladewallet.io/)
   - Let users sign with their own wallets

3. **Use Environment Protection**
   - Never commit `.env` files to git
   - Use secret management services (AWS Secrets Manager, etc.)
   - Implement proper access controls

### Example Production Architecture

```
Frontend (Browser)
    ↓ API Request
Backend API
    ↓ Sign Transaction
Hiero Network
```

## 🐛 Troubleshooting

### Connection Failed

**Problem**: "Failed to connect" error

**Solutions**:

- Check your `.env` file has correct credentials
- Verify `VITE_OPERATOR_ID` format is `0.0.12345`
- Ensure `VITE_OPERATOR_KEY` is the full DER-encoded key
- Confirm you have internet connection
- Try switching networks (testnet/previewnet)

### Transaction Failed

**Problem**: Transaction fails with "INSUFFICIENT_ACCOUNT_BALANCE"

**Solutions**:

- Check your account balance (use "Check Balance" button)
- Reduce transfer amount
- Get more testnet HBAR from [portal.hedera.com](https://portal.hedera.com/)

### Invalid Account ID

**Problem**: "Invalid account ID" error

**Solutions**:

- Ensure format is `0.0.12345` (shard.realm.num)
- Don't include spaces or extra characters
- Verify the account exists on the network

### Build Errors

**Problem**: TypeScript or build errors

**Solutions**:

```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev

# Check for TypeScript errors
npm run type-check
```

## 📖 Learning Resources

### Hiero Documentation

- [Getting Started Guide](https://docs.hedera.com/hedera/getting-started/introduction)
- [SDK Documentation](https://docs.hedera.com/hedera/sdks-and-apis/sdks)
- [API Reference](https://hiero-ledger.github.io/hiero-sdk-js/)

### Example Code

- [SDK Examples](https://github.com/hiero-ledger/hiero-sdk-js/tree/main/examples)
- [Transaction Types](https://docs.hedera.com/hedera/sdks-and-apis/sdks/transactions)
- [Query Types](https://docs.hedera.com/hedera/sdks-and-apis/sdks/queries)

### Community

- [Discord](https://discord.gg/hedera) - Get help from the community
- [Stack Overflow](https://stackoverflow.com/questions/tagged/hedera-hashgraph) - Technical Q&A
- [GitHub Discussions](https://github.com/hiero-ledger/hiero-sdk-js/discussions) - Feature requests and discussions

## 🎯 Next Steps

Now that you're familiar with the basics, try:

1. **Explore Token Operations**

   - Create a fungible token
   - Mint and transfer tokens
   - Check token balances

2. **Try Smart Contracts**

   - Deploy a Solidity contract
   - Call contract functions
   - Query contract state

3. **Build Your Use Case**
   - DeFi application
   - NFT marketplace
   - Payment system
   - Supply chain tracker

## 💡 Tips

- **Use the Console**: Open browser DevTools (F12) to see detailed logs
- **Check Network**: Use the Network tab to see all Hiero transactions
- **Read Receipts**: Transaction receipts contain valuable information like fees and exchange rates
- **Test Thoroughly**: Always test on testnet before deploying to mainnet
- **Handle Errors**: Implement proper error handling for production apps

---

**Happy Building! 🚀**

Need help? Join the [Hiero Discord](https://discord.gg/hedera) community!
