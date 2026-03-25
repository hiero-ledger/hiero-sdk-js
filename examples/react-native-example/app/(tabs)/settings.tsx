import { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useNetworkConfig } from '@/hooks/use-network-config';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { NetworkConfig } from '@/services';

function NetworkSelectorGroup({
  network,
  setNetwork,
  iconColor,
  tintColor,
}: {
  network: 'testnet' | 'previewnet';
  setNetwork: (network: 'testnet' | 'previewnet') => void;
  iconColor: string;
  tintColor: string;
}) {
  return (
    <ThemedView style={styles.fieldGroup}>
      <ThemedText type="defaultSemiBold">Network</ThemedText>
      <ThemedText style={[styles.fieldHint, { color: iconColor }]}>
        Choose which Hiero network to connect to
      </ThemedText>
      <ThemedView style={styles.networkSelector}>
        <TouchableOpacity
          style={[
            styles.networkOption,
            { borderColor: iconColor },
            network === 'testnet' && { borderColor: tintColor, backgroundColor: `${tintColor}18` },
          ]}
          onPress={() => setNetwork('testnet')}
          activeOpacity={0.7}>
          <ThemedView style={styles.radioRow}>
            <ThemedView
              style={[
                styles.radio,
                { borderColor: iconColor },
                network === 'testnet' && { borderColor: tintColor },
              ]}>
              {network === 'testnet' && (
                <ThemedView style={[styles.radioFill, { backgroundColor: tintColor }]} />
              )}
            </ThemedView>
            <ThemedView>
              <ThemedText type="defaultSemiBold">Testnet</ThemedText>
              <ThemedText style={[styles.networkHint, { color: iconColor }]}>
                Recommended for development
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.networkOption,
            { borderColor: iconColor },
            network === 'previewnet' && { borderColor: tintColor, backgroundColor: `${tintColor}18` },
          ]}
          onPress={() => setNetwork('previewnet')}
          activeOpacity={0.7}>
          <ThemedView style={styles.radioRow}>
            <ThemedView
              style={[
                styles.radio,
                { borderColor: iconColor },
                network === 'previewnet' && { borderColor: tintColor },
              ]}>
              {network === 'previewnet' && (
                <ThemedView style={[styles.radioFill, { backgroundColor: tintColor }]} />
              )}
            </ThemedView>
            <ThemedView>
              <ThemedText type="defaultSemiBold">Previewnet</ThemedText>
              <ThemedText style={[styles.networkHint, { color: iconColor }]}>
                Preview upcoming features
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

/**
 * Settings screen — configure network credentials for the Hiero SDK.
 *
 * This screen allows users to:
 * 1. Enter their Operator Account ID (e.g., "0.0.12345")
 * 2. Enter their Operator Private Key (DER-encoded hex)
 * 3. Select the network (testnet or previewnet)
 * 4. Save the configuration to persist across app restarts
 *
 * The config is stored via AsyncStorage through the useNetworkConfig hook.
 * On first launch, it falls back to values from .env (EXPO_PUBLIC_* vars).
 */
export default function SettingsScreen() {
  const { config, isLoading, saveConfig, clearConfig } = useNetworkConfig();
  const [operatorId, setOperatorId] = useState('');
  const [operatorKey, setOperatorKey] = useState('');
  const [network, setNetwork] = useState<'testnet' | 'previewnet'>('testnet');
  const [isSaved, setIsSaved] = useState(false);

  // Theme-aware colors for inputs and borders
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');
  const backgroundColor = useThemeColor({}, 'background');

  // Populate form fields when saved config loads from AsyncStorage
  useEffect(() => {
    if (!isLoading) {
      setOperatorId(config.operatorId);
      setOperatorKey(config.operatorKey);
      setNetwork(config.network);
    }
  }, [isLoading, config]);

  /**
   * Validates and saves the current form values to AsyncStorage.
   * Basic validation ensures both fields are filled in.
   */
  const handleSave = async () => {
    // Basic validation — ensure required fields are filled
    if (!operatorId.trim()) {
      Alert.alert('Missing Field', 'Please enter your Operator Account ID.');
      return;
    }
    if (!operatorKey.trim()) {
      Alert.alert('Missing Field', 'Please enter your Operator Private Key.');
      return;
    }

    const newConfig: NetworkConfig = {
      operatorId: operatorId.trim(),
      operatorKey: operatorKey.trim(),
      network,
    };

    const success = await saveConfig(newConfig);
    if (success) {
      setIsSaved(true);
      // Reset the "saved" badge after 2 seconds
      setTimeout(() => setIsSaved(false), 2000);
    } else {
      Alert.alert('Error', 'Failed to save configuration. Please try again.');
    }
  };

  /** Clears saved config and resets the form */
  const handleClear = () => {
    Alert.alert(
      'Clear Configuration',
      'This will remove your saved credentials. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearConfig();
            setOperatorId('');
            setOperatorKey('');
            setNetwork('testnet');
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
        <ThemedText>Loading configuration...</ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          {/* Header */}
          <ThemedView style={styles.header}>
            <ThemedText type="title">Settings</ThemedText>
            <ThemedText style={styles.subtitle}>
              Configure your Hiero network credentials
            </ThemedText>
          </ThemedView>

          {/* Info card */}
          <ThemedView style={[styles.card, styles.infoCard]}>
            <ThemedText type="defaultSemiBold">💡 Where to get credentials</ThemedText>
            <ThemedText style={styles.infoText}>
              Create a free testnet account at portal.hedera.com/register.
              You&apos;ll receive an Operator ID and Private Key to use here.
            </ThemedText>
          </ThemedView>

          {/* Operator ID input */}
          <ThemedView style={styles.fieldGroup}>
            <ThemedText type="defaultSemiBold">Operator Account ID</ThemedText>
            <ThemedText style={[styles.fieldHint, { color: iconColor }]}>
              Format: 0.0.12345
            </ThemedText>
            <TextInput
              style={[styles.input, { color: textColor, borderColor: iconColor }]}
              value={operatorId}
              onChangeText={setOperatorId}
              placeholder="0.0.12345"
              placeholderTextColor={iconColor}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </ThemedView>

          {/* Operator Private Key input */}
          <ThemedView style={styles.fieldGroup}>
            <ThemedText type="defaultSemiBold">Operator Private Key</ThemedText>
            <ThemedText style={[styles.fieldHint, { color: iconColor }]}>
              DER-encoded hex string (starts with 302e...)
            </ThemedText>
            <TextInput
              style={[styles.input, styles.keyInput, { color: textColor, borderColor: iconColor }]}
              value={operatorKey}
              onChangeText={setOperatorKey}
              placeholder="302e020100300506032b6570..."
              placeholderTextColor={iconColor}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              multiline={false}
            />
          </ThemedView>

          {/* Network selector */}
          <NetworkSelectorGroup
            network={network}
            setNetwork={setNetwork}
            iconColor={iconColor}
            tintColor={tintColor}
          />

          {/* Action buttons */}
          <ThemedView style={styles.actionGroup}>
            <TouchableOpacity
              style={[styles.button, styles.saveButton, { backgroundColor: tintColor }]}
              onPress={handleSave}
              activeOpacity={0.8}>
              <ThemedText style={styles.buttonText}>
                {isSaved ? '✓ Saved!' : 'Save Configuration'}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.clearButton, { borderColor: iconColor }]}
              onPress={handleClear}
              activeOpacity={0.8}>
              <ThemedText style={[styles.clearButtonText, { color: iconColor }]}>
                Clear Saved Config
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 20,
  },
  header: {
    gap: 4,
    marginBottom: 4,
  },
  subtitle: {
    opacity: 0.7,
    fontSize: 15,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  infoCard: {
    gap: 6,
    borderColor: 'rgba(10, 126, 164, 0.2)',
    backgroundColor: 'rgba(10, 126, 164, 0.05)',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldHint: {
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  keyInput: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
  },
  networkSelector: {
    gap: 10,
    marginTop: 2,
  },
  networkOption: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioFill: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  networkHint: {
    fontSize: 13,
    marginTop: 1,
  },
  actionGroup: {
    gap: 12,
    marginTop: 8,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButton: {
    // backgroundColor set dynamically via tintColor
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    borderWidth: 1,
  },
  clearButtonText: {
    fontSize: 15,
  },
});
