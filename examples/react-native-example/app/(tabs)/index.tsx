import { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useHiero } from '@/hooks/use-hiero';
import { useNetworkConfig } from '@/hooks/use-network-config';
import { useThemeColor } from '@/hooks/use-theme-color';
import { StatusBadge } from '@/components/status-badge';
import { getAccountBalance } from '@/services';
import { HieroColors } from '@/constants/theme';

/**
 * Home screen — the main dashboard for the Hiero SDK Example.
 *
 * This screen shows:
 * 1. Connection status (not configured / disconnected / connected)
 * 2. A "Connect" or "Disconnect" button to manage the SDK client
 * 3. The operator&apos;s account ID and current HBAR balance (when connected)
 * 4. Pull-to-refresh to update the balance
 *
 * It uses:
 * - useHiero() context to access the shared SDK client
 * - useNetworkConfig() to read the saved credentials
 * - getAccountBalance() from the service layer to query the balance
 */
export default function HomeScreen() {
  const { client, isConnected, isConnecting, connectionError, activeConfig, connect, disconnect } =
    useHiero();
  const { config, loadConfig } = useNetworkConfig();

  useFocusEffect(
    useCallback(() => {
      loadConfig();
    }, [loadConfig])
  );

  const [balance, setBalance] = useState<string | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Theme-aware colors
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');
  const backgroundColor = useThemeColor({}, 'background');

  /** Check if the user has configured their credentials */
  const isConfigured = config.operatorId.trim() !== '' && config.operatorKey.trim() !== '';

  /** Determine connection status for the StatusBadge */
  const statusType = isConnected ? 'success' : isConfigured ? 'warning' : 'error';
  const statusLabel = isConnected ? 'Connected' : isConfigured ? 'Disconnected' : 'Not Configured';

  /**
   * Fetches the operator&apos;s HBAR balance from the network.
   * Uses the getAccountBalance() service function.
   */
  const fetchBalance = useCallback(async () => {
    if (!client || !activeConfig) return;

    setIsLoadingBalance(true);
    setBalanceError(null);

    const result = await getAccountBalance(client, activeConfig.operatorId);

    if (result.success) {
      setBalance(result.data.balance);
    } else {
      setBalanceError(result.error);
    }

    setIsLoadingBalance(false);
  }, [client, activeConfig]);

  /**
   * Auto-fetch balance when the client connects.
   * useEffect watches for changes to client/activeConfig — when
   * connect() sets these values, the balance is fetched automatically.
   */
  useEffect(() => {
    if (client && activeConfig) {
      fetchBalance();
    }
  }, [client, activeConfig, fetchBalance]);

  /** Handle the Connect button press — simply calls connect() from context */
  const handleConnect = () => {
    connect(config);
    // Balance fetch is triggered automatically by the useEffect above
    // when the client state updates after connect() completes
  };

  /** Handle pull-to-refresh */
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchBalance();
    setIsRefreshing(false);
  }, [fetchBalance]);

  /** Handle disconnect */
  const handleDisconnect = () => {
    disconnect();
    setBalance(null);
    setBalanceError(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          isConnected ? (
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          ) : undefined
        }>
        {/* Header */}
        <ThemedView style={styles.header}>
          <ThemedText style={{ color: HieroColors.primary }} type="title">Hiero Ledger</ThemedText>
          <ThemedText style={[styles.subtitle, { color: iconColor }]}>
            React Native Example
          </ThemedText>
        </ThemedView>

        {/* Connection Status Card */}
        <ThemedView
          style={[
            styles.card,
            styles.statusCard,
            isConnected && styles.statusCardConnected,
          ]}>
          <StatusBadge status={statusType} label={statusLabel} />

          {isConnected && activeConfig && (
            <ThemedView style={styles.statusDetails}>
              <ThemedText style={[styles.detailLabel, { color: iconColor }]}>
                Network
              </ThemedText>
              <ThemedText type="defaultSemiBold">
                {activeConfig.network.charAt(0).toUpperCase() + activeConfig.network.slice(1)}
              </ThemedText>

              <ThemedText style={[styles.detailLabel, { color: iconColor, marginTop: 8 }]}>
                Operator Account
              </ThemedText>
              <ThemedText type="defaultSemiBold">{activeConfig.operatorId}</ThemedText>
            </ThemedView>
          )}

          {!isConfigured && (
            <ThemedText style={styles.statusHint}>
              Go to the Settings tab to configure your operator credentials.
            </ThemedText>
          )}
        </ThemedView>

        {/* Error display */}
        {connectionError && (
          <ThemedView style={[styles.card, styles.errorCard]}>
            <ThemedText type="defaultSemiBold" style={styles.errorTitle}>
              Connection Error
            </ThemedText>
            <ThemedText style={styles.errorText}>{connectionError}</ThemedText>
          </ThemedView>
        )}

        {/* Balance Card */}
        {isConnected && (
          <ThemedView style={styles.card}>
            <ThemedText type="defaultSemiBold">Account Balance</ThemedText>
            {isLoadingBalance ? (
              <ActivityIndicator style={styles.balanceLoader} color={tintColor} />
            ) : balanceError ? (
              <ThemedView style={styles.balanceErrorContainer}>
                <ThemedText style={styles.errorText}>{balanceError}</ThemedText>
                <TouchableOpacity onPress={fetchBalance}>
                  <ThemedText style={[styles.retryText, { color: tintColor }]}>
                    Tap to retry
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            ) : (
              <ThemedText style={styles.balanceText}>{balance ?? 'Loading...'}</ThemedText>
            )}
            {!isLoadingBalance && !balanceError && (
              <ThemedText style={[styles.balanceHint, { color: iconColor }]}>
                Pull down to refresh
              </ThemedText>
            )}
          </ThemedView>
        )}

        {/* Connect / Disconnect Button */}
        {isConfigured && (
          <TouchableOpacity
            style={[
              styles.connectButton,
              {
                backgroundColor: isConnected ? 'transparent' : tintColor,
                borderColor: isConnected ? '#FF3B30' : tintColor,
                borderWidth: isConnected ? 1 : 0,
              },
            ]}
            onPress={isConnected ? handleDisconnect : handleConnect}
            disabled={isConnecting}
            activeOpacity={0.8}>
            {isConnecting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText
                style={[
                  styles.connectButtonText,
                  { color: isConnected ? '#FF3B30' : '#fff' },
                ]}>
                {isConnected ? 'Disconnect' : 'Connect to Network'}
              </ThemedText>
            )}
          </TouchableOpacity>
        )}

        {/* Getting Started Card (when not connected) */}
        {!isConnected && (
          <ThemedView style={styles.card}>
            <ThemedText type="defaultSemiBold">Getting Started</ThemedText>
            <ThemedText>
              1. Go to Settings and enter your testnet credentials{'\n'}
              2. Tap &quot;Connect to Network&quot; above{'\n'}
              3. Navigate to Transactions to try SDK operations{'\n'}
              4. Pull down on this screen to refresh your balance
            </ThemedText>
          </ThemedView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },
  header: {
    gap: 2,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
  },
  card: {
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  statusCard: {
    borderColor: 'rgba(255, 149, 0, 0.2)',
  },
  statusCardConnected: {
    borderColor: 'rgba(52, 199, 89, 0.25)',
    backgroundColor: 'rgba(52, 199, 89, 0.04)',
  },
  statusDetails: {
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  statusHint: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  detailLabel: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  errorCard: {
    borderColor: 'rgba(255, 59, 48, 0.3)',
    backgroundColor: 'rgba(255, 59, 48, 0.06)',
  },
  errorTitle: {
    color: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
  },
  balanceText: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  balanceLoader: {
    marginVertical: 8,
  },
  balanceErrorContainer: {
    gap: 6,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  balanceHint: {
    fontSize: 13,
  },
  connectButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
