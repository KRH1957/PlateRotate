import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getDb } from '../src/db/schema';
import { Colors } from '../src/theme';

export default function RootLayout() {
  useEffect(() => {
    // Initialize database on first render — errors here are logged but don't crash the app
    getDb().catch((err) => {
      console.error('Database init failed:', err?.message ?? String(err));
    });
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'fade',
        }}
      >
        {/* Index handles the onboarding gate redirect */}
        <Stack.Screen name="index" />

        {/* Onboarding — shown only on first launch */}
        <Stack.Screen name="onboarding" />

        {/* Main app tab bar */}
        <Stack.Screen name="(tabs)" />

        {/* 7-day plan — modal overlay (Pro tier) */}
        <Stack.Screen
          name="plan"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            headerShown: false,
          }}
        />

        {/* Upgrade / pricing modal */}
        <Stack.Screen
          name="upgrade"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            headerShown: false,
          }}
        />

        {/* Deep link landing zone after Stripe payment — platerotate://checkout-success */}
        <Stack.Screen
          name="checkout-success"
          options={{
            headerShown: false,
            animation: 'fade',
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
