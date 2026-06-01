import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { stripeCheckoutModule } from '../src/modules/subscription/stripeCheckout';
import { setSubscription } from '../src/db/settingsDb';
import { Colors, Typography, Spacing, Radius, TAP_TARGET } from '../src/theme';

// This screen is the deep link handler for Stripe's success redirect.
// Stripe sends the user here after payment: platerotate://checkout-success?session_id=cs_xxx
// It verifies the session with the proxy, stores the tier, then navigates into the app.

type ScreenState = 'verifying' | 'success' | 'error';

export default function CheckoutSuccessScreen() {
  const { session_id } = useLocalSearchParams<{ session_id: string }>();
  const [screenState, setScreenState] = useState<ScreenState>('verifying');
  const [planName, setPlanName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!session_id) {
      setErrorMessage('No session ID found. If you were charged, contact support.');
      setScreenState('error');
      return;
    }
    verifyAndActivate(session_id);
  }, [session_id]);

  async function verifyAndActivate(sessionId: string) {
    try {
      const result = await stripeCheckoutModule.verifySession(sessionId);

      if (!result.paid || !result.plan) {
        setErrorMessage('Payment not confirmed yet. If you were charged, contact support.');
        setScreenState('error');
        return;
      }

      await setSubscription(result.plan, result.email ?? undefined);

      setPlanName(result.plan === 'pro' ? 'Pro' : 'Basic');
      setScreenState('success');

      // Give the user a moment to see the success screen, then send them to the app
      setTimeout(() => {
        router.replace('/(tabs)/convert');
      }, 2500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not verify payment. Please try again.';
      setErrorMessage(msg);
      setScreenState('error');
    }
  }

  if (screenState === 'verifying') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.verifyingText}>Confirming your payment…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (screenState === 'success') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Ionicons name="checkmark-circle" size={80} color={Colors.primary} />
          <Text style={styles.successTitle}>You're all set!</Text>
          <Text style={styles.successSubtitle}>
            {planName} plan is now active.{'\n'}Enjoy unlimited conversions.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>{errorMessage}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/upgrade')}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <Text style={styles.backButtonText}>Back to Plans</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.replace('/(tabs)/convert')}
          activeOpacity={0.7}
          accessibilityRole="button"
        >
          <Text style={styles.homeButtonText}>Go to App</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
  },
  verifyingText: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xl,
    textAlign: 'center',
  },
  successTitle: {
    fontSize: Typography.xxl,
    fontWeight: Typography.extrabold,
    color: Colors.textPrimary,
    marginTop: Spacing.xl,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.extrabold,
    color: Colors.textPrimary,
    marginTop: Spacing.xl,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  backButton: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    height: TAP_TARGET,
    paddingHorizontal: Spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    color: Colors.textInverse,
  },
  homeButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  homeButtonText: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
});
