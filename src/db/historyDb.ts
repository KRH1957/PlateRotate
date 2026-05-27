import { getDb } from './schema';
import { HistoryEntry, DietId, ConversionResult } from '../types';

export async function saveToHistory(
  originalMeal: string,
  result: ConversionResult
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO history (original_meal, converted_meal, diet_id, created_at) VALUES (?, ?, ?, ?);',
    [originalMeal, JSON.stringify(result), result.dietId, Date.now()]
  );
}

export async function getHistory(): Promise<HistoryEntry[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: number;
    original_meal: string;
    converted_meal: string;
    diet_id: string;
    created_at: number;
  }>('SELECT * FROM history ORDER BY created_at DESC LIMIT 100;');

  return rows.map((r) => ({
    id: r.id,
    originalMeal: r.original_meal,
    convertedMeal: r.converted_meal,
    dietId: r.diet_id as DietId,
    createdAt: r.created_at,
  }));
}

export async function deleteHistoryEntry(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM history WHERE id = ?;', [id]);
}
