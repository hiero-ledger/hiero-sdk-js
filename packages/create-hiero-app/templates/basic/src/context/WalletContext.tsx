import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  DAppConnector,
  HederaSessionEvent,
  HederaJsonRpcMethod,
  HederaChainId,
} from '@hashgraph/hedera-wallet-connect';
import { LedgerId } from '@hashgraph/sdk';

export type WalletConnectionType = 'direct' | 'wallet';

interface WalletState {
  connected: boolean;
  accountId: string | null;
  connectionType: WalletConnectionType | null;
  connector: DAppConnector | null;
  isConnecting: boolean;
}

interface WalletContextType extends WalletState {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  getSigner: () => any;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletState, setWalletState] = useState<WalletState>({
    connected: false,
    accountId: null,
    connectionType: null,
    connector: null,
    isConnecting: false,
  });

  const connectWallet = useCallback(async () => {
    setWalletState((prev) => ({ ...prev, isConnecting: true }));
    try {
      const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

      if (!projectId) {
        throw new Error(
          'WalletConnect Project ID not found. Please add VITE_WALLETCONNECT_PROJECT_ID to your .env file. ' +
            'Get one at https://cloud.walletconnect.com/'
        );
      }

      const metadata = {
        name: 'Hiero SDK Starter',
        description: 'A Hiero SDK application with WalletConnect',
        url: window.location.origin,
        icons: [window.location.origin + '/favicon.svg'],
      };

      const network = import.meta.env.VITE_HIERO_NETWORK || 'testnet';
      const ledgerId = network === 'mainnet' ? LedgerId.MAINNET : LedgerId.TESTNET;
      const chainId = network === 'mainnet' ? HederaChainId.Mainnet : HederaChainId.Testnet;

      const dAppConnector = new DAppConnector(
        metadata,
        ledgerId,
        projectId,
        Object.values(HederaJsonRpcMethod),
        [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
        [chainId]
      );

      await dAppConnector.init({ logger: 'error' });

      // Open wallet selection modal
      await dAppConnector.openModal();

      // Wait for session to be established
      const sessions = dAppConnector.signers;
      if (sessions.length > 0) {
        const accountId = sessions[0].getAccountId().toString();

        setWalletState({
          connected: true,
          accountId,
          connectionType: 'wallet',
          connector: dAppConnector,
          isConnecting: false,
        });

        console.log('Wallet connected:', accountId);
      } else {
        setWalletState((prev) => ({ ...prev, isConnecting: false }));
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setWalletState((prev) => ({ ...prev, isConnecting: false }));
      throw error;
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    if (walletState.connector) {
      walletState.connector.disconnectAll();
    }

    setWalletState({
      connected: false,
      accountId: null,
      connectionType: null,
      connector: null,
      isConnecting: false,
    });
  }, [walletState.connector]);

  const getSigner = useCallback(() => {
    if (!walletState.connector || !walletState.connected) {
      return null;
    }
    return walletState.connector.signers[0];
  }, [walletState.connector, walletState.connected]);

  return (
    <WalletContext.Provider
      value={{
        ...walletState,
        connectWallet,
        disconnectWallet,
        getSigner,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
