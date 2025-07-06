#!/usr/bin/env node

import Database from 'better-sqlite3';

const sqlite = new Database('database.sqlite');

// Drop and recreate sessions table with correct schema
console.log('🔧 Fixing sessions table schema...');

sqlite.exec(`
  DROP TABLE IF EXISTS sessions;
  
  CREATE TABLE sessions (
    sid TEXT PRIMARY KEY,
    sess TEXT NOT NULL,
    expired INTEGER NOT NULL
  );
`);

console.log('✅ Sessions table fixed');
sqlite.close();