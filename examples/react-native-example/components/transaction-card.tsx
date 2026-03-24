import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

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
  onExecute: (values: Record<string, string>) => Promise<string>;
  isConnected: boolean;
}

/**
 * Reusable card component for transaction demo operations.
 *
 * Renders a consistent UI for each SDK operation:
 * - Title and description explaining what the operation does
 * - Optional input fields for user-provided values
 * - An action button that triggers the operation
 * - Loading state while the operation executes
 * - Success or error result display
 *
 * The onExecute callback should:
 * - Return a string on success (displayed as the result)
 * - Throw an Error on failure (message displayed as the error)
 *
 * This component follows the same patterns as ThemedText/ThemedView:
 * - Uses useThemeColor for theme-aware styling
 * - Uses StyleSheet.create for performance
 * - Props are clearly typed with TypeScript interfaces
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
  const [result, setResult] = useState<string | null>(null);
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
   * onExecute returns a result string on success, or throws on error.
   */
  const handleExecute = async () => {
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const resultText = await onExecute(values);
      setResult(resultText);
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
          <ThemedText style={styles.resultText} selectable>
            {result}
          </ThemedText>
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
    gap: 4,
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
