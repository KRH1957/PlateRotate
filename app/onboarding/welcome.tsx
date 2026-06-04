import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, TAP_TARGET } from '../../src/theme';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Progress dots */}
        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        {/* Hero area */}
        <View style={styles.hero}>
          <Text style={styles.logo}>🔄</Text>
          <Text style={styles.appName}>PlateRotate</Text>
          <Text style={styles.tagline}>Any meal. Any diet. In seconds.</Text>
        </View>

        {/* Feature bullets */}
        <View style={styles.features}>
          <FeatureRow emoji="🎤" text="Speak your meal — or type it" />
          <FeatureRow emoji="🥗" text="Converts it to your diet instantly" />
          <FeatureRow emoji="📋" text="Full 7-day meal plans (Pro)" />
          <FeatureRow emoji="📱" text="Works 100% offline — no account needed" />
        </View>

        {/* Platform availability */}
        <Text style={styles.availability}>Available on Android. iOS coming soon.</Text>

        {/* CTA */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/onboarding/diet-picker')}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Get started"
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function FeatureRow({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureEmoji}>{emoji}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    justifyContent: 'space-between',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.base,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  logo: {
    fontSize: 72,
    marginBottom: Spacing.base,
  },
  appName: {
    fontSize: Typography.hero,
    fontWeight: Typography.extrabold,
    color: Colors.primary,
    letterSpacing: -0.5,
    marginBottom: Spacing.sm,
  },
  tagline: {
    fontSize: Typography.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: Typography.medium,
  },
  features: {
    gap: Spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  featureEmoji: {
    fontSize: 24,
    width: 36,
    textAlign: 'center',
  },
  featureText: {
    fontSize: Typography.body,
    color: Colors.textPrimary,
    flex: 1,
  },
  availability: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    fontWeight: Typography.regular,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    height: TAP_TARGET + 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  buttonText: {
    color: Colors.textInverse,
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
  },
});
