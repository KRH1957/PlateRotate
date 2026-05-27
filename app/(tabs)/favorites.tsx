import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getFavorites, deleteFavorite } from '../../src/db/favoritesDb';
import { Favorite, ConversionResult } from '../../src/types';
import { DIETS } from '../../src/constants/diets';
import ConversionResultCard from '../../src/components/ConversionResultCard';
import { Colors, Typography, Spacing, Radius, TAP_TARGET } from '../../src/theme';

type ParsedFavorite = Omit<Favorite, 'convertedMeal'> & { result: ConversionResult };

function formatDate(ts: number): string {
  const diffDays = Math.floor((Date.now() - ts) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<ParsedFavorite[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      getFavorites().then((rows) => {
        const parsed: ParsedFavorite[] = [];
        for (const fav of rows) {
          try {
            parsed.push({
              id: fav.id,
              originalMeal: fav.originalMeal,
              dietId: fav.dietId,
              createdAt: fav.createdAt,
              result: JSON.parse(fav.convertedMeal) as ConversionResult,
            });
          } catch {
            // Skip rows with corrupted JSON — don't crash the screen
          }
        }
        setFavorites(parsed);
      });
    }, [])
  );

  function confirmDelete(fav: ParsedFavorite) {
    Alert.alert(
      'Remove favorite?',
      `Remove "${fav.result.convertedMeal}" from your favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await deleteFavorite(fav.id);
            setFavorites((prev) => prev.filter((f) => f.id !== fav.id));
            if (expandedId === fav.id) setExpandedId(null);
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Favorites</Text>
        <Text style={styles.subtitle}>Conversions you've saved for quick reuse</Text>

        {favorites.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={64} color={Colors.border} />
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptyBody}>
              After converting a meal, tap the heart icon to save it here.
            </Text>
          </View>
        ) : (
          favorites.map((fav) => {
            const diet = DIETS.find((d) => d.id === fav.dietId);
            const expanded = expandedId === fav.id;

            if (expanded) {
              return (
                <View key={fav.id} style={styles.expandedWrapper}>
                  <ConversionResultCard
                    result={fav.result}
                    isFavorited={true}
                    onToggleFavorite={() => confirmDelete(fav)}
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
                key={fav.id}
                style={styles.card}
                onPress={() => setExpandedId(fav.id)}
                onLongPress={() => confirmDelete(fav)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`${fav.originalMeal} converted to ${fav.result.convertedMeal}. Tap to expand.`}
              >
                <View style={styles.cardTop}>
                  <View style={styles.dietBadge}>
                    <Text style={styles.dietEmoji}>{diet?.emoji ?? '🍽️'}</Text>
                    <Text style={styles.dietLabel}>{diet?.label ?? fav.dietId}</Text>
                  </View>
                  <Text style={styles.dateText}>{formatDate(fav.createdAt)}</Text>
                </View>

                <View style={styles.mealRow}>
                  <View style={styles.mealNames}>
                    <Text style={styles.originalMeal} numberOfLines={1}>
                      {fav.originalMeal}
                    </Text>
                    <Ionicons name="arrow-forward" size={14} color={Colors.textMuted} />
                    <Text style={styles.convertedMeal} numberOfLines={1}>
                      {fav.result.convertedMeal}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.trashButton}
                    onPress={() => confirmDelete(fav)}
                    accessibilityRole="button"
                    accessibilityLabel="Remove from favorites"
                  >
                    <Ionicons name="trash-outline" size={20} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
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
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  dietBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  dietEmoji: { fontSize: 13 },
  dietLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.primary,
  },
  dateText: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  mealNames: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  originalMeal: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    flexShrink: 1,
  },
  convertedMeal: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    flexShrink: 1,
  },
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
