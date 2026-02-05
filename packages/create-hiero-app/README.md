# @hiero-ledger/create-hiero-app

Create Hiero SDK applications instantly with a modern development setup.

## ⚠️ Early Release Notice

This is an **early release (v0.1.0)** and is not yet ready for production use. The API may change in future versions.

## 🚀 Quick Start

Create a new Hiero app with a single command:

```bash
# Using npx (recommended - avoids npm create issues)
npx @hiero-ledger/create-hiero-app my-hiero-app

# Using pnpm
pnpm create @hiero-ledger/hiero-app my-hiero-app

# Using npm (may have issues with project names)
npm create @hiero-ledger/hiero-app@latest my-hiero-app
```

The CLI will prompt you for:
- **Hiero Network** (testnet, previewnet, mainnet, or local-node)
- **WalletConnect Project ID** (required - get one at https://cloud.walletconnect.com/)

Dependencies will be automatically installed using pnpm (default).

## 📦 What's Included

### Basic Template

The basic template provides a complete starter application with:

- ⚡️ **Vite** - Lightning-fast development with HMR
- 🔷 **TypeScript** - Full type safety
- 🎨 **Modern UI** - Beautiful, responsive web interface
- 💼 **Account Operations** - Create accounts, check balances
- 💸 **HBAR Transfers** - Send HBAR between accounts
- 🔗 **WalletConnect Integration** - Connect with HashPack and other wallets
- 📝 **Best Practices** - Proper error handling and logging
- 🛠️ **Dev Tools** - ESLint, Prettier, and TypeScript configured

### Features

✅ Account creation and management  
✅ Balance checking  
✅ HBAR transfers  
✅ WalletConnect integration  
✅ Transaction handling with receipts  
✅ Error handling utilities  
✅ Environment variable management  
✅ Modern React + TypeScript setup  

## 🎯 Usage

After creating your app:

```bash
cd my-hiero-app

# The .env file is already created with your configuration
# Start development server
pnpm run dev
```

Your app will open at `http://localhost:5173` (Vite default port) 🎉

### Environment Variables

The `.env` file is automatically created with:
- `VITE_HIERO_NETWORK` - The Hiero network (testnet, previewnet, mainnet, local-node)
- `VITE_WALLETCONNECT_PROJECT_ID` - Your WalletConnect Project ID

> **Note**: This template uses WalletConnect for wallet connections. Users will connect their own wallets (HashPack, etc.) to interact with the app.

## 🔧 CLI Options

```bash
create-hiero-app [project-name] [options]
```

### Options

- `-t, --template <template>` - Template to use (currently: `basic`, default: `basic`)
- `--pm <package-manager>` - Package manager to use (`pnpm`, `npm`, `yarn`). Default: `pnpm`

### Examples

```bash
# Create with default settings (pnpm, basic template)
npx @hiero-ledger/create-hiero-app my-app

# Use specific package manager
npx @hiero-ledger/create-hiero-app my-app --pm npm

# Use specific template
npx @hiero-ledger/create-hiero-app my-app --template basic
```

## 📋 Requirements

- **Node.js** v18 or higher
- **pnpm** (recommended), **npm**, or **yarn** package manager
- **WalletConnect Project ID** - Get a free Project ID at [cloud.walletconnect.com](https://cloud.walletconnect.com/)

## 🏗️ Generated Project Structure

```
my-hiero-app/
├── src/
│   ├── main.tsx             # Main app entry point
│   ├── App.tsx              # Main app component
│   ├── App.css              # App styles
│   ├── index.css            # Global styles
│   ├── vite-env.d.ts        # Vite environment types
│   ├── context/
│   │   └── WalletContext.tsx # WalletConnect context
│   └── components/
│       └── WalletButton.tsx  # Wallet connection button
├── public/                  # Static assets
│   └── favicon.svg
├── index.html              # HTML entry point
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── .env                    # Environment variables (auto-created)
├── .env.example            # Environment template
├── .gitignore              # Git ignore rules
├── .eslintrc.json          # ESLint configuration
├── .prettierrc             # Prettier configuration
├── package.json            # Dependencies
└── README.md               # Project documentation
```

## 🛡️ Security Best Practices

The generated template uses WalletConnect for secure wallet connections:

1. **No Private Keys** - Users connect with their own wallets (HashPack, etc.)
2. **User Approval** - All transactions require user approval in their wallet
3. **Environment Variables** - Configuration stored in `.env` (not committed to git)
4. **Production Ready** - WalletConnect is suitable for production applications

> ✅ **Secure by Default**: This template uses WalletConnect, so users' private keys never leave their wallets. Perfect for production applications!

## 📚 Resources

- [Hiero Documentation](https://docs.hedera.com/)
- [Hiero SDK Reference](https://hiero-ledger.github.io/hiero-sdk-js/)
- [Get WalletConnect Project ID](https://cloud.walletconnect.com/)
- [Join Discord Community](https://discord.gg/hedera)
- [GitHub Repository](https://github.com/hiero-ledger/hiero-sdk-js)

## 🚧 Roadmap

Future templates planned:

- **DeFi Template** - Token creation, swaps, and liquidity pools
- **NFT Market place** - NFT minting, marketplace, and collections

## 🤝 Contributing

Contributions are welcome! To add new templates or improve existing ones:

1. Fork the repository
2. Create your template in `packages/create-hiero-app/templates/`
3. Update the template registry in `src/index.ts`
4. Submit a pull request

## 🐛 Issues

Found a bug or have a suggestion? Please [open an issue](https://github.com/hiero-ledger/hiero-sdk-js/issues).

## 📄 License

Apache-2.0 License

## 🙏 Acknowledgments

Inspired by:
- [create-react-app](https://create-react-app.dev/)
- [create-vite](https://vitejs.dev/guide/#scaffolding-your-first-vite-project)
- [create-next-app](https://nextjs.org/docs/api-reference/create-next-app)

---

**Built with ❤️ for the Hiero community**
