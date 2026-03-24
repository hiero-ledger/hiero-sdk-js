import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { StatusColors } from '@/constants/theme';

type StatusType = 'success' | 'warning' | 'error';

interface StatusBadgeProps {
  status: StatusType;
  label: string;
  style?: ViewStyle;
}

/**
 * Visual indicator showing connection or transaction state.
 *
 * Displays a colored dot (green/orange/red) alongside a text label.
 * Used on the Home screen to show connection status and can be
 * reused anywhere a status indicator is needed.
 *
 * Follows the same component pattern as ThemedText/ThemedView:
 * - Typed props with TypeScript interface
 * - StyleSheet.create for performance
 * - Accepts optional style override
 */
export function StatusBadge({ status, label, style }: StatusBadgeProps) {
  const dotColor =
    status === 'success'
      ? StatusColors.success
      : status === 'warning'
        ? StatusColors.warning
        : StatusColors.error;

  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedView style={[styles.dot, { backgroundColor: dotColor }]} />
      <ThemedText type="defaultSemiBold">{label}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
