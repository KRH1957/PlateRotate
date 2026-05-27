import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DietCard from '../../src/components/DietCard';
import { DIETS } from '../../src/constants/diets';
import { DietId } from '../../src/types';
import { Colors, Typography, Spacing, Radius, TAP_TARGET } from '../../src/theme';

export default function DietPickerScreen() {
  const [selected, setSelected] = useState<DietId | null>(null);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Progress dots */}
        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotDone]} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.step}>Step 2 of 3</Text>
          <Text style={styles.title}>Pick your diet</Text>
          <Text style={styles.subtitle}>
            PlateRotate will convert every meal to this diet. You can change it anytime.
          </Text>
        </View>

        {/* Diet cards */}
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {DIETS.map((diet) => (
            <DietCard
              key={diet.id}
              diet={diet}
              selected={selected === diet.id}
              onPress={() => setSelected(diet.id)}
            />
          ))}
        </ScrollView>

        {/* Next button */}
        <TouchableOpacity
          style={[styles.button, !selected && styles.buttonDisabled]}
          onPress={() => {
            if (!selected) return;
            // Pass diet selection to next screen via params
            router.push({ pathname: '/onboarding/allergens', params: { dietId: selected } });
          }}
          disabled={!selected}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Next — choose allergens"
          accessibilityState={{ disabled: !selected }}
        >
          <Text style={[styles.buttonText, !selected && styles.buttonTextDisabled]}>Next</Text>
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
    backgroundColor: Colors.border,
  },
  buttonText: {
    color: Colors.textInverse,
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
  },
  buttonTextDisabled: {
    color: Colors.textMuted,
  },
});
