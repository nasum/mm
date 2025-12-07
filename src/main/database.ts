import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs-extra';

const DB_FILENAME = 'media_index.db';
let db: Database.Database;

export function initDatabase() {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, DB_FILENAME);
  
  // Ensure directory exists
  fs.ensureDirSync(userDataPath);

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  createTables();
}

function createTables() {
  const createMediaTable = `
    CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filepath TEXT UNIQUE NOT NULL,
      filename TEXT NOT NULL,
      type TEXT,
      size INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;
  db.exec(createMediaTable);
}

export function addMedia(filepath: string, filename: string, type: string, size: number) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO media (filepath, filename, type, size)
    VALUES (@filepath, @filename, @type, @size)
  `);
  return stmt.run({ filepath, filename, type, size });
}

export function removeMedia(filepath: string) {
  const stmt = db.prepare('DELETE FROM media WHERE filepath = ?');
  return stmt.run(filepath);
}

export function clearAllMedia() {
  const stmt = db.prepare('DELETE FROM media');
  return stmt.run();
}

export function getAllMedia() {
  const stmt = db.prepare('SELECT * FROM media ORDER BY created_at DESC');
  return stmt.all();
}

export function getMediaByPath(filepath: string) {
  const stmt = db.prepare('SELECT * FROM media WHERE filepath = ?');
  return stmt.get(filepath);
}
