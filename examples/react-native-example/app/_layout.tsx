import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { HieroProvider } from '@/hooks/use-hiero';

/**
 * Root layout for the app.
 *
 * Wraps the entire app with:
 * - ThemeProvider: light/dark theme based on device settings
 * - HieroProvider: shares the SDK Client instance across all screens
 *
 * The Stack navigator contains a single (tabs) group for the main navigation.
 */
export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <HieroProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </HieroProvider>
    </ThemeProvider>
  );
}
