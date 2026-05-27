import { getDb } from './schema';
import { Favorite, DietId, ConversionResult } from '../types';

export async function saveFavorite(
  originalMeal: string,
  result: ConversionResult
): Promise<number> {
  const db = await getDb();
  const res = await db.runAsync(
    'INSERT INTO favorites (original_meal, converted_meal, diet_id, created_at) VALUES (?, ?, ?, ?);',
    [originalMeal, JSON.stringify(result), result.dietId, Date.now()]
  );
  return res.lastInsertRowId;
}

export async function getFavorites(): Promise<Favorite[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: number;
    original_meal: string;
    converted_meal: string;
    diet_id: string;
    created_at: number;
  }>('SELECT * FROM favorites ORDER BY created_at DESC;');

  return rows.map((r) => ({
    id: r.id,
    originalMeal: r.original_meal,
    convertedMeal: r.converted_meal,
    dietId: r.diet_id as DietId,
    createdAt: r.created_at,
  }));
}

export async function deleteFavorite(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM favorites WHERE id = ?;', [id]);
}

// Check if an exact meal+diet combo is already favorited
export async function isFavorited(originalMeal: string, dietId: DietId): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM favorites WHERE original_meal = ? AND diet_id = ? LIMIT 1;',
    [originalMeal, dietId]
  );
  return row != null;
}
