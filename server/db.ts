import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '@shared/schema';

// Create SQLite database connection
const sqlite = new Database('database.sqlite');

// Enable foreign keys
sqlite.pragma('foreign_keys = ON');

// Create Drizzle database instance
export const db = drizzle(sqlite, { schema });

console.log('🔗 SQLite database connected successfully');