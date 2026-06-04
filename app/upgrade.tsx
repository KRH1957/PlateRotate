import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { stripeCheckoutModule } from '../src/modules/subscription/stripeCheckout';
import { setSubscription, setSubscriptionOverride } from '../src/db/settingsDb';
import { Colors, Typography, Spacing, Radius, TAP_TARGET } from '../src/theme';

const PLANS = [
  {
    id: 'free' as const,
    name: 'Free',
    price: null,
    highlight: false,
    comingSoon: false,
    features: [
      '5 conversions total',
      'All 6 diets',
    ],
  },
  {
    id: 'basic' as const,
    name: 'Basic',
    price: '$2.99/month or $29/year',
    highlight: false,
    comingSoon: false,
    features: [
      'Unlimited conversions',
      'All 6 diets',
      'Allergen filters',
      'Conversion history',
    ],
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    price: '$6.99/month or $69/year',
    highlight: true,
    comingSoon: true,
    features: [
      'Everything in Basic',
      'Save unlimited favorites',
      '7-day meal plan',
      'Weekly grocery list',
      'Print your plan',
    ],
  },
];

type PaidPlan = 'basic' | 'pro';
type RestoreState = 'idle' | 'input' | 'loading' | 'success' | 'not-found' | 'error';

export default function UpgradeScreen() {
  const [checkoutLoading, setCheckoutLoading] = useState<PaidPlan | null>(null);
  const [checkoutError, setCheckoutError] = useState('');

  const [restoreState, setRestoreState] = useState<RestoreState>('idle');
  const [restoreEmail, setRestoreEmail] = useState('');
  const [restoreError, setRestoreError] = useState('');

  async function handleUpgrade(plan: PaidPlan) {
    setCheckoutLoading(plan);
    setCheckoutError('');
    try {
      const { url } = await stripeCheckoutModule.createCheckoutSession({ plan });
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        // Navigate in the same tab on web — Stripe redirects back to /checkout-success on return.
        window.location.href = url;
      } else {
        await Linking.openURL(url);
        // User is now in the browser completing payment.
        // Return happens via the platerotate://checkout-success deep link.
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not start checkout. Please try again.';
      setCheckoutError(msg);
    } finally {
      setCheckoutLoading(null);
    }
  }

  function handleRestoreTap() {
    if (restoreState === 'idle' || restoreState === 'not-found' || restoreState === 'error') {
      setRestoreState('input');
      setRestoreError('');
    }
  }

  async function handleRestoreSubmit() {
    const email = restoreEmail.trim();
    if (!email || !email.includes('@')) {
      setRestoreError('Please enter a valid email address.');
      return;
    }
    setRestoreState('loading');
    setRestoreError('');
    try {
      const result = await stripeCheckoutModule.restoreSubscription(email);
      if (result.found && result.plan) {
        await setSubscription(result.plan, email);
        setRestoreState('success');
        setTimeout(() => {
          router.replace('/(tabs)/convert');
        }, 2000);
      } else {
        setRestoreState('not-found');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not look up subscription. Please try again.';
      setRestoreError(msg);
      setRestoreState('error');
    }
  }

  // Dev-only test mode — bypasses all paywalls without a real payment
  async function handleTestMode() {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm('Activate test mode? This unlocks all features without a payment. Dev use only.')) {
        await setSubscriptionOverride(true);
        router.back();
      }
      return;
    }
    Alert.alert(
      'Test Mode',
      'This unlocks all features without a payment. Dev use only.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate',
          onPress: async () => {
            await setSubscriptionOverride(true);
            router.back();
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Handle bar */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Upgrade PlateRotate</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.subtitle}>Choose the plan that fits how you cook.</Text>

          {/* Inline error if checkout session creation fails */}
          {checkoutError ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={18} color={Colors.error} />
              <Text style={styles.errorText}>{checkoutError}</Text>
            </View>
          ) : null}

          {/* Plan cards */}
          {PLANS.map((plan) => (
            <View
              key={plan.id}
              style={[styles.planCard, plan.highlight && styles.planCardHighlight]}
            >
              {plan.highlight && (
                <View style={styles.popularBadge}>
                  <Ionicons name="star" size={12} color={Colors.warning} />
                  <Text style={styles.popularText}>
                    {plan.comingSoon ? 'Best Value · Coming June 15' : 'Best Value'}
                  </Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <Text style={[styles.planName, plan.highlight && styles.planNameHighlight]}>
                  {plan.name}
                </Text>
                {plan.price ? (
                  <Text style={styles.planPrice}>{plan.price}</Text>
                ) : (
                  <Text style={styles.planPriceFree}>Try it free</Text>
                )}
              </View>

              <View style={styles.featureList}>
                {plan.features.map((feature) => (
                  <View key={feature} style={styles.featureRow}>
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={plan.highlight ? Colors.primary : Colors.accent}
                    />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              {plan.id !== 'free' && (
                plan.comingSoon ? (
                  <View style={styles.comingSoonButton}>
                    <Text style={styles.comingSoonButtonText}>Coming June 15</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.upgradeButton,
                      plan.highlight && styles.upgradeButtonHighlight,
                      checkoutLoading === plan.id && styles.upgradeButtonLoading,
                    ]}
                    onPress={() => handleUpgrade(plan.id as 'basic' | 'pro')}
                    disabled={checkoutLoading !== null}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={`Upgrade to ${plan.name}`}
                  >
                    {checkoutLoading === plan.id ? (
                      <ActivityIndicator
                        size="small"
                        color={plan.highlight ? Colors.textInverse : Colors.primary}
                      />
                    ) : (
                      <Text
                        style={[
                          styles.upgradeButtonText,
                          plan.highlight && styles.upgradeButtonTextHighlight,
                        ]}
                      >
                        Get {plan.name}
                      </Text>
                    )}
                  </TouchableOpacity>
                )
              )}
            </View>
          ))}

          {/* Restore Purchase */}
          <View style={styles.restoreSection}>
            {restoreState === 'idle' && (
              <TouchableOpacity
                style={styles.restoreButton}
                onPress={handleRestoreTap}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Restore purchase"
              >
                <Text style={styles.restoreText}>Already subscribed? Restore Purchase</Text>
              </TouchableOpacity>
            )}

            {(restoreState === 'input' || restoreState === 'not-found' || restoreState === 'error') && (
              <View style={styles.restoreInputContainer}>
                <Text style={styles.restoreInputLabel}>Enter the email you used at checkout:</Text>
                <TextInput
                  style={styles.restoreInput}
                  value={restoreEmail}
                  onChangeText={setRestoreEmail}
                  placeholder="your@email.com"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleRestoreSubmit}
                  accessibilityLabel="Email address for restore"
                />
                {restoreError ? (
                  <Text style={styles.restoreError}>{restoreError}</Text>
                ) : null}
                {restoreState === 'not-found' ? (
                  <Text style={styles.restoreError}>
                    No active subscription found for that email.
                  </Text>
                ) : null}
                <TouchableOpacity
                  style={styles.restoreSubmitButton}
                  onPress={handleRestoreSubmit}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                >
                  <Text style={styles.restoreSubmitText}>Look Up Subscription</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setRestoreState('idle')}
                  style={styles.restoreCancelButton}
                  accessibilityRole="button"
                >
                  <Text style={styles.restoreCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}

            {restoreState === 'loading' && (
              <View style={styles.restoreLoading}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.restoreLoadingText}>Looking up your subscription…</Text>
              </View>
            )}

            {restoreState === 'success' && (
              <View style={styles.restoreSuccess}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                <Text style={styles.restoreSuccessText}>Subscription restored! Taking you in…</Text>
              </View>
            )}
          </View>

          {/* Test mode — hidden at the bottom, for Kevin only */}
          <TouchableOpacity
            style={styles.testModeButton}
            onPress={handleTestMode}
            activeOpacity={0.5}
            accessibilityRole="button"
            accessibilityLabel="Test mode"
          >
            <Text style={styles.testModeText}>· · ·</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: Typography.xl,
    fontWeight: Typography.extrabold,
    color: Colors.textPrimary,
  },
  closeButton: {
    width: TAP_TARGET,
    height: TAP_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -Spacing.sm,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  subtitle: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.errorLight,
    borderRadius: Radius.md,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  errorText: {
    fontSize: Typography.sm,
    color: Colors.error,
    flex: 1,
    lineHeight: 20,
  },
  planCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
    marginBottom: Spacing.md,
  },
  planCardHighlight: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: Colors.primaryLight,
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.warningLight,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    marginBottom: Spacing.sm,
  },
  popularText: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.warning,
  },
  planHeader: {
    marginBottom: Spacing.md,
  },
  planName: {
    fontSize: Typography.lg,
    fontWeight: Typography.extrabold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  planNameHighlight: {
    color: Colors.primary,
  },
  planPrice: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  planPriceFree: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  featureList: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  featureText: {
    fontSize: Typography.body,
    color: Colors.textPrimary,
    flex: 1,
    lineHeight: 22,
  },
  upgradeButton: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.full,
    height: TAP_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    marginTop: Spacing.xs,
  },
  upgradeButtonHighlight: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  upgradeButtonLoading: {
    opacity: 0.7,
  },
  comingSoonButton: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.full,
    height: TAP_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.xs,
  },
  comingSoonButtonText: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    color: Colors.textMuted,
  },
  upgradeButtonText: {
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  upgradeButtonTextHighlight: {
    color: Colors.textInverse,
  },
  restoreSection: {
    marginTop: Spacing.sm,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: Spacing.base,
  },
  restoreText: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
  restoreInputContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  restoreInputLabel: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.semibold,
  },
  restoreInput: {
    height: TAP_TARGET,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.base,
    fontSize: Typography.body,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  restoreError: {
    fontSize: Typography.xs,
    color: Colors.error,
  },
  restoreSubmitButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    height: TAP_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  restoreSubmitText: {
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    color: Colors.textInverse,
  },
  restoreCancelButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  restoreCancelText: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
  },
  restoreLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.base,
  },
  restoreLoadingText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  restoreSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.base,
  },
  restoreSuccessText: {
    fontSize: Typography.sm,
    color: Colors.primary,
    fontWeight: Typography.semibold,
  },
  testModeButton: {
    alignItems: 'center',
    paddingVertical: Spacing.base,
    marginTop: Spacing.md,
  },
  testModeText: {
    fontSize: Typography.sm,
    color: Colors.border,
    letterSpacing: 4,
  },
});
