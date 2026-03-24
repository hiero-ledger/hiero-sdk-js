# Hiero SDK — React Native Example

A fully working React Native example app that demonstrates how to use the
[Hiero JavaScript SDK](https://github.com/hiero-ledger/hiero-sdk-js) in a
mobile application. Built with **Expo SDK 54** and **expo-router**.

## Features

- **3-tab UI** — Home dashboard, Transactions, Settings
- **5 SDK operations** — Create Account, Query Balance, Transfer HBAR, Create
  Token (HTS), Transfer Token
- **Testnet & Previewnet** support with one-tap switching
- **Credential persistence** via AsyncStorage (survives app restarts)
- **Light & dark mode** with automatic detection
- **Pull-to-refresh** balance on the Home dashboard
- **Detailed JSDoc comments** explaining every SDK concept

## Quick Start

### Prerequisites

- Node.js ≥ 20
- iOS Simulator (Xcode) or Android Emulator (Android Studio)
- A free Hedera testnet account from [portal.hedera.com](https://portal.hedera.com/register)

### 1. Install dependencies

```bash
# From the repo root
cd examples/react-native-example
npm install
```

### 2. Configure credentials

Copy the environment template and fill in your testnet credentials:

```bash
cp .env.example .env
```

Edit `.env` with your operator details:

```env
EXPO_PUBLIC_OPERATOR_ID=0.0.12345
EXPO_PUBLIC_OPERATOR_KEY=302e020100300506032b6570...
EXPO_PUBLIC_HEDERA_NETWORK=testnet
```

> **Tip:** You can also configure credentials in the app's Settings tab at
> runtime. The `.env` values are used as defaults.

### 3. Run the app

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android

# Expo Go (development)
npx expo start
```

## Project Structure

```
react-native-example/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout (theme + SDK provider)
│   └── (tabs)/
│       ├── _layout.tsx           # Tab navigator (Home, Transactions, Settings)
│       ├── index.tsx             # Home — dashboard with connection & balance
│       ├── transactions.tsx      # Transactions — 5 interactive SDK operations
│       └── settings.tsx          # Settings — credentials & network config
│
├── components/                   # Reusable UI components
│   ├── themed-text.tsx           # Theme-aware text with type variants
│   ├── themed-view.tsx           # Theme-aware view container
│   ├── haptic-tab.tsx            # Tab button with haptic feedback (iOS)
│   ├── transaction-card.tsx      # Card for SDK operations (inputs + result)
│   ├── status-badge.tsx          # Connection status dot + label
│   └── ui/
│       └── icon-symbol.tsx       # Cross-platform icon mapping
│
├── hooks/                        # Custom React hooks
│   ├── use-hiero.tsx             # SDK client context (connect/disconnect)
│   ├── use-network-config.ts     # AsyncStorage persistence for credentials
│   ├── use-theme-color.ts        # Theme color accessor
│   └── use-color-scheme.ts       # System light/dark mode detection
│
├── services/                     # SDK service layer (business logic)
│   ├── HieroSDKService.ts        # 6 SDK functions with JSDoc explanations
│   ├── types.ts                  # TypeScript interfaces (SDKResult<T>, etc.)
│   └── index.ts                  # Barrel export
│
├── constants/
│   └── theme.ts                  # Colors, brand palette, status colors
│
├── .env.example                  # Environment variable template
└── package.json
```

## Architecture

```
┌────────────────────────────────────────────────┐
│                   App Screens                  │
│  ┌──────────┐ ┌──────────────┐ ┌────────────┐ │
│  │   Home   │ │ Transactions │ │  Settings  │ │
│  └────┬─────┘ └──────┬───────┘ └─────┬──────┘ │
│       │               │               │        │
│  ┌────┴───────────────┴───────────────┴──────┐ │
│  │          Hooks & Context Layer            │ │
│  │  useHiero()  useNetworkConfig()           │ │
│  └────────────────┬──────────────────────────┘ │
│                   │                            │
│  ┌────────────────┴──────────────────────────┐ │
│  │          Service Layer                    │ │
│  │  initClient · createAccount               │ │
│  │  getAccountBalance · transferHbar         │ │
│  │  createFungibleToken · transferToken      │ │
│  └────────────────┬──────────────────────────┘ │
│                   │                            │
│  ┌────────────────┴──────────────────────────┐ │
│  │       @hiero-ledger/sdk (NativeClient)    │ │
│  └───────────────────────────────────────────┘ │
└────────────────────────────────────────────────┘
```

**Key design decisions:**

- **Service layer isolation** — All SDK calls are in `services/HieroSDKService.ts`.
  UI components never import from `@hiero-ledger/sdk` directly.
- **React Context for client** — The SDK `Client` instance is shared via
  `HieroProvider` so all screens can execute transactions without re-initialising.
- **SDKResult\<T\> pattern** — Every service function returns
  `{ success: true, data }` or `{ success: false, error }` for consistent
  error handling in the UI.

## Using This as a Reference

### Creating an Account

```typescript
import { initClient, createAccount } from './services';

// 1. Initialise the client
const clientResult = initClient({
  operatorId: '0.0.12345',
  operatorKey: '302e020100300506032b6570...',
  network: 'testnet',
});

if (clientResult.success) {
  // 2. Create a new account (10 HBAR initial balance)
  const accountResult = await createAccount(clientResult.data);

  if (accountResult.success) {
    console.log('New Account ID:', accountResult.data.accountId);
  }
}
```

### Querying Balance

```typescript
const balance = await getAccountBalance(client, '0.0.12345');
if (balance.success) {
  console.log('Balance:', balance.data.balance); // e.g., "100 ℏ"
}
```

### Transferring HBAR

```typescript
const transfer = await transferHbar(client, '0.0.67890', 5);
if (transfer.success) {
  console.log('Tx ID:', transfer.data.transactionId);
}
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `Cannot find module '@hiero-ledger/sdk'` | Run `npm install` from `examples/react-native-example` |
| Blank screen on launch | Ensure you have a valid `.env` or configure in Settings tab |
| Transaction fails with `INVALID_SIGNATURE` | Check that your operator key matches the account ID |
| `INSUFFICIENT_PAYER_BALANCE` | Your testnet account may need refunding at [portal.hedera.com](https://portal.hedera.com) |

## Related

- [Hiero JS SDK Documentation](https://docs.hedera.com/hedera/sdks-and-apis/sdks/javascript)
- [Expo Documentation](https://docs.expo.dev/)
- [Legacy React Native Example](../react-native-example-legacy/) (deprecated)
