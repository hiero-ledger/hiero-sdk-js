# Hiero SDK Starter App

A modern web application built with [Vite](https://vitejs.dev/), [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), and the [Hiero JavaScript SDK](https://github.com/hiero-ledger/hiero-sdk-js) to interact with the Hiero network.

## 🚀 Features

- ⚡️ **Vite** - Lightning-fast development with Hot Module Replacement (HMR)
- ⚛️ **React** - Modern React with hooks
- 🔷 **TypeScript** - Type-safe development experience
- 🎨 **Modern UI** - Beautiful, responsive interface
- 💼 **Account Operations** - Create accounts and check balances
- 💸 **HBAR Transfers** - Send HBAR between accounts
- 🔗 **WalletConnect** - Connect with HashPack and other wallets
- 📝 **Best Practices** - Error handling and code organization

## 📋 Prerequisites

- **Node.js** v18 or higher
- **pnpm** (recommended), **npm**, or **yarn** package manager
- **WalletConnect Project ID** - Get a free Project ID at [cloud.walletconnect.com](https://cloud.walletconnect.com/)

## 🛠️ Getting Started

### 1. Install Dependencies

```bash
pnpm install
# or
npm install
# or
yarn install
```

### 2. Configure Environment Variables

The `.env` file is automatically created when you generate the project. It contains:

```env
# Hiero Network Configuration
# Options: testnet, previewnet, mainnet, local-node
VITE_HIERO_NETWORK=testnet

# WalletConnect Configuration
# Get a free Project ID at: https://cloud.walletconnect.com/
VITE_WALLETCONNECT_PROJECT_ID=your-project-id-here
```

If you need to update these values, edit the `.env` file.

### 3. Start Development Server

```bash
pnpm run dev
# or
npm run dev
# or
yarn dev
```

The app will open automatically at `http://localhost:5173` (Vite default port)

## 📦 Available Scripts

- **`pnpm run dev`** - Start development server with HMR
- **`pnpm run build`** - Build for production
- **`pnpm run preview`** - Preview production build locally
- **`pnpm run type-check`** - Run TypeScript type checking
- **`pnpm run lint`** - Lint code with ESLint
- **`pnpm run format`** - Format code with Prettier

## 🏗️ Project Structure

```
.
├── src/
│   ├── main.tsx             # Main application entry point
│   ├── App.tsx              # Main app component
│   ├── App.css              # App styles
│   ├── index.css            # Global styles
│   ├── vite-env.d.ts        # Vite environment types
│   ├── context/
│   │   └── WalletContext.tsx # WalletConnect context provider
│   └── components/
│       └── WalletButton.tsx  # Wallet connection button
├── public/                  # Static assets
│   └── favicon.svg
├── index.html              # HTML entry point
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── .env                    # Environment variables
├── .env.example            # Environment template
└── package.json            # Project dependencies
```

## 🎯 What You Can Do

### Connect Your Wallet

Click the "Connect Wallet" button to connect with HashPack or other Hiero-compatible wallets. Your wallet will prompt you to approve the connection.

### Check Account Balance

Once connected, click the "Check Balance" button to view your account's HBAR balance and token holdings.

### Create New Account

Generate a new Hiero account with:
- Automatically generated ED25519 key pair
- Initial balance of 10 HBAR
- Account ID for transactions

> 💡 **Important**: Save the private key securely! You'll need it to control the account.

### Transfer HBAR

Send HBAR to any account by:
1. Entering the recipient's account ID (format: `0.0.12345`)
2. Specifying the amount in HBAR
3. Clicking "Send HBAR"

Your wallet will prompt you to approve the transaction.

## 🔧 Configuration Options

### Network Selection

Change the network in your `.env` file:

```env
# Options: testnet, previewnet, mainnet, local-node
VITE_HIERO_NETWORK=testnet
```

## 🛡️ Security Best Practices

1. **Never commit `.env` files** - They contain sensitive configuration
2. **WalletConnect is secure** - Users' private keys never leave their wallets
3. **User approval required** - All transactions require user approval in their wallet
4. **Production ready** - This setup is suitable for production applications

> ✅ **Secure by Default**: This template uses WalletConnect, so users' private keys never leave their wallets. Perfect for production applications!

## 📚 Learn More

- [Hiero Documentation](https://docs.hedera.com/)
- [Hiero SDK Reference](https://hiero-ledger.github.io/hiero-sdk-js/)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Get WalletConnect Project ID](https://cloud.walletconnect.com/)
- [Join Discord Community](https://discord.gg/hedera)

## 🐛 Troubleshooting

### Wallet Connection Issues

- Verify your `VITE_WALLETCONNECT_PROJECT_ID` in `.env` is correct
- Ensure you have a wallet installed (HashPack, etc.)
- Check your internet connection

### Transaction Failures

- Ensure your account has sufficient HBAR balance
- Verify the recipient account ID is valid
- Check transaction fees in console logs
- Make sure you approve the transaction in your wallet

### Build Errors

- Clear `node_modules` and reinstall: `rm -rf node_modules && pnpm install`
- Update to latest Node.js LTS version
- Check for TypeScript errors: `pnpm run type-check`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## 📄 License

Apache-2.0 License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Built with the [Hiero JavaScript SDK](https://github.com/hiero-ledger/hiero-sdk-js) - A powerful SDK for building on the Hiero network.

---

**Happy Building! 🚀**

For questions or support, join the [Hiero Discord](https://discord.gg/hedera) community.
