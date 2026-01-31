import { describe, it, expect, beforeEach, mock } from 'bun:test';
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import type { Book, Series } from '@/types/book';

// Create controllable mock functions BEFORE mock.module
const mockInitDatabase = mock(() => Promise.resolve(undefined));
const mockSeedDatabaseIfEmpty = mock(() => Promise.resolve(undefined));
const mockGetAllBooks = mock(() => Promise.resolve([] as Book[]));
const mockGetAllSeries = mock(() => Promise.resolve([] as Series[]));
const mockInsertBook = mock(() => Promise.resolve(undefined));
const mockInsertSeries = mock(() => Promise.resolve(undefined));
const mockUpdateBook = mock(() => Promise.resolve(undefined));
const mockDeleteBook = mock(() => Promise.resolve(undefined));
const mockBookExists = mock(() => Promise.resolve(false));
const mockSeriesExists = mock(() => Promise.resolve(false));

mock.module('@/services/database', () => ({
  initDatabase: mockInitDatabase,
  seedDatabaseIfEmpty: mockSeedDatabaseIfEmpty,
  getAllBooks: mockGetAllBooks,
  getAllSeries: mockGetAllSeries,
  insertBook: mockInsertBook,
  insertSeries: mockInsertSeries,
  updateBook: mockUpdateBook,
  deleteBook: mockDeleteBook,
  bookExists: mockBookExists,
  seriesExists: mockSeriesExists,
}));

// Use require (not import) to ensure books-context loads AFTER mock.module takes effect
const { BooksProvider, useBooks } = require('@/contexts/books-context');

const mockBook: Book = {
  id: 'book-1',
  title: 'Dune',
  author: 'Frank Herbert',
  bookType: 'novel',
  categories: ['sf'],
  isRead: true,
  inWishlist: false,
};

const mockWishlistBook: Book = {
  id: 'book-2',
  title: 'Fondation',
  author: 'Isaac Asimov',
  bookType: 'novel',
  categories: ['sf'],
  isRead: false,
  inWishlist: true,
};

const mockUpcomingBook: Book = {
  id: 'book-3',
  title: 'Upcoming Book',
  author: 'Author',
  bookType: 'novel',
  categories: ['sf'],
  isRead: false,
  inWishlist: true,
  releaseDate: '2099-12-31',
};

const mockSeries: Series = {
  id: 'series-1',
  name: 'Dune',
  author: 'Frank Herbert',
  totalVolumes: 6,
  bookType: 'novel',
  categories: ['sf'],
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BooksProvider>{children}</BooksProvider>
);

async function waitForLoaded(result: { current: { isLoading: boolean } }) {
  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  }, { timeout: 5000 });
}

beforeEach(() => {
  mockInitDatabase.mockClear().mockImplementation(() => Promise.resolve(undefined));
  mockSeedDatabaseIfEmpty.mockClear().mockImplementation(() => Promise.resolve(undefined));
  mockGetAllBooks.mockClear().mockImplementation(() => Promise.resolve([]));
  mockGetAllSeries.mockClear().mockImplementation(() => Promise.resolve([]));
  mockInsertBook.mockClear().mockImplementation(() => Promise.resolve(undefined));
  mockInsertSeries.mockClear().mockImplementation(() => Promise.resolve(undefined));
  mockUpdateBook.mockClear().mockImplementation(() => Promise.resolve(undefined));
  mockDeleteBook.mockClear().mockImplementation(() => Promise.resolve(undefined));
  mockBookExists.mockClear().mockImplementation(() => Promise.resolve(false));
  mockSeriesExists.mockClear().mockImplementation(() => Promise.resolve(false));
});

describe('BooksContext', () => {
  it('initializes database and loads data', async () => {
    mockGetAllBooks.mockImplementation(() => Promise.resolve([mockBook]));
    mockGetAllSeries.mockImplementation(() => Promise.resolve([mockSeries]));

    const { result } = renderHook(() => useBooks(), { wrapper });

    await waitForLoaded(result);

    expect(mockInitDatabase).toHaveBeenCalled();
    expect(mockSeedDatabaseIfEmpty).toHaveBeenCalled();
    expect(result.current.books).toHaveLength(1);
    expect(result.current.series).toHaveLength(1);
    expect(result.current.isLoading).toBe(false);
  });

  it('filters ownedBooks (not in wishlist)', async () => {
    mockGetAllBooks.mockImplementation(() =>
      Promise.resolve([mockBook, mockWishlistBook, mockUpcomingBook])
    );

    const { result } = renderHook(() => useBooks(), { wrapper });

    await waitForLoaded(result);

    expect(result.current.ownedBooks).toHaveLength(1);
    expect(result.current.ownedBooks[0].id).toBe('book-1');
  });

  it('filters wishlistBooks (in wishlist, no future release date)', async () => {
    mockGetAllBooks.mockImplementation(() =>
      Promise.resolve([mockBook, mockWishlistBook, mockUpcomingBook])
    );

    const { result } = renderHook(() => useBooks(), { wrapper });

    await waitForLoaded(result);

    expect(result.current.wishlistBooks).toHaveLength(1);
    expect(result.current.wishlistBooks[0].id).toBe('book-2');
  });

  it('filters upcomingBooks (in wishlist with future release date)', async () => {
    mockGetAllBooks.mockImplementation(() =>
      Promise.resolve([mockBook, mockWishlistBook, mockUpcomingBook])
    );

    const { result } = renderHook(() => useBooks(), { wrapper });

    await waitForLoaded(result);

    expect(result.current.upcomingBooks).toHaveLength(1);
    expect(result.current.upcomingBooks[0].id).toBe('book-3');
  });

  it('sorts upcomingBooks by release date ascending', async () => {
    const upcoming1: Book = {
      ...mockUpcomingBook,
      id: 'up-1',
      releaseDate: '2099-06-01',
    };
    const upcoming2: Book = {
      ...mockUpcomingBook,
      id: 'up-2',
      releaseDate: '2099-03-01',
    };
    mockGetAllBooks.mockImplementation(() => Promise.resolve([upcoming1, upcoming2]));

    const { result } = renderHook(() => useBooks(), { wrapper });

    await waitForLoaded(result);

    expect(result.current.upcomingBooks[0].id).toBe('up-2');
    expect(result.current.upcomingBooks[1].id).toBe('up-1');
  });

  it('addBook inserts into database and updates state', async () => {
    const { result } = renderHook(() => useBooks(), { wrapper });

    await waitForLoaded(result);

    await act(async () => {
      await result.current.addBook(mockBook);
    });

    expect(mockBookExists).toHaveBeenCalledWith('book-1');
    expect(mockInsertBook).toHaveBeenCalledWith(mockBook);
    expect(result.current.books).toHaveLength(1);
  });

  it('addBook skips if book already exists', async () => {
    mockBookExists.mockImplementation(() => Promise.resolve(true));

    const { result } = renderHook(() => useBooks(), { wrapper });

    await waitForLoaded(result);

    await act(async () => {
      await result.current.addBook(mockBook);
    });

    expect(mockInsertBook).not.toHaveBeenCalled();
    expect(result.current.books).toHaveLength(0);
  });

  it('addSeries inserts into database and updates state', async () => {
    const { result } = renderHook(() => useBooks(), { wrapper });

    await waitForLoaded(result);

    await act(async () => {
      await result.current.addSeries(mockSeries);
    });

    expect(mockSeriesExists).toHaveBeenCalledWith('series-1');
    expect(mockInsertSeries).toHaveBeenCalledWith(mockSeries);
    expect(result.current.series).toHaveLength(1);
  });

  it('addSeries skips if series already exists', async () => {
    mockSeriesExists.mockImplementation(() => Promise.resolve(true));

    const { result } = renderHook(() => useBooks(), { wrapper });

    await waitForLoaded(result);

    await act(async () => {
      await result.current.addSeries(mockSeries);
    });

    expect(mockInsertSeries).not.toHaveBeenCalled();
  });

  it('updateBook updates database and state', async () => {
    mockGetAllBooks.mockImplementation(() => Promise.resolve([mockBook]));

    const { result } = renderHook(() => useBooks(), { wrapper });

    await waitForLoaded(result);

    await act(async () => {
      await result.current.updateBook('book-1', { isRead: false });
    });

    expect(mockUpdateBook).toHaveBeenCalledWith('book-1', { isRead: false });
    expect(result.current.books[0].isRead).toBe(false);
  });

  it('removeBook deletes from database and state', async () => {
    mockGetAllBooks.mockImplementation(() => Promise.resolve([mockBook]));

    const { result } = renderHook(() => useBooks(), { wrapper });

    await waitForLoaded(result);

    await act(async () => {
      await result.current.removeBook('book-1');
    });

    expect(mockDeleteBook).toHaveBeenCalledWith('book-1');
    expect(result.current.books).toHaveLength(0);
  });

  it('moveToOwned sets inWishlist to false', async () => {
    mockGetAllBooks.mockImplementation(() => Promise.resolve([mockWishlistBook]));

    const { result } = renderHook(() => useBooks(), { wrapper });

    await waitForLoaded(result);

    await act(async () => {
      await result.current.moveToOwned('book-2');
    });

    expect(mockUpdateBook).toHaveBeenCalledWith('book-2', { inWishlist: false });
    expect(result.current.books[0].inWishlist).toBe(false);
  });

  it('getBookById returns the correct book', async () => {
    mockGetAllBooks.mockImplementation(() =>
      Promise.resolve([mockBook, mockWishlistBook])
    );

    const { result } = renderHook(() => useBooks(), { wrapper });

    await waitForLoaded(result);

    expect(result.current.getBookById('book-1')).toEqual(mockBook);
    expect(result.current.getBookById('nonexistent')).toBeUndefined();
  });

  it('getSeriesById returns the correct series', async () => {
    mockGetAllSeries.mockImplementation(() => Promise.resolve([mockSeries]));

    const { result } = renderHook(() => useBooks(), { wrapper });

    await waitForLoaded(result);

    expect(result.current.getSeriesById('series-1')).toEqual(mockSeries);
    expect(result.current.getSeriesById('nonexistent')).toBeUndefined();
  });

  it('getBooksForSeries returns books sorted by volume number', async () => {
    const vol2: Book = {
      ...mockBook,
      id: 'book-v2',
      seriesId: 'series-1',
      volumeNumber: 2,
    };
    const vol1: Book = {
      ...mockBook,
      id: 'book-v1',
      seriesId: 'series-1',
      volumeNumber: 1,
    };
    mockGetAllBooks.mockImplementation(() =>
      Promise.resolve([vol2, vol1, mockWishlistBook])
    );

    const { result } = renderHook(() => useBooks(), { wrapper });

    await waitForLoaded(result);

    const seriesBooks = result.current.getBooksForSeries('series-1');
    expect(seriesBooks).toHaveLength(2);
    expect(seriesBooks[0].id).toBe('book-v1');
    expect(seriesBooks[1].id).toBe('book-v2');
  });

  it('useBooks throws when used outside BooksProvider', () => {
    expect(() => {
      renderHook(() => useBooks());
    }).toThrow('useBooks must be used within a BooksProvider');
  });
});
