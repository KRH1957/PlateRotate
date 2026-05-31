import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getHistory, deleteHistoryEntry } from '../../src/db/historyDb';
import { saveFavorite } from '../../src/db/favoritesDb';
import { getSubscriptionOverride } from '../../src/db/settingsDb';
import { HistoryEntry, ConversionResult } from '../../src/types';
import { DIETS } from '../../src/constants/diets';
import ConversionResultCard from '../../src/components/ConversionResultCard';
import { Colors, Typography, Spacing, Radius, TAP_TARGET } from '../../src/theme';

type ParsedEntry = Omit<HistoryEntry, 'convertedMeal'> & { result: ConversionResult };

function formatDate(ts: number): string {
  const diffDays = Math.floor((Date.now() - ts) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function HistoryScreen() {
  const [entries, setEntries] = useState<ParsedEntry[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [hasOverride, setHasOverride] = useState(false);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const override = await getSubscriptionOverride();
        setHasOverride(override);
        if (!override) return; // Free users don't need history loaded
        const rows = await getHistory();
        const parsed: ParsedEntry[] = [];
        for (const entry of rows) {
          try {
            parsed.push({
              id: entry.id,
              originalMeal: entry.originalMeal,
              dietId: entry.dietId,
              createdAt: entry.createdAt,
              result: JSON.parse(entry.convertedMeal) as ConversionResult,
            });
          } catch {
            // Skip rows with corrupted JSON — don't crash the screen
          }
        }
        setEntries(parsed);
      }
      load();
    }, [])
  );

  async function handleSaveFromHistory(entry: ParsedEntry) {
    if (savedIds.has(entry.id)) {
      Alert.alert('Already saved', 'This meal is already in your favorites.');
      return;
    }
    try {
      await saveFavorite(entry.originalMeal, entry.result);
      setSavedIds((prev) => new Set([...prev, entry.id]));
    } catch {
      Alert.alert('Save failed', 'Could not save to favorites. Please try again.');
    }
  }

  function confirmDelete(entry: ParsedEntry) {
    Alert.alert(
      'Delete entry?',
      `Remove "${entry.result.convertedMeal}" from your history?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteHistoryEntry(entry.id);
            setEntries((prev) => prev.filter((e) => e.id !== entry.id));
            if (expandedId === entry.id) setExpandedId(null);
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>All your past meal conversions</Text>

        {/* Free tier: history requires Basic or Pro */}
        {!hasOverride ? (
          <View style={styles.upgradeWall}>
            <Ionicons name="lock-closed-outline" size={56} color={Colors.border} />
            <Text style={styles.upgradeTitle}>History requires Basic or Pro</Text>
            <Text style={styles.upgradeBody}>
              Upgrade to see all your past meal conversions and never lose a great adaptation.
            </Text>
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => router.push('/upgrade')}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="See upgrade plans"
            >
              <Ionicons name="arrow-up-circle" size={20} color={Colors.textInverse} />
              <Text style={styles.upgradeButtonText}>See Plans</Text>
            </TouchableOpacity>
          </View>
        ) : entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={64} color={Colors.border} />
            <Text style={styles.emptyTitle}>No conversions yet</Text>
            <Text style={styles.emptyBody}>
              Every meal you convert will be saved here automatically.
            </Text>
          </View>
        ) : (
          entries.map((entry) => {
            const diet = DIETS.find((d) => d.id === entry.dietId);
            const expanded = expandedId === entry.id;

            if (expanded) {
              return (
                <View key={entry.id} style={styles.expandedWrapper}>
                  <ConversionResultCard
                    result={entry.result}
                    isFavorited={savedIds.has(entry.id)}
                    onToggleFavorite={() => handleSaveFromHistory(entry)}
                  />
                  <TouchableOpacity
                    style={styles.collapseButton}
                    onPress={() => setExpandedId(null)}
                    accessibilityRole="button"
                    accessibilityLabel="Collapse"
                  >
                    <Ionicons name="chevron-up" size={16} color={Colors.primary} />
                    <Text style={styles.collapseText}>Collapse</Text>
                  </TouchableOpacity>
                </View>
              );
            }

            return (
              <TouchableOpacity
                key={entry.id}
                style={styles.row}
                onPress={() => setExpandedId(entry.id)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`${entry.originalMeal} converted to ${entry.result.convertedMeal}. Tap to expand.`}
              >
                {/* Date column */}
                <Text style={styles.dateText}>{formatDate(entry.createdAt)}</Text>

                {/* Meal column */}
                <View style={styles.mealColumn}>
                  <Text style={styles.mealLine} numberOfLines={1}>
                    <Text style={styles.originalMeal}>{entry.originalMeal}</Text>
                    <Text style={styles.arrow}> → </Text>
                    <Text style={styles.convertedMeal}>{entry.result.convertedMeal}</Text>
                  </Text>
                </View>

                {/* Diet badge */}
                <View style={styles.dietBadge}>
                  <Text style={styles.dietEmoji}>{diet?.emoji ?? '🍽️'}</Text>
                </View>

                {/* Delete button — same pattern as favorites */}
                <TouchableOpacity
                  style={styles.trashButton}
                  onPress={() => confirmDelete(entry)}
                  accessibilityRole="button"
                  accessibilityLabel="Delete this history entry"
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}
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
  title: {
    fontSize: Typography.xxl,
    fontWeight: Typography.extrabold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
  },
  upgradeWall: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    gap: Spacing.md,
  },
  upgradeTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  upgradeBody: {
    fontSize: Typography.body,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.base,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    height: TAP_TARGET + 8,
    paddingHorizontal: Spacing.xxl,
    marginTop: Spacing.sm,
  },
  upgradeButtonText: {
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    color: Colors.textInverse,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
  },
  emptyBody: {
    fontSize: Typography.body,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
    minHeight: 52,
  },
  dateText: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    width: 52,
    flexShrink: 0,
  },
  mealColumn: {
    flex: 1,
  },
  mealLine: {
    fontSize: Typography.sm,
    lineHeight: 20,
  },
  originalMeal: {
    color: Colors.textSecondary,
  },
  arrow: {
    color: Colors.textMuted,
  },
  convertedMeal: {
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  dietBadge: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dietEmoji: { fontSize: 16 },
  trashButton: {
    width: TAP_TARGET,
    height: TAP_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedWrapper: {
    marginBottom: Spacing.sm,
  },
  collapseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: -Spacing.sm,
  },
  collapseText: {
    fontSize: Typography.sm,
    color: Colors.primary,
    fontWeight: Typography.medium,
  },
});
