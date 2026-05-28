import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DietCard from '../../src/components/DietCard';
import AllergenToggle from '../../src/components/AllergenToggle';
import { DIETS, ALLERGENS } from '../../src/constants/diets';
import { DietId, AllergenId } from '../../src/types';
import { getSettings, setDiet, setAllergens, resetOnboarding } from '../../src/db/settingsDb';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';

export default function SettingsScreen() {
  const [dietId, setDietId] = useState<DietId | null>(null);
  const [allergens, setAllergensState] = useState<Set<AllergenId>>(new Set());
  const [saving, setSaving] = useState(false);

  // Reload settings whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      getSettings().then((s) => {
        setDietId(s.dietId);
        setAllergensState(new Set(s.allergens));
      });
    }, [])
  );

  async function handleSaveDiet(id: DietId) {
    setDietId(id);
    setSaving(true);
    try {
      await setDiet(id);
    } catch {
      Alert.alert('Save failed', 'Could not save your diet preference. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAllergen(id: AllergenId) {
    const next = new Set(allergens);
    next.has(id) ? next.delete(id) : next.add(id);
    setAllergensState(next);
    setSaving(true);
    try {
      await setAllergens(Array.from(next));
    } catch {
      Alert.alert('Save failed', 'Could not save your allergen settings. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          {saving && <Text style={styles.savingLabel}>Saving…</Text>}
        </View>

        {/* Diet preference */}
        <Text style={styles.sectionTitle}>Your Diet</Text>
        <Text style={styles.sectionSubtitle}>
          Every conversion will be adapted to this diet.
        </Text>
        <View style={styles.section}>
          {DIETS.map((diet) => (
            <DietCard
              key={diet.id}
              diet={diet}
              selected={dietId === diet.id}
              onPress={() => handleSaveDiet(diet.id)}
            />
          ))}
        </View>

        {/* Allergen settings */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>Allergies</Text>
        <Text style={styles.sectionSubtitle}>
          PlateRotate will exclude these ingredients from every conversion.
        </Text>
        <View style={styles.section}>
          {ALLERGENS.map((allergen) => (
            <AllergenToggle
              key={allergen.id}
              allergen={allergen}
              enabled={allergens.has(allergen.id)}
              onToggle={() => handleToggleAllergen(allergen.id)}
            />
          ))}
        </View>

        {/* Pricing / subscription placeholder */}
        <View style={styles.pricingCard}>
          <Text style={styles.pricingTitle}>PlateRotate Plans</Text>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingPlan}>Free</Text>
            <Text style={styles.pricingDetail}>5 meal conversions</Text>
          </View>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingPlan}>Basic</Text>
            <Text style={styles.pricingDetail}>$2.99/mo · Unlimited conversions</Text>
          </View>
          <View style={[styles.pricingRow, styles.pricingRowLast]}>
            <Text style={styles.pricingPlan}>Pro</Text>
            <Text style={styles.pricingDetail}>$5.99/mo · + 7-day plans & grocery list</Text>
          </View>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => router.push('/upgrade')}
            accessibilityRole="button"
            accessibilityLabel="Upgrade to Pro"
          >
            <Text style={styles.upgradeText}>Upgrade</Text>
          </TouchableOpacity>
        </View>

        {/* Reset — clears diet + reruns onboarding */}
        <TouchableOpacity
          style={styles.resetButton}
          onPress={() =>
            Alert.alert(
              'Restart Setup',
              'This will clear your diet and allergen selection and restart the setup flow. Your conversion history and favorites will not be deleted.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Reset',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await resetOnboarding();
                      router.replace('/');
                    } catch {
                      Alert.alert('Error', 'Could not reset. Please try again.');
                    }
                  },
                },
              ]
            )
          }
          accessibilityRole="button"
          accessibilityLabel="Restart setup"
        >
          <Text style={styles.resetText}>Restart Setup</Text>
        </TouchableOpacity>

        {/* App info */}
        <Text style={styles.appInfo}>PlateRotate v1.0.0 · by KRH Digital</Text>
        <Text style={styles.appInfo}>Your data never leaves your device.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.xxl,
    fontWeight: Typography.extrabold,
    color: Colors.textPrimary,
  },
  savingLabel: {
    fontSize: Typography.sm,
    color: Colors.accent,
    fontWeight: Typography.medium,
  },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  section: {
    marginBottom: Spacing.sm,
  },
  pricingCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  pricingTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pricingRowLast: {
    borderBottomWidth: 0,
    marginBottom: Spacing.base,
  },
  pricingPlan: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    width: 60,
  },
  pricingDetail: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    flex: 1,
    textAlign: 'right',
  },
  upgradeButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  upgradeText: {
    color: Colors.textInverse,
    fontSize: Typography.body,
    fontWeight: Typography.bold,
  },
  resetButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  resetText: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  appInfo: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 4,
  },
});
