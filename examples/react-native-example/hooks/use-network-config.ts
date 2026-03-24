/**
 * Custom hook for persisting and loading network configuration.
 *
 * Uses AsyncStorage (React Native's key-value persistence) to save
 * the operator's credentials and network choice across app restarts.
 *
 * This follows the same hook pattern as use-color-scheme and use-theme-color
 * in this project — a simple, focused hook that encapsulates one concern.
 *
 * Usage:
 * ```tsx
 * const { config, isLoading, saveConfig } = useNetworkConfig();
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NetworkConfig } from '@/services';

/** AsyncStorage key for the saved network config */
const STORAGE_KEY = 'hiero_network_config';

/**
 * Default config values — used when no saved config exists.
 * Tries to read from Expo environment variables (set in .env file),
 * falling back to empty strings if not configured.
 */
const DEFAULT_CONFIG: NetworkConfig = {
  operatorId: process.env.EXPO_PUBLIC_OPERATOR_ID ?? '',
  operatorKey: process.env.EXPO_PUBLIC_OPERATOR_KEY ?? '',
  network: (process.env.EXPO_PUBLIC_HEDERA_NETWORK as 'testnet' | 'previewnet') ?? 'testnet',
};

export function useNetworkConfig() {
  const [config, setConfig] = useState<NetworkConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved config from AsyncStorage on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as NetworkConfig;
          setConfig(parsed);
        }
      } catch (error) {
        console.warn('Failed to load saved config:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadConfig();
  }, []);

  // Save config to AsyncStorage
  const saveConfig = useCallback(async (newConfig: NetworkConfig) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
      setConfig(newConfig);
      return true;
    } catch (error) {
      console.warn('Failed to save config:', error);
      return false;
    }
  }, []);

  // Clear saved config and reset to defaults
  const clearConfig = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setConfig(DEFAULT_CONFIG);
      return true;
    } catch (error) {
      console.warn('Failed to clear config:', error);
      return false;
    }
  }, []);

  return { config, isLoading, saveConfig, clearConfig };
}
