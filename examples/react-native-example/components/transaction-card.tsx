import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';

export interface ResultItem {
  label?: string;
  value: string;
  copyable?: boolean;
}

export type TransactionResult = string | ResultItem[];

interface InputField {
  key: string;
  label: string;
  placeholder: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
}

interface TransactionCardProps {
  title: string;
  description: string;
  buttonLabel: string;
  inputs?: InputField[];
  onExecute: (values: Record<string, string>) => Promise<TransactionResult>;
  isConnected: boolean;
}

function CopyBox({ label, value, copyable }: ResultItem) {
  const iconColor = useThemeColor({}, 'icon');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!copyable) return;
    await Clipboard.setStringAsync(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.copyBoxContainer}>
      {label && <ThemedText style={styles.copyBoxLabel}>{label}</ThemedText>}
      <TouchableOpacity 
        style={[styles.copyBox, copyable && styles.copyBoxInteractive]} 
        onPress={handleCopy}
        activeOpacity={copyable ? 0.7 : 1}
        disabled={!copyable}
      >
        <ThemedText style={styles.copyBoxValue} numberOfLines={1} ellipsizeMode="middle">
          {value}
        </ThemedText>
        {copyable && (
          <IconSymbol 
            name={copied ? 'checkmark' : 'doc.on.doc'} 
            size={16} 
            color={copied ? '#34C759' : iconColor} 
          />
        )}
      </TouchableOpacity>
    </View>
  );
}

/**
 * Reusable card component for transaction demo operations.
 */
export function TransactionCard({
  title,
  description,
  buttonLabel,
  inputs = [],
  onExecute,
  isConnected,
}: TransactionCardProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TransactionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Theme-aware colors
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');

  /** Update a specific input field value */
  const updateValue = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  /**
   * Execute the operation and display results.
   */
  const handleExecute = async () => {
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const resultData = await onExecute(values);
      setResult(resultData);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.card}>
      {/* Header */}
      <ThemedView style={styles.cardHeader}>
        <ThemedText type="subtitle">{title}</ThemedText>
        <ThemedText style={[styles.description, { color: iconColor }]}>
          {description}
        </ThemedText>
      </ThemedView>

      {/* Input fields */}
      {inputs.map((input) => (
        <ThemedView key={input.key} style={styles.inputGroup}>
          <ThemedText style={[styles.inputLabel, { color: iconColor }]}>
            {input.label}
          </ThemedText>
          <TextInput
            style={[styles.input, { color: textColor, borderColor: iconColor }]}
            value={values[input.key] ?? ''}
            onChangeText={(text) => updateValue(input.key, text)}
            placeholder={input.placeholder}
            placeholderTextColor={iconColor}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType={input.keyboardType ?? 'default'}
            editable={!isLoading}
          />
        </ThemedView>
      ))}

      {/* Action button */}
      <TouchableOpacity
        style={[
          styles.executeButton,
          { backgroundColor: tintColor },
          (!isConnected || isLoading) && styles.buttonDisabled,
        ]}
        onPress={handleExecute}
        disabled={!isConnected || isLoading}
        activeOpacity={0.8}>
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <ThemedText style={styles.buttonText}>
            {isConnected ? buttonLabel : 'Connect First'}
          </ThemedText>
        )}
      </TouchableOpacity>

      {/* Result display */}
      {result && (
        <ThemedView style={styles.resultContainer}>
          <ThemedText style={styles.resultLabel}>✓ Result</ThemedText>
          {typeof result === 'string' ? (
             <ThemedText style={styles.resultText} selectable>
               {result}
             </ThemedText>
          ) : (
             <View style={styles.resultItems}>
               {result.map((item, index) => (
                 <CopyBox key={index} {...item} />
               ))}
             </View>
          )}
        </ThemedView>
      )}

      {/* Error display */}
      {error && (
        <ThemedView style={styles.errorContainer}>
          <ThemedText style={styles.errorLabel}>✗ Error</ThemedText>
          <ThemedText style={styles.errorText} selectable>
            {error}
          </ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  cardHeader: {
    gap: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  },
  executeButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  resultContainer: {
    gap: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(52, 199, 89, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.2)',
  },
  resultLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#34C759',
  },
  resultText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  },
  resultItems: {
    gap: 8,
  },
  copyBoxContainer: {
    gap: 4,
  },
  copyBoxLabel: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.8,
  },
  copyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  copyBoxInteractive: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  copyBoxValue: {
    flex: 1,
    fontSize: 13,
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
    marginRight: 8,
  },
  errorContainer: {
    gap: 4,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 59, 48, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.2)',
  },
  errorLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF3B30',
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#FF3B30',
  },
});
