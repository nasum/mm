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

  const createTagsTable = `
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;
  db.exec(createTagsTable);

  /* Existing table creation... */
  const createMediaTagsTable = `
    CREATE TABLE IF NOT EXISTS media_tags (
      media_id INTEGER,
      tag_id INTEGER,
      FOREIGN KEY(media_id) REFERENCES media(id) ON DELETE CASCADE,
      FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY(media_id, tag_id)
    );
  `;
  db.exec(createMediaTagsTable);

  // Add favorite column if it doesn't exist
  try {
    db.exec('ALTER TABLE media ADD COLUMN favorite INTEGER DEFAULT 0');
  } catch {
    // Column already exists, ignore
  }
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
  const query = `
    SELECT 
      m.*,
      GROUP_CONCAT(t.id) as tag_ids,
      GROUP_CONCAT(t.name) as tag_names
    FROM media m
    LEFT JOIN media_tags mt ON m.id = mt.media_id
    LEFT JOIN tags t ON mt.tag_id = t.id
    GROUP BY m.id
    ORDER BY m.created_at DESC
  `;
  const stmt = db.prepare(query);
  const rows = stmt.all();
  
  return rows.map((row: any) => {
    const tags: {id: number, name: string}[] = [];
    if (row.tag_ids) {
      const ids = row.tag_ids.split(',');
      const names = row.tag_names.split(',');
      for (let i = 0; i < ids.length; i++) {
        tags.push({ id: Number(ids[i]), name: names[i] });
      }
    }
    delete row.tag_ids;
    delete row.tag_names;
    return { ...row, tags };
  });
}

export function getMediaByPath(filepath: string) {
  const stmt = db.prepare('SELECT * FROM media WHERE filepath = ?');
  return stmt.get(filepath);
}

// Tag Operations

export function createTag(name: string) {
  const stmt = db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)');
  stmt.run(name);
  const getStmt = db.prepare('SELECT * FROM tags WHERE name = ?');
  return getStmt.get(name);
}

export function getAllTags() {
  const query = `
    SELECT t.*, COUNT(mt.media_id) as count
    FROM tags t
    LEFT JOIN media_tags mt ON t.id = mt.tag_id
    GROUP BY t.id
    ORDER BY t.name ASC
  `;
  const stmt = db.prepare(query);
  return stmt.all();
}

export function addTagToMedia(mediaId: number, tagId: number) {
  const stmt = db.prepare('INSERT OR IGNORE INTO media_tags (media_id, tag_id) VALUES (?, ?)');
  return stmt.run(mediaId, tagId);
}

export function removeTagFromMedia(mediaId: number, tagId: number) {
  const stmt = db.prepare('DELETE FROM media_tags WHERE media_id = ? AND tag_id = ?');
  return stmt.run(mediaId, tagId);
}

// Favorite Operations

export function toggleFavorite(mediaId: number) {
  const stmt = db.prepare('UPDATE media SET favorite = NOT favorite WHERE id = ?');
  stmt.run(mediaId);
  const getStmt = db.prepare('SELECT favorite FROM media WHERE id = ?');
  const row = getStmt.get(mediaId) as { favorite: number } | undefined;
  return row ? Boolean(row.favorite) : false;
}

export function getFavorites() {
  const query = `
    SELECT 
      m.*,
      GROUP_CONCAT(t.id) as tag_ids,
      GROUP_CONCAT(t.name) as tag_names
    FROM media m
    LEFT JOIN media_tags mt ON m.id = mt.media_id
    LEFT JOIN tags t ON mt.tag_id = t.id
    WHERE m.favorite = 1 AND m.type != 'directory'
    GROUP BY m.id
    ORDER BY m.created_at DESC
  `;
  const stmt = db.prepare(query);
  const rows = stmt.all();
  
  return rows.map((row: any) => {
    const tags: {id: number, name: string}[] = [];
    if (row.tag_ids) {
      const ids = row.tag_ids.split(',');
      const names = row.tag_names.split(',');
      for (let i = 0; i < ids.length; i++) {
        tags.push({ id: Number(ids[i]), name: names[i] });
      }
    }
    delete row.tag_ids;
    delete row.tag_names;
    return { ...row, favorite: Boolean(row.favorite), tags };
  });
}
