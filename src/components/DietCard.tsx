import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Diet } from '../types';
import { Colors, Typography, Spacing, Radius, TAP_TARGET } from '../theme';

interface Props {
  diet: Diet;
  selected: boolean;
  onPress: () => void;
}

export default function DietCard({ diet, selected, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${diet.label}: ${diet.description}`}
    >
      <Text style={styles.emoji}>{diet.emoji}</Text>
      <View style={styles.textBlock}>
        <Text style={[styles.label, selected && styles.labelSelected]}>{diet.label}</Text>
        <Text style={styles.description}>{diet.description}</Text>
      </View>
      {selected && (
        <View style={styles.checkCircle}>
          <Text style={styles.checkMark}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    minHeight: TAP_TARGET,
    marginBottom: Spacing.sm,
  },
  cardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  emoji: {
    fontSize: 28,
    marginRight: Spacing.md,
  },
  textBlock: {
    flex: 1,
  },
  label: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  labelSelected: {
    color: Colors.primary,
  },
  description: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  checkMark: {
    color: Colors.textInverse,
    fontSize: 13,
    fontWeight: Typography.bold,
  },
});
