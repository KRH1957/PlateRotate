import { getDb } from './schema';
import { DietId, AllergenId, UserSettings } from '../types';

export async function getSettings(): Promise<UserSettings> {
  const db = await getDb();
  const row = await db.getFirstAsync<{
    onboarding_complete: number;
    diet_id: string | null;
    allergens: string;
  }>('SELECT onboarding_complete, diet_id, allergens FROM settings WHERE id = 1;');

  if (!row) {
    return { onboardingComplete: false, dietId: null, allergens: [] };
  }

  return {
    onboardingComplete: row.onboarding_complete === 1,
    dietId: (row.diet_id as DietId) ?? null,
    allergens: JSON.parse(row.allergens) as AllergenId[],
  };
}

export async function setDiet(dietId: DietId): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE settings SET diet_id = ? WHERE id = 1;', [dietId]);
}

export async function setAllergens(allergens: AllergenId[]): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE settings SET allergens = ? WHERE id = 1;', [
    JSON.stringify(allergens),
  ]);
}

export async function completeOnboarding(dietId: DietId, allergens: AllergenId[]): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE settings SET onboarding_complete = 1, diet_id = ?, allergens = ? WHERE id = 1;',
    [dietId, JSON.stringify(allergens)]
  );
}

export async function getFreeConversionsUsed(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ free_conversions_used: number }>(
    'SELECT free_conversions_used FROM settings WHERE id = 1;'
  );
  return row?.free_conversions_used ?? 0;
}

export async function incrementFreeConversions(): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE settings SET free_conversions_used = free_conversions_used + 1 WHERE id = 1;'
  );
}

export async function getSubscriptionOverride(): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ subscription_override: number }>(
    'SELECT subscription_override FROM settings WHERE id = 1;'
  );
  return (row?.subscription_override ?? 0) === 1;
}

export async function setSubscriptionOverride(enabled: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE settings SET subscription_override = ? WHERE id = 1;', [
    enabled ? 1 : 0,
  ]);
}

export async function resetFreeConversions(): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE settings SET free_conversions_used = 0 WHERE id = 1;');
}
