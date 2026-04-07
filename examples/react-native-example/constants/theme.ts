import { Platform } from 'react-native';

export const HieroColors = {
  /** Primary magenta — used for interactive elements and branding */
  primary: '#B81A56',
  /** Darker magenta — used for headers and emphasis */
  primaryDark: '#8A1340',
  /** Light magenta — used for subtle backgrounds */
  primaryLight: '#FDF2F6',
};

export const StatusColors = {
  /** Green — connected, success */
  success: '#34C759',
  successBg: 'rgba(52, 199, 89, 0.08)',
  successBorder: 'rgba(52, 199, 89, 0.25)',

  /** Orange — disconnected, warning */
  warning: '#FF9500',
  warningBg: 'rgba(255, 149, 0, 0.06)',
  warningBorder: 'rgba(255, 149, 0, 0.3)',

  /** Red — not configured, error */
  error: '#FF3B30',
  errorBg: 'rgba(255, 59, 48, 0.06)',
  errorBorder: 'rgba(255, 59, 48, 0.3)',
};

/**
 * Theme colors for light and dark mode.
 * Consumed by the useThemeColor hook via Colors[colorScheme][key].
 */
export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: HieroColors.primary,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: HieroColors.primary,
    cardBorder: 'rgba(0,0,0,0.08)',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: HieroColors.primary,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: HieroColors.primary,
    cardBorder: 'rgba(255,255,255,0.1)',
  },
};

/**
 * Platform-specific font families.
 */
export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
