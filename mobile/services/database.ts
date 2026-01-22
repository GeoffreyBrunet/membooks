/**
 * Database Service
 * SQLite database for persistent storage
 * Compatible with iOS and Android via expo-sqlite
 */

import * as SQLite from 'expo-sqlite';
import type { Book, Series, BookType, BookCategory } from '@/types/book';

const DATABASE_NAME = 'membooks.db';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Initialize the database connection
 */
export async function initDatabase(): Promise<void> {
  if (db) return;

  db = await SQLite.openDatabaseAsync(DATABASE_NAME);

  // Create tables
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS series (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      author TEXT NOT NULL,
      totalVolumes INTEGER NOT NULL,
      bookType TEXT NOT NULL,
      categories TEXT NOT NULL,
      createdAt INTEGER DEFAULT (strftime('%s', 'now')),
      updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      bookType TEXT NOT NULL,
      categories TEXT NOT NULL,
      isRead INTEGER NOT NULL DEFAULT 0,
      inWishlist INTEGER NOT NULL DEFAULT 0,
      seriesId TEXT,
      volumeNumber INTEGER,
      createdAt INTEGER DEFAULT (strftime('%s', 'now')),
      updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (seriesId) REFERENCES series(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_books_seriesId ON books(seriesId);
    CREATE INDEX IF NOT EXISTS idx_books_isRead ON books(isRead);
  `);

  // Run migrations for existing databases
  await runMigrations(db);
}

/**
 * Run database migrations for schema updates
 */
async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  // Check if inWishlist column exists
  const tableInfo = await database.getAllAsync<{ name: string }>(
    "PRAGMA table_info(books)"
  );
  const hasInWishlist = tableInfo.some((col) => col.name === 'inWishlist');

  if (!hasInWishlist) {
    // Add inWishlist column with default value 0 (not in wishlist)
    await database.execAsync(`
      ALTER TABLE books ADD COLUMN inWishlist INTEGER NOT NULL DEFAULT 0;
      CREATE INDEX IF NOT EXISTS idx_books_inWishlist ON books(inWishlist);
    `);
  }
}

/**
 * Get database instance
 */
function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

// ============ BOOKS ============

/**
 * Get all books
 */
export async function getAllBooks(): Promise<Book[]> {
  const database = getDb();
  const rows = await database.getAllAsync<{
    id: string;
    title: string;
    author: string;
    bookType: string;
    categories: string;
    isRead: number;
    inWishlist: number;
    seriesId: string | null;
    volumeNumber: number | null;
  }>('SELECT * FROM books ORDER BY title');

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    author: row.author,
    bookType: row.bookType as BookType,
    categories: JSON.parse(row.categories) as BookCategory[],
    isRead: row.isRead === 1,
    inWishlist: row.inWishlist === 1,
    seriesId: row.seriesId ?? undefined,
    volumeNumber: row.volumeNumber ?? undefined,
  }));
}

/**
 * Get a book by ID
 */
export async function getBookById(id: string): Promise<Book | null> {
  const database = getDb();
  const row = await database.getFirstAsync<{
    id: string;
    title: string;
    author: string;
    bookType: string;
    categories: string;
    isRead: number;
    inWishlist: number;
    seriesId: string | null;
    volumeNumber: number | null;
  }>('SELECT * FROM books WHERE id = ?', [id]);

  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    author: row.author,
    bookType: row.bookType as BookType,
    categories: JSON.parse(row.categories) as BookCategory[],
    isRead: row.isRead === 1,
    inWishlist: row.inWishlist === 1,
    seriesId: row.seriesId ?? undefined,
    volumeNumber: row.volumeNumber ?? undefined,
  };
}

/**
 * Insert a new book
 */
export async function insertBook(book: Book): Promise<void> {
  const database = getDb();
  await database.runAsync(
    `INSERT INTO books (id, title, author, bookType, categories, isRead, inWishlist, seriesId, volumeNumber)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      book.id,
      book.title,
      book.author,
      book.bookType,
      JSON.stringify(book.categories),
      book.isRead ? 1 : 0,
      book.inWishlist ? 1 : 0,
      book.seriesId ?? null,
      book.volumeNumber ?? null,
    ]
  );
}

/**
 * Update a book
 */
export async function updateBook(id: string, updates: Partial<Book>): Promise<void> {
  const database = getDb();

  const setClauses: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.title !== undefined) {
    setClauses.push('title = ?');
    values.push(updates.title);
  }
  if (updates.author !== undefined) {
    setClauses.push('author = ?');
    values.push(updates.author);
  }
  if (updates.bookType !== undefined) {
    setClauses.push('bookType = ?');
    values.push(updates.bookType);
  }
  if (updates.categories !== undefined) {
    setClauses.push('categories = ?');
    values.push(JSON.stringify(updates.categories));
  }
  if (updates.isRead !== undefined) {
    setClauses.push('isRead = ?');
    values.push(updates.isRead ? 1 : 0);
  }
  if (updates.inWishlist !== undefined) {
    setClauses.push('inWishlist = ?');
    values.push(updates.inWishlist ? 1 : 0);
  }
  if (updates.seriesId !== undefined) {
    setClauses.push('seriesId = ?');
    values.push(updates.seriesId ?? null);
  }
  if (updates.volumeNumber !== undefined) {
    setClauses.push('volumeNumber = ?');
    values.push(updates.volumeNumber ?? null);
  }

  if (setClauses.length === 0) return;

  setClauses.push("updatedAt = strftime('%s', 'now')");
  values.push(id);

  await database.runAsync(
    `UPDATE books SET ${setClauses.join(', ')} WHERE id = ?`,
    values
  );
}

/**
 * Delete a book
 */
export async function deleteBook(id: string): Promise<void> {
  const database = getDb();
  await database.runAsync('DELETE FROM books WHERE id = ?', [id]);
}

/**
 * Check if a book exists
 */
export async function bookExists(id: string): Promise<boolean> {
  const database = getDb();
  const row = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM books WHERE id = ?',
    [id]
  );
  return (row?.count ?? 0) > 0;
}

// ============ SERIES ============

/**
 * Get all series
 */
export async function getAllSeries(): Promise<Series[]> {
  const database = getDb();
  const rows = await database.getAllAsync<{
    id: string;
    name: string;
    author: string;
    totalVolumes: number;
    bookType: string;
    categories: string;
  }>('SELECT * FROM series ORDER BY name');

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    author: row.author,
    totalVolumes: row.totalVolumes,
    bookType: row.bookType as BookType,
    categories: JSON.parse(row.categories) as BookCategory[],
  }));
}

/**
 * Get a series by ID
 */
export async function getSeriesById(id: string): Promise<Series | null> {
  const database = getDb();
  const row = await database.getFirstAsync<{
    id: string;
    name: string;
    author: string;
    totalVolumes: number;
    bookType: string;
    categories: string;
  }>('SELECT * FROM series WHERE id = ?', [id]);

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    author: row.author,
    totalVolumes: row.totalVolumes,
    bookType: row.bookType as BookType,
    categories: JSON.parse(row.categories) as BookCategory[],
  };
}

/**
 * Insert a new series
 */
export async function insertSeries(series: Series): Promise<void> {
  const database = getDb();
  await database.runAsync(
    `INSERT INTO series (id, name, author, totalVolumes, bookType, categories)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      series.id,
      series.name,
      series.author,
      series.totalVolumes,
      series.bookType,
      JSON.stringify(series.categories),
    ]
  );
}

/**
 * Update a series
 */
export async function updateSeries(id: string, updates: Partial<Series>): Promise<void> {
  const database = getDb();

  const setClauses: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.name !== undefined) {
    setClauses.push('name = ?');
    values.push(updates.name);
  }
  if (updates.author !== undefined) {
    setClauses.push('author = ?');
    values.push(updates.author);
  }
  if (updates.totalVolumes !== undefined) {
    setClauses.push('totalVolumes = ?');
    values.push(updates.totalVolumes);
  }
  if (updates.bookType !== undefined) {
    setClauses.push('bookType = ?');
    values.push(updates.bookType);
  }
  if (updates.categories !== undefined) {
    setClauses.push('categories = ?');
    values.push(JSON.stringify(updates.categories));
  }

  if (setClauses.length === 0) return;

  setClauses.push("updatedAt = strftime('%s', 'now')");
  values.push(id);

  await database.runAsync(
    `UPDATE series SET ${setClauses.join(', ')} WHERE id = ?`,
    values
  );
}

/**
 * Delete a series
 */
export async function deleteSeries(id: string): Promise<void> {
  const database = getDb();
  await database.runAsync('DELETE FROM series WHERE id = ?', [id]);
}

/**
 * Check if a series exists
 */
export async function seriesExists(id: string): Promise<boolean> {
  const database = getDb();
  const row = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM series WHERE id = ?',
    [id]
  );
  return (row?.count ?? 0) > 0;
}

// ============ SEEDING ============

/**
 * Seed database with initial mock data (only if empty)
 */
export async function seedDatabaseIfEmpty(): Promise<void> {
  const database = getDb();

  // Check if we already have data
  const bookCount = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM books'
  );

  if ((bookCount?.count ?? 0) > 0) {
    return; // Already seeded
  }

  // Import mock data
  const { mockBooks, mockSeries } = await import('@/data/mock-books');

  // Insert series first
  for (const series of mockSeries) {
    await insertSeries(series);
  }

  // Insert books
  for (const book of mockBooks) {
    await insertBook(book);
  }
}
