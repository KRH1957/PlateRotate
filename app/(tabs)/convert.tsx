import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getSettings, getFreeConversionsUsed, incrementFreeConversions, getSubscriptionOverride } from '../../src/db/settingsDb';
import { saveToHistory } from '../../src/db/historyDb';
import { saveFavorite, deleteFavorite } from '../../src/db/favoritesDb';
import { claudeHaikuConversion } from '../../src/modules/conversion/claudeHaiku';
import { DIETS, ALLERGENS } from '../../src/constants/diets';
import { DietId, AllergenId, ConversionResult } from '../../src/types';
import ConversionResultCard from '../../src/components/ConversionResultCard';
import { Colors, Typography, Spacing, Radius, TAP_TARGET } from '../../src/theme';

const FREE_TIER_LIMIT = 5;

type ScreenState = 'idle' | 'loading' | 'result' | 'error';

export default function ConvertScreen() {
  const [dietId, setDietId] = useState<DietId | null>(null);
  const [dietLabel, setDietLabel] = useState('');
  const [allergens, setAllergens] = useState<AllergenId[]>([]);
  const [mealInput, setMealInput] = useState('');
  const [screenState, setScreenState] = useState<ScreenState>('idle');
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [freeUsed, setFreeUsed] = useState(0);
  const [hasOverride, setHasOverride] = useState(false);
  const [favoriteId, setFavoriteId] = useState<number | null>(null);

  // Reload settings whenever this screen comes into focus (user may have changed diet in Settings)
  useFocusEffect(
    useCallback(() => {
      async function load() {
        const [settings, used, override] = await Promise.all([
          getSettings(),
          getFreeConversionsUsed(),
          getSubscriptionOverride(),
        ]);
        if (settings.dietId) {
          setDietId(settings.dietId);
          setDietLabel(DIETS.find((d) => d.id === settings.dietId)?.label ?? '');
        }
        setAllergens(settings.allergens);
        setFreeUsed(used);
        setHasOverride(override);
      }
      load();
    }, [])
  );

  async function handleConvert() {
    const trimmed = mealInput.trim();
    if (!trimmed) return;
    if (!dietId) {
      Alert.alert('No diet selected', 'Go to Settings and pick a diet first.');
      return;
    }

    // Free tier gate — skip if subscription override is active
    if (!hasOverride && freeUsed >= FREE_TIER_LIMIT) {
      router.push('/upgrade');
      return;
    }

    setScreenState('loading');
    setResult(null);
    setFavoriteId(null);
    setErrorMessage('');

    try {
      const allergenLabels = allergens.map(
        (id) => ALLERGENS.find((a) => a.id === id)?.label ?? id
      );

      const converted = await claudeHaikuConversion.convertMeal({
        originalMeal: trimmed,
        dietId,
        dietLabel,
        allergens,
        allergenLabels,
      });

      // Save to history and increment counter in parallel
      await Promise.all([
        saveToHistory(trimmed, converted),
        hasOverride ? Promise.resolve() : incrementFreeConversions(),
      ]);

      if (!hasOverride) setFreeUsed((n) => n + 1);

      setResult(converted);
      setScreenState('result');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setErrorMessage(msg);
      setScreenState('error');
    }
  }

  async function handleToggleFavorite() {
    if (!result) return;

    if (favoriteId !== null) {
      // Already favorited — remove it
      await deleteFavorite(favoriteId);
      setFavoriteId(null);
    } else {
      const newId = await saveFavorite(result.originalMeal, result);
      setFavoriteId(newId);
    }
  }

  function handleNewConversion() {
    setMealInput('');
    setResult(null);
    setFavoriteId(null);
    setErrorMessage('');
    setScreenState('idle');
  }

  const freeLimitReached = !hasOverride && freeUsed >= FREE_TIER_LIMIT;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.appName}>PlateRotate</Text>
            <View style={styles.headerRight}>
              {dietLabel ? (
                <TouchableOpacity
                  style={styles.dietBadge}
                  onPress={() => router.push('/(tabs)/settings')}
                  accessibilityRole="button"
                  accessibilityLabel={`Current diet: ${dietLabel}. Tap to change.`}
                >
                  <Text style={styles.dietBadgeText}>{dietLabel}</Text>
                  <Ionicons name="chevron-down" size={14} color={Colors.primary} />
                </TouchableOpacity>
              ) : null}
              {!hasOverride && (
                <Text style={styles.freeCount}>
                  {Math.max(0, FREE_TIER_LIMIT - freeUsed)} free left
                </Text>
              )}
            </View>
          </View>

          {/* Confirmation banner */}
          {dietLabel && screenState === 'idle' ? (
            <View style={styles.confirmBanner}>
              <Text style={styles.confirmText}>
                Got it. Converting to{' '}
                <Text style={styles.confirmDiet}>{dietLabel}</Text>?
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/settings')}
                accessibilityRole="button"
              >
                <Text style={styles.changeLink}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Input area — hidden while showing result */}
          {screenState !== 'result' && (
            <>
              <View style={styles.inputCard}>
                <Text style={styles.inputLabel}>What did you eat?</Text>
                <TextInput
                  style={styles.input}
                  value={mealInput}
                  onChangeText={setMealInput}
                  placeholder="e.g. Spaghetti bolognese with garlic bread"
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  numberOfLines={3}
                  returnKeyType="done"
                  editable={screenState === 'idle' || screenState === 'error'}
                  accessibilityLabel="Meal description input"
                />
              </View>

              {/* Mic button — keyboard mic instruction for v1 */}
              <TouchableOpacity
                style={styles.micButton}
                onPress={() =>
                  Alert.alert(
                    'Voice input',
                    'Tap the microphone button on your device keyboard to speak your meal, then tap Convert.',
                    [{ text: 'Got it' }]
                  )
                }
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Voice input instructions"
              >
                <Ionicons name="mic" size={28} color={Colors.textInverse} />
                <Text style={styles.micLabel}>Speak Your Meal</Text>
              </TouchableOpacity>

              {/* Convert button */}
              <TouchableOpacity
                style={[
                  styles.convertButton,
                  (!mealInput.trim() || screenState === 'loading') && styles.convertButtonDisabled,
                  freeLimitReached && styles.convertButtonLocked,
                ]}
                disabled={!mealInput.trim() || screenState === 'loading'}
                onPress={handleConvert}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={freeLimitReached ? 'Upgrade to convert' : 'Convert this meal'}
              >
                {screenState === 'loading' ? (
                  <ActivityIndicator size="small" color={Colors.textInverse} />
                ) : (
                  <>
                    <Ionicons
                      name={freeLimitReached ? 'lock-closed' : 'swap-horizontal'}
                      size={22}
                      color={mealInput.trim() ? Colors.textInverse : Colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.convertButtonText,
                        !mealInput.trim() && styles.convertButtonTextDisabled,
                      ]}
                    >
                      {freeLimitReached ? 'Upgrade to Convert' : 'Convert'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Error message */}
              {screenState === 'error' && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={20} color={Colors.error} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}
            </>
          )}

          {/* Result card */}
          {screenState === 'result' && result ? (
            <>
              <ConversionResultCard
                result={result}
                isFavorited={favoriteId !== null}
                onToggleFavorite={handleToggleFavorite}
              />

              <TouchableOpacity
                style={styles.newConversionButton}
                onPress={handleNewConversion}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Convert another meal"
              >
                <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
                <Text style={styles.newConversionText}>Convert Another Meal</Text>
              </TouchableOpacity>
            </>
          ) : null}

          {/* Pro plan teaser — always visible at bottom */}
          {screenState !== 'loading' && (
            <TouchableOpacity
              style={styles.planTeaser}
              onPress={() => router.push('/plan')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Get a 7-day meal plan — Pro feature"
            >
              <Ionicons name="calendar" size={20} color={Colors.primary} />
              <View style={styles.planTeaserText}>
                <Text style={styles.planTeaserTitle}>7-Day Meal Plan</Text>
                <Text style={styles.planTeaserSub}>Pro · $5.99/month</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.accent} />
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.base,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  appName: {
    fontSize: Typography.xl,
    fontWeight: Typography.extrabold,
    color: Colors.primary,
    letterSpacing: -0.3,
  },
  dietBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  dietBadgeText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.primary,
  },
  freeCount: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    fontWeight: Typography.medium,
  },
  confirmBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.accent,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.base,
  },
  confirmText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  confirmDiet: {
    fontWeight: Typography.semibold,
    color: Colors.primary,
  },
  changeLink: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.primary,
    marginLeft: Spacing.sm,
  },
  inputCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  inputLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    fontSize: Typography.body,
    color: Colors.textPrimary,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  micButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
    height: TAP_TARGET + 8,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  micLabel: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    color: Colors.textInverse,
  },
  convertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    height: TAP_TARGET + 12,
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  convertButtonDisabled: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  convertButtonLocked: {
    backgroundColor: Colors.warning,
    borderWidth: 0,
  },
  convertButtonText: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textInverse,
  },
  convertButtonTextDisabled: {
    color: Colors.textMuted,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.errorLight,
    borderRadius: Radius.md,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  errorText: {
    fontSize: Typography.body,
    color: Colors.error,
    flex: 1,
    lineHeight: 22,
  },
  newConversionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    height: TAP_TARGET + 8,
    marginBottom: Spacing.base,
  },
  newConversionText: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    color: Colors.primary,
  },
  planTeaser: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
    marginTop: Spacing.base,
    gap: Spacing.md,
  },
  planTeaserText: { flex: 1 },
  planTeaserTitle: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  planTeaserSub: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
