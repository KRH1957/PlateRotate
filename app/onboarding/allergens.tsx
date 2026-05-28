import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AllergenToggle from '../../src/components/AllergenToggle';
import { ALLERGENS } from '../../src/constants/diets';
import { AllergenId, DietId } from '../../src/types';
import { completeOnboarding } from '../../src/db/settingsDb';
import { Colors, Typography, Spacing, Radius, TAP_TARGET } from '../../src/theme';

export default function AllergensScreen() {
  const { dietId } = useLocalSearchParams<{ dietId: DietId }>();
  const [enabled, setEnabled] = useState<Set<AllergenId>>(new Set());
  const [saving, setSaving] = useState(false);

  function toggle(id: AllergenId) {
    setEnabled((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleFinish() {
    if (!dietId) return;
    setSaving(true);
    try {
      await completeOnboarding(dietId, Array.from(enabled));
      router.replace('/(tabs)/convert');
    } catch (err) {
      console.error('completeOnboarding failed:', err instanceof Error ? err.message : String(err));
      Alert.alert('Something went wrong', 'Could not save your settings. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Progress dots */}
        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotDone]} />
          <View style={[styles.dot, styles.dotDone]} />
          <View style={[styles.dot, styles.dotActive]} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.step}>Step 3 of 3</Text>
          <Text style={styles.title}>Any allergies?</Text>
          <Text style={styles.subtitle}>
            Turn on anything you're allergic to. PlateRotate will exclude these from every conversion, automatically.
          </Text>
        </View>

        {/* Allergen toggles */}
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {ALLERGENS.map((allergen) => (
            <AllergenToggle
              key={allergen.id}
              allergen={allergen}
              enabled={enabled.has(allergen.id)}
              onToggle={() => toggle(allergen.id)}
            />
          ))}

          <Text style={styles.noneNote}>
            No allergies? Leave all toggles off and tap Done.
          </Text>
        </ScrollView>

        {/* Done button */}
        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleFinish}
          disabled={saving}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Done — start using PlateRotate"
        >
          <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Done'}</Text>
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
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.base,
    marginBottom: Spacing.xl,
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
  dotDone: {
    backgroundColor: Colors.accent,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  step: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    fontWeight: Typography.medium,
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: Typography.xxl,
    fontWeight: Typography.extrabold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Spacing.base,
  },
  noneNote: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    height: TAP_TARGET + 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
  },
  buttonDisabled: {
    backgroundColor: Colors.accent,
  },
  buttonText: {
    color: Colors.textInverse,
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
  },
});
