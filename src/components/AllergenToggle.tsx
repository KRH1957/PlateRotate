import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Allergen } from '../types';
import { Colors, Typography, Spacing, Radius, TAP_TARGET } from '../theme';

interface Props {
  allergen: Allergen;
  enabled: boolean;
  onToggle: () => void;
}

export default function AllergenToggle({ allergen, enabled, onToggle }: Props) {
  return (
    <TouchableOpacity
      style={[styles.row, enabled && styles.rowEnabled]}
      onPress={onToggle}
      activeOpacity={0.7}
      accessibilityRole="switch"
      accessibilityState={{ checked: enabled }}
      accessibilityLabel={`${allergen.label} allergy — ${enabled ? 'on' : 'off'}`}
    >
      <Text style={styles.emoji}>{allergen.emoji}</Text>
      <Text style={[styles.label, enabled && styles.labelEnabled]}>{allergen.label}</Text>
      <View style={[styles.toggle, enabled && styles.toggleEnabled]}>
        <View style={[styles.thumb, enabled && styles.thumbEnabled]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
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
  rowEnabled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  emoji: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  label: {
    flex: 1,
    fontSize: Typography.md,
    fontWeight: Typography.medium,
    color: Colors.textPrimary,
  },
  labelEnabled: {
    color: Colors.primary,
    fontWeight: Typography.semibold,
  },
  // Custom toggle switch
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.border,
    padding: 2,
    justifyContent: 'center',
  },
  toggleEnabled: {
    backgroundColor: Colors.primary,
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.textMuted,
    alignSelf: 'flex-start',
  },
  thumbEnabled: {
    backgroundColor: Colors.textInverse,
    alignSelf: 'flex-end',
  },
});
