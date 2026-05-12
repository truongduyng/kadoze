import { storage } from '@/lib/storage';
import { expoDb } from './database';

let initializationPromise: Promise<void> | null = null;

export async function resetDatabase() {
  try {
    const tables = ['habit_completions', 'habits', 'daily_focus', 'notes', 'profiles', 'todos'];
    for (const table of tables) {
      await expoDb.execAsync(`DROP TABLE IF EXISTS ${table};`);
    }
    storage.clearAll();
    initializationPromise = null;
    await ensureDatabaseInitialized();
  } catch (error) {
    console.error('Failed to reset database:', error);
    throw error;
  }
}

export async function initializeDatabase() {
  try {
    expoDb.execSync(`
      CREATE TABLE IF NOT EXISTS profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        name TEXT,
        timezone TEXT,
        onboarding_completed INTEGER NOT NULL DEFAULT 0,
        push_token TEXT,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      );
    `);

    expoDb.execSync(`
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        content TEXT NOT NULL,
        media_url TEXT,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      );
    `);

    expoDb.execSync(`
      CREATE TABLE IF NOT EXISTS habits (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        title TEXT NOT NULL,
        subtitle TEXT,
        icon TEXT,
        days_of_week TEXT NOT NULL DEFAULT '[]',
        is_locked INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      );
    `);

    expoDb.execSync(`
      CREATE TABLE IF NOT EXISTS habit_completions (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        habit_id INTEGER NOT NULL REFERENCES habits(id),
        date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'done',
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        UNIQUE(habit_id, date)
      );
    `);

    expoDb.execSync(`
      CREATE TABLE IF NOT EXISTS daily_focus (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        date TEXT NOT NULL UNIQUE,
        goal TEXT NOT NULL DEFAULT '',
        completed_at INTEGER,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      );
    `);

    expoDb.execSync(`
      CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        date TEXT NOT NULL,
        title TEXT NOT NULL,
        done INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      );
    `);
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export function ensureDatabaseInitialized() {
  if (!initializationPromise) {
    initializationPromise = initializeDatabase();
  }

  return initializationPromise;
}
