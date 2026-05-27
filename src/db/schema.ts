import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('platerotate.db');
  await initSchema(db);
  return db;
}

async function initSchema(database: SQLite.SQLiteDatabase): Promise<void> {
  // WAL pragma MUST run alone before any DDL — see STANDARDS.md pitfall note
  await database.execAsync('PRAGMA journal_mode = WAL;');

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      id      INTEGER PRIMARY KEY CHECK (id = 1),
      onboarding_complete INTEGER NOT NULL DEFAULT 0,
      diet_id TEXT,
      allergens TEXT NOT NULL DEFAULT '[]',
      free_conversions_used INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      original_meal  TEXT NOT NULL,
      converted_meal TEXT NOT NULL,
      diet_id        TEXT NOT NULL,
      created_at     INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS history (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      original_meal  TEXT NOT NULL,
      converted_meal TEXT NOT NULL,
      diet_id        TEXT NOT NULL,
      created_at     INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS meal_plans (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_data  TEXT NOT NULL,
      diet_id    TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  // Ensure the single settings row always exists
  await database.execAsync(`
    INSERT OR IGNORE INTO settings (id, onboarding_complete, allergens, free_conversions_used)
    VALUES (1, 0, '[]', 0);
  `);

  // Migration: add subscription_override column if it doesn't exist yet
  // This lets Kevin bypass the paywall during testing without clearing the database
  try {
    await database.execAsync(
      'ALTER TABLE settings ADD COLUMN subscription_override INTEGER NOT NULL DEFAULT 0;'
    );
  } catch {
    // Column already exists — safe to ignore
  }
}
