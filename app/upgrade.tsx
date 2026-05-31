import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { setSubscriptionOverride } from '../src/db/settingsDb';
import { Colors, Typography, Spacing, Radius, TAP_TARGET } from '../src/theme';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: null,
    highlight: false,
    features: [
      '5 meal conversions total',
      'No conversion history',
      'No favorites',
    ],
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '$2.99/month or $29/year',
    highlight: false,
    features: [
      'Unlimited meal conversions',
      'Save unlimited favorites',
      'Conversion history',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$5.99/month or $59/year',
    highlight: true,
    features: [
      'Everything in Basic',
      '7-day meal plan generator',
      'Printable grocery list',
      'Priority support',
    ],
  },
] as const;

export default function UpgradeScreen() {
  function handleUpgrade(planName: string) {
    Alert.alert(
      'Coming soon',
      `In-app purchase coming in v1.1 — thank you for your interest in ${planName}!`,
      [{ text: 'Got it' }]
    );
  }

  async function handleRestorePurchase() {
    await setSubscriptionOverride(true);
    Alert.alert(
      'Test mode activated',
      'Free tier bypassed — you now have unlimited conversions for testing.',
      [{ text: 'OK', onPress: () => router.back() }]
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
          <Text style={styles.subtitle}>
            Choose the plan that fits how you cook.
          </Text>

          {PLANS.map((plan) => (
            <View
              key={plan.id}
              style={[styles.planCard, plan.highlight && styles.planCardHighlight]}
            >
              {plan.highlight && (
                <View style={styles.popularBadge}>
                  <Ionicons name="star" size={12} color={Colors.warning} />
                  <Text style={styles.popularText}>Most popular</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <Text style={[styles.planName, plan.highlight && styles.planNameHighlight]}>
                  {plan.name}
                </Text>
                {plan.price ? (
                  <Text style={styles.planPrice}>{plan.price}</Text>
                ) : (
                  <Text style={styles.planPriceFree}>Free forever</Text>
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
                <TouchableOpacity
                  style={[
                    styles.upgradeButton,
                    plan.highlight && styles.upgradeButtonHighlight,
                  ]}
                  onPress={() => handleUpgrade(plan.name)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={`Upgrade to ${plan.name}`}
                >
                  <Text
                    style={[
                      styles.upgradeButtonText,
                      plan.highlight && styles.upgradeButtonTextHighlight,
                    ]}
                  >
                    Get {plan.name}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          {/* Restore purchase */}
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestorePurchase}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Restore purchase"
          >
            <Text style={styles.restoreText}>Already subscribed? Restore Purchase</Text>
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
  upgradeButtonText: {
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  upgradeButtonTextHighlight: {
    color: Colors.textInverse,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: Spacing.base,
    marginTop: Spacing.sm,
  },
  restoreText: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
});
