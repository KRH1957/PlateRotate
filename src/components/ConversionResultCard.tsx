import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ConversionResult } from '../types';
import { DIETS } from '../constants/diets';
import { Colors, Typography, Spacing, Radius, TAP_TARGET } from '../theme';

interface Props {
  result: ConversionResult;
  isFavorited: boolean;
  onToggleFavorite: () => void;
}

export default function ConversionResultCard({ result, isFavorited, onToggleFavorite }: Props) {
  const [showInstructions, setShowInstructions] = useState(false);
  const diet = DIETS.find((d) => d.id === result.dietId);

  return (
    <View style={styles.card}>
      {/* Diet badge + converted meal name */}
      <View style={styles.headerRow}>
        <View style={styles.dietBadge}>
          <Text style={styles.dietEmoji}>{diet?.emoji ?? '🍽️'}</Text>
          <Text style={styles.dietLabel}>{diet?.label ?? result.dietId}</Text>
        </View>
        <TouchableOpacity
          style={styles.heartButton}
          onPress={onToggleFavorite}
          accessibilityRole="button"
          accessibilityLabel={isFavorited ? 'Remove from favorites' : 'Save to favorites'}
        >
          <Ionicons
            name={isFavorited ? 'heart' : 'heart-outline'}
            size={26}
            color={isFavorited ? '#E05C5C' : Colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.convertedName}>{result.convertedMeal}</Text>
      <Text style={styles.originalMeal}>Based on: {result.originalMeal}</Text>

      {/* Ingredients */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ingredients</Text>
        {result.ingredients.map((ing, i) => (
          <View key={i} style={styles.bulletRow}>
            <View style={styles.bullet} />
            <Text style={styles.bulletText}>{ing}</Text>
          </View>
        ))}
      </View>

      {/* Instructions — collapsed by default to keep screen tidy */}
      <TouchableOpacity
        style={styles.instructionsToggle}
        onPress={() => setShowInstructions((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={showInstructions ? 'Hide instructions' : 'Show instructions'}
      >
        <Text style={styles.sectionTitle}>Instructions</Text>
        <Ionicons
          name={showInstructions ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={Colors.primary}
        />
      </TouchableOpacity>

      {showInstructions && (
        <View style={styles.instructionsList}>
          {result.instructions.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Notes */}
      {result.notes ? (
        <View style={styles.notesBox}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.notesText}>{result.notes}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  dietBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  dietEmoji: { fontSize: 14 },
  dietLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.primary,
  },
  heartButton: {
    width: TAP_TARGET,
    height: TAP_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  convertedName: {
    fontSize: Typography.xl,
    fontWeight: Typography.extrabold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    lineHeight: 28,
  },
  originalMeal: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.base,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: Spacing.base,
  },
  sectionTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: 6,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
    marginTop: 7,
    flexShrink: 0,
  },
  bulletText: {
    fontSize: Typography.body,
    color: Colors.textPrimary,
    flex: 1,
    lineHeight: 22,
  },
  instructionsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.xs,
  },
  instructionsList: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumberText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.textInverse,
  },
  stepText: {
    fontSize: Typography.body,
    color: Colors.textPrimary,
    flex: 1,
    lineHeight: 22,
  },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
  notesText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
});
