/**
 * React Context for sharing the Hiero SDK client across screens.
 *
 * Why a Context?
 * The SDK Client instance needs to be shared between the Home screen
 * (which displays balance) and the Transactions screen (which executes
 * operations). React Context is the idiomatic way to share state
 * across a component tree without prop drilling.
 *
 * Architecture:
 * - HieroProvider wraps the app in _layout.tsx
 * - useHiero() hook gives any screen access to the client + connect/disconnect
 * - The client state is managed centrally here
 *
 * Usage in any screen:
 * ```tsx
 * const { client, isConnected, connect, disconnect } = useHiero();
 * ```
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Client } from '@hiero-ledger/sdk';
import { initClient } from '@/services';
import type { NetworkConfig } from '@/services';

interface HieroContextType {
  /** The initialised SDK Client, or null if not connected */
  client: Client | null;
  /** Whether the client is currently connected to the network */
  isConnected: boolean;
  /** Whether a connection attempt is in progress */
  isConnecting: boolean;
  /** Error message from the last failed connection attempt */
  connectionError: string | null;
  /** The config used for the current connection */
  activeConfig: NetworkConfig | null;
  /** Connect to the Hiero network with the given config */
  connect: (config: NetworkConfig) => void;
  /** Disconnect from the network and clean up the client */
  disconnect: () => void;
}

const HieroContext = createContext<HieroContextType | undefined>(undefined);

/**
 * Provider component that manages the SDK client lifecycle.
 * Wrap your app with this to give all screens access to the client.
 */
export function HieroProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<Client | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [activeConfig, setActiveConfig] = useState<NetworkConfig | null>(null);

  const connect = useCallback((config: NetworkConfig) => {
    setIsConnecting(true);
    setConnectionError(null);

    // initClient is synchronous (no network call) — it just configures
    // the Client object with the operator credentials and network.
    // Actual network communication happens when executing transactions/queries.
    const result = initClient(config);

    if (result.success) {
      setClient(result.data);
      setActiveConfig(config);
    } else {
      setConnectionError(result.error);
    }

    setIsConnecting(false);
  }, []);

  const disconnect = useCallback(() => {
    if (client) {
      try {
        client.close();
      } catch {
        // Ignore close errors
      }
    }
    setClient(null);
    setActiveConfig(null);
    setConnectionError(null);
  }, [client]);

  return (
    <HieroContext.Provider
      value={{
        client,
        isConnected: client !== null,
        isConnecting,
        connectionError,
        activeConfig,
        connect,
        disconnect,
      }}>
      {children}
    </HieroContext.Provider>
  );
}

/**
 * Hook to access the Hiero SDK client and connection state.
 * Must be used within a HieroProvider.
 */
export function useHiero(): HieroContextType {
  const context = useContext(HieroContext);
  if (!context) {
    throw new Error('useHiero must be used within a HieroProvider');
  }
  return context;
}
