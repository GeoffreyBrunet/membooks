import { describe, it, expect, beforeEach, mock } from 'bun:test';

// Create controllable mock functions
const mockExecAsync = mock();
const mockGetAllAsync = mock(() => Promise.resolve([]));
const mockGetFirstAsync = mock(() => Promise.resolve(null));
const mockRunAsync = mock();

const mockDb = {
  execAsync: mockExecAsync,
  getAllAsync: mockGetAllAsync,
  getFirstAsync: mockGetFirstAsync,
  runAsync: mockRunAsync,
};

// Override the global expo-sqlite mock with our controllable one
mock.module('expo-sqlite', () => ({
  openDatabaseAsync: mock(() => Promise.resolve(mockDb)),
}));

// Also mock the database module itself to force re-evaluation with our mock
// This is needed because bun caches modules across test files
mock.module('@/services/database', () => {
  // Force re-import of the real module with our mocked expo-sqlite
  return require('../../services/database');
});

// Import after mocking
import {
  initDatabase,
  getAllBooks,
  getBookById,
  insertBook,
  updateBook,
  deleteBook,
  bookExists,
  getAllSeries,
  getSeriesById,
  insertSeries,
  updateSeries,
  deleteSeries,
  seriesExists,
} from '@/services/database';

// Track if we've initialized in this test run
let initialized = false;

async function ensureInit() {
  if (!initialized) {
    mockGetAllAsync.mockResolvedValueOnce([
      { name: 'id' },
      { name: 'inWishlist' },
      { name: 'releaseDate' },
    ]);
    await initDatabase();
    initialized = true;
  }
}

beforeEach(() => {
  mockExecAsync.mockClear();
  mockGetAllAsync.mockClear().mockResolvedValue([]);
  mockGetFirstAsync.mockClear().mockResolvedValue(null);
  mockRunAsync.mockClear();
});

describe('initDatabase', () => {
  it('creates tables and runs migrations', async () => {
    mockGetAllAsync.mockResolvedValueOnce([
      { name: 'id' },
      { name: 'inWishlist' },
      { name: 'releaseDate' },
    ]);

    await initDatabase();
    initialized = true;

    expect(mockExecAsync).toHaveBeenCalled();
    const createCall = mockExecAsync.mock.calls[0][0];
    expect(createCall).toContain('CREATE TABLE IF NOT EXISTS series');
    expect(createCall).toContain('CREATE TABLE IF NOT EXISTS books');
    expect(createCall).toContain('PRAGMA journal_mode = WAL');
  });

  it('does not re-initialize if already initialized', async () => {
    await ensureInit();
    const callCount = mockExecAsync.mock.calls.length;

    await initDatabase();

    // Should not have added more calls
    expect(mockExecAsync.mock.calls.length).toBe(callCount);
  });
});

describe('getAllBooks', () => {
  it('returns empty array when no books', async () => {
    await ensureInit();
    mockGetAllAsync.mockResolvedValueOnce([]);
    const books = await getAllBooks();
    expect(books).toEqual([]);
  });

  it('converts database rows to Book objects', async () => {
    await ensureInit();
    mockGetAllAsync.mockResolvedValueOnce([
      {
        id: 'book-1',
        title: 'Dune',
        author: 'Frank Herbert',
        bookType: 'novel',
        categories: '["sf"]',
        isRead: 1,
        inWishlist: 0,
        seriesId: null,
        volumeNumber: null,
        releaseDate: null,
      },
    ]);

    const books = await getAllBooks();

    expect(books).toEqual([
      {
        id: 'book-1',
        title: 'Dune',
        author: 'Frank Herbert',
        bookType: 'novel',
        categories: ['sf'],
        isRead: true,
        inWishlist: false,
        seriesId: undefined,
        volumeNumber: undefined,
        releaseDate: undefined,
      },
    ]);
  });

  it('converts isRead 0 to false and inWishlist 1 to true', async () => {
    await ensureInit();
    mockGetAllAsync.mockResolvedValueOnce([
      {
        id: 'b1',
        title: 'T',
        author: 'A',
        bookType: 'novel',
        categories: '[]',
        isRead: 0,
        inWishlist: 1,
        seriesId: 's1',
        volumeNumber: 1,
        releaseDate: '2025-01-01',
      },
    ]);

    const books = await getAllBooks();
    expect(books[0].isRead).toBe(false);
    expect(books[0].inWishlist).toBe(true);
    expect(books[0].seriesId).toBe('s1');
    expect(books[0].volumeNumber).toBe(1);
    expect(books[0].releaseDate).toBe('2025-01-01');
  });
});

describe('getBookById', () => {
  it('returns null when book not found', async () => {
    await ensureInit();
    mockGetFirstAsync.mockResolvedValueOnce(null);
    const book = await getBookById('nonexistent');
    expect(book).toBeNull();
  });

  it('returns converted Book object', async () => {
    await ensureInit();
    mockGetFirstAsync.mockResolvedValueOnce({
      id: 'book-1',
      title: 'Dune',
      author: 'Frank Herbert',
      bookType: 'novel',
      categories: '["sf"]',
      isRead: 1,
      inWishlist: 0,
      seriesId: null,
      volumeNumber: null,
      releaseDate: null,
    });

    const book = await getBookById('book-1');
    expect(book?.title).toBe('Dune');
    expect(book?.isRead).toBe(true);
    expect(book?.categories).toEqual(['sf']);
  });
});

describe('insertBook', () => {
  it('inserts book with correct values', async () => {
    await ensureInit();
    await insertBook({
      id: 'book-new',
      title: 'New Book',
      author: 'Author',
      bookType: 'novel',
      categories: ['sf', 'adventure'],
      isRead: false,
      inWishlist: true,
      seriesId: 'series-1',
      volumeNumber: 3,
      releaseDate: '2025-06-01',
    });

    expect(mockRunAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO books'),
      [
        'book-new',
        'New Book',
        'Author',
        'novel',
        '["sf","adventure"]',
        0,
        1,
        'series-1',
        3,
        '2025-06-01',
      ]
    );
  });

  it('inserts book with null optional fields', async () => {
    await ensureInit();
    await insertBook({
      id: 'book-simple',
      title: 'Simple',
      author: 'Author',
      bookType: 'novel',
      categories: ['sliceOfLife'],
      isRead: true,
      inWishlist: false,
    });

    expect(mockRunAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO books'),
      ['book-simple', 'Simple', 'Author', 'novel', '["sliceOfLife"]', 1, 0, null, null, null]
    );
  });
});

describe('updateBook', () => {
  it('updates specified fields only', async () => {
    await ensureInit();
    await updateBook('book-1', { isRead: true });

    expect(mockRunAsync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE books SET'),
      expect.arrayContaining([1, 'book-1'])
    );
  });

  it('does nothing when no updates provided', async () => {
    await ensureInit();
    await updateBook('book-1', {});
    expect(mockRunAsync).not.toHaveBeenCalled();
  });
});

describe('deleteBook', () => {
  it('deletes book by id', async () => {
    await ensureInit();
    await deleteBook('book-1');
    expect(mockRunAsync).toHaveBeenCalledWith(
      'DELETE FROM books WHERE id = ?',
      ['book-1']
    );
  });
});

describe('bookExists', () => {
  it('returns true when count > 0', async () => {
    await ensureInit();
    mockGetFirstAsync.mockResolvedValueOnce({ count: 1 });
    const exists = await bookExists('book-1');
    expect(exists).toBe(true);
  });

  it('returns false when count is 0', async () => {
    await ensureInit();
    mockGetFirstAsync.mockResolvedValueOnce({ count: 0 });
    const exists = await bookExists('nonexistent');
    expect(exists).toBe(false);
  });

  it('returns false when result is null', async () => {
    await ensureInit();
    mockGetFirstAsync.mockResolvedValueOnce(null);
    const exists = await bookExists('nonexistent');
    expect(exists).toBe(false);
  });
});

describe('Series CRUD', () => {
  it('getAllSeries returns converted series', async () => {
    await ensureInit();
    mockGetAllAsync.mockResolvedValueOnce([
      {
        id: 'series-1',
        name: 'Dune',
        author: 'Frank Herbert',
        totalVolumes: 6,
        bookType: 'novel',
        categories: '["sf"]',
      },
    ]);

    const series = await getAllSeries();
    expect(series).toEqual([
      {
        id: 'series-1',
        name: 'Dune',
        author: 'Frank Herbert',
        totalVolumes: 6,
        bookType: 'novel',
        categories: ['sf'],
      },
    ]);
  });

  it('getSeriesById returns null when not found', async () => {
    await ensureInit();
    mockGetFirstAsync.mockResolvedValueOnce(null);
    const s = await getSeriesById('nonexistent');
    expect(s).toBeNull();
  });

  it('getSeriesById returns converted series', async () => {
    await ensureInit();
    mockGetFirstAsync.mockResolvedValueOnce({
      id: 'series-1',
      name: 'Dune',
      author: 'Frank Herbert',
      totalVolumes: 6,
      bookType: 'novel',
      categories: '["sf"]',
    });

    const s = await getSeriesById('series-1');
    expect(s?.name).toBe('Dune');
    expect(s?.categories).toEqual(['sf']);
  });

  it('insertSeries calls runAsync with correct params', async () => {
    await ensureInit();
    await insertSeries({
      id: 'series-new',
      name: 'New Series',
      author: 'Author',
      totalVolumes: 10,
      bookType: 'manga',
      categories: ['adventure', 'fantasy'],
    });

    expect(mockRunAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO series'),
      ['series-new', 'New Series', 'Author', 10, 'manga', '["adventure","fantasy"]']
    );
  });

  it('updateSeries updates specified fields', async () => {
    await ensureInit();
    await updateSeries('series-1', { totalVolumes: 7 });

    expect(mockRunAsync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE series SET'),
      expect.arrayContaining([7, 'series-1'])
    );
  });

  it('updateSeries does nothing with empty updates', async () => {
    await ensureInit();
    await updateSeries('series-1', {});
    expect(mockRunAsync).not.toHaveBeenCalled();
  });

  it('deleteSeries calls runAsync', async () => {
    await ensureInit();
    await deleteSeries('series-1');
    expect(mockRunAsync).toHaveBeenCalledWith(
      'DELETE FROM series WHERE id = ?',
      ['series-1']
    );
  });

  it('seriesExists returns true when count > 0', async () => {
    await ensureInit();
    mockGetFirstAsync.mockResolvedValueOnce({ count: 1 });
    const exists = await seriesExists('series-1');
    expect(exists).toBe(true);
  });

  it('seriesExists returns false when count is 0', async () => {
    await ensureInit();
    mockGetFirstAsync.mockResolvedValueOnce({ count: 0 });
    const exists = await seriesExists('nonexistent');
    expect(exists).toBe(false);
  });
});
