import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, TAP_TARGET } from '../src/theme';

export default function PlanScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Handle bar for modal */}
        <View style={styles.handle} />

        {/* Header with close */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>7-Day Meal Plan</Text>
            <Text style={styles.subtitle}>Pro feature</Text>
          </View>
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
          {/* Pro badge */}
          <View style={styles.proBadge}>
            <Ionicons name="star" size={16} color={Colors.warning} />
            <Text style={styles.proBadgeText}>Pro · $5.99/month or $59/year</Text>
          </View>

          {/* What you get */}
          <Text style={styles.sectionTitle}>What you get with Pro</Text>
          <View style={styles.featureList}>
            <FeatureRow emoji="📅" text="Full 7-day meal plan adapted to your diet" />
            <FeatureRow emoji="🛒" text="Printable grocery list for the whole week" />
            <FeatureRow emoji="♾️" text="Unlimited meal conversions" />
            <FeatureRow emoji="❤️" text="Save unlimited favorites" />
          </View>

          {/* Plan preview placeholder — 7 day slots */}
          <Text style={styles.sectionTitle}>Your Plan Preview</Text>
          <Text style={styles.planNote}>
            A full 7-day plan will be generated here once Pro is active. Each day will have breakfast, lunch, and dinner adapted to your chosen diet, with allergens excluded automatically.
          </Text>

          {DAYS.map((day) => (
            <View key={day} style={styles.dayCard}>
              <Text style={styles.dayLabel}>{day}</Text>
              <View style={styles.mealSlots}>
                <MealSlot label="Breakfast" />
                <MealSlot label="Lunch" />
                <MealSlot label="Dinner" />
              </View>
            </View>
          ))}

          {/* Grocery list teaser */}
          <View style={styles.groceryTeaser}>
            <Ionicons name="list" size={24} color={Colors.primary} />
            <View style={styles.groceryTeaserText}>
              <Text style={styles.groceryTitle}>Grocery List</Text>
              <Text style={styles.grocerySub}>
                Auto-generated from your 7-day plan — ready to print or share
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Upgrade CTA */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => router.push('/upgrade')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Upgrade to Pro"
          >
            <Text style={styles.upgradeText}>Upgrade to Pro</Text>
          </TouchableOpacity>
          <Text style={styles.footerNote}>Cancel anytime · Billed through App Store</Text>
        </View>
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

function MealSlot({ label }: { label: string }) {
  return (
    <View style={styles.mealSlot}>
      <Text style={styles.mealSlotLabel}>{label}</Text>
      <View style={styles.mealSlotBar} />
    </View>
  );
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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
    alignItems: 'flex-start',
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
  subtitle: {
    fontSize: Typography.sm,
    color: Colors.primary,
    fontWeight: Typography.semibold,
    marginTop: 2,
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
    paddingBottom: Spacing.xl,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.warningLight,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    marginBottom: Spacing.xl,
  },
  proBadgeText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.warning,
  },
  sectionTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  featureList: { marginBottom: Spacing.xl, gap: Spacing.sm },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  featureEmoji: { fontSize: 22, width: 30, textAlign: 'center' },
  featureText: { fontSize: Typography.body, color: Colors.textPrimary, flex: 1 },
  planNote: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  dayCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
  },
  dayLabel: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  mealSlots: { gap: Spacing.xs },
  mealSlot: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  mealSlotLabel: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    width: 72,
  },
  mealSlotBar: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.surfaceAlt,
  },
  groceryTeaser: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.accent,
    padding: Spacing.base,
    marginTop: Spacing.base,
    gap: Spacing.md,
  },
  groceryTeaserText: { flex: 1 },
  groceryTitle: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    color: Colors.primary,
  },
  grocerySub: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  upgradeButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    height: TAP_TARGET + 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  upgradeText: {
    color: Colors.textInverse,
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
  },
  footerNote: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
