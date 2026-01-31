import { describe, it, expect, beforeEach, mock } from 'bun:test';
import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { BooksProvider, useBooks } from '@/contexts/books-context';
import type { Book, Series } from '@/types/book';

// Mock database service
mock.module('@/services/database', () => ({
  initDatabase: mock(() => Promise.resolve(undefined)),
  seedDatabaseIfEmpty: mock(() => Promise.resolve(undefined)),
  getAllBooks: mock(() => Promise.resolve([])),
  getAllSeries: mock(() => Promise.resolve([])),
  insertBook: mock(() => Promise.resolve(undefined)),
  insertSeries: mock(() => Promise.resolve(undefined)),
  updateBook: mock(() => Promise.resolve(undefined)),
  deleteBook: mock(() => Promise.resolve(undefined)),
  bookExists: mock(() => Promise.resolve(false)),
  seriesExists: mock(() => Promise.resolve(false)),
}));

const db = require('@/services/database');

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

beforeEach(() => {
  db.initDatabase.mockReset().mockResolvedValue(undefined);
  db.seedDatabaseIfEmpty.mockReset().mockResolvedValue(undefined);
  db.getAllBooks.mockReset().mockResolvedValue([]);
  db.getAllSeries.mockReset().mockResolvedValue([]);
  db.insertBook.mockReset().mockResolvedValue(undefined);
  db.insertSeries.mockReset().mockResolvedValue(undefined);
  db.updateBook.mockReset().mockResolvedValue(undefined);
  db.deleteBook.mockReset().mockResolvedValue(undefined);
  db.bookExists.mockReset().mockResolvedValue(false);
  db.seriesExists.mockReset().mockResolvedValue(false);
});

describe('BooksContext', () => {
  it('initializes database and loads data', async () => {
    db.getAllBooks.mockResolvedValueOnce([mockBook]);
    db.getAllSeries.mockResolvedValueOnce([mockSeries]);

    const { result } = renderHook(() => useBooks(), { wrapper });

    await act(async () => {});

    expect(db.initDatabase).toHaveBeenCalled();
    expect(db.seedDatabaseIfEmpty).toHaveBeenCalled();
    expect(result.current.books).toHaveLength(1);
    expect(result.current.series).toHaveLength(1);
    expect(result.current.isLoading).toBe(false);
  });

  it('filters ownedBooks (not in wishlist)', async () => {
    db.getAllBooks.mockResolvedValueOnce([mockBook, mockWishlistBook, mockUpcomingBook]);

    const { result } = renderHook(() => useBooks(), { wrapper });

    await act(async () => {});

    expect(result.current.ownedBooks).toHaveLength(1);
    expect(result.current.ownedBooks[0].id).toBe('book-1');
  });

  it('filters wishlistBooks (in wishlist, no future release date)', async () => {
    db.getAllBooks.mockResolvedValueOnce([mockBook, mockWishlistBook, mockUpcomingBook]);

    const { result } = renderHook(() => useBooks(), { wrapper });

    await act(async () => {});

    // mockWishlistBook has no release date, so should be in wishlist
    // mockUpcomingBook has future release date, so should NOT be in wishlist
    expect(result.current.wishlistBooks).toHaveLength(1);
    expect(result.current.wishlistBooks[0].id).toBe('book-2');
  });

  it('filters upcomingBooks (in wishlist with future release date)', async () => {
    db.getAllBooks.mockResolvedValueOnce([mockBook, mockWishlistBook, mockUpcomingBook]);

    const { result } = renderHook(() => useBooks(), { wrapper });

    await act(async () => {});

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
    db.getAllBooks.mockResolvedValueOnce([upcoming1, upcoming2]);

    const { result } = renderHook(() => useBooks(), { wrapper });

    await act(async () => {});

    expect(result.current.upcomingBooks[0].id).toBe('up-2');
    expect(result.current.upcomingBooks[1].id).toBe('up-1');
  });

  it('addBook inserts into database and updates state', async () => {
    const { result } = renderHook(() => useBooks(), { wrapper });

    await act(async () => {});

    await act(async () => {
      await result.current.addBook(mockBook);
    });

    expect(db.bookExists).toHaveBeenCalledWith('book-1');
    expect(db.insertBook).toHaveBeenCalledWith(mockBook);
    expect(result.current.books).toHaveLength(1);
  });

  it('addBook skips if book already exists', async () => {
    db.bookExists.mockResolvedValueOnce(true);

    const { result } = renderHook(() => useBooks(), { wrapper });

    await act(async () => {});

    await act(async () => {
      await result.current.addBook(mockBook);
    });

    expect(db.insertBook).not.toHaveBeenCalled();
    expect(result.current.books).toHaveLength(0);
  });

  it('addSeries inserts into database and updates state', async () => {
    const { result } = renderHook(() => useBooks(), { wrapper });

    await act(async () => {});

    await act(async () => {
      await result.current.addSeries(mockSeries);
    });

    expect(db.seriesExists).toHaveBeenCalledWith('series-1');
    expect(db.insertSeries).toHaveBeenCalledWith(mockSeries);
    expect(result.current.series).toHaveLength(1);
  });

  it('addSeries skips if series already exists', async () => {
    db.seriesExists.mockResolvedValueOnce(true);

    const { result } = renderHook(() => useBooks(), { wrapper });

    await act(async () => {});

    await act(async () => {
      await result.current.addSeries(mockSeries);
    });

    expect(db.insertSeries).not.toHaveBeenCalled();
  });

  it('updateBook updates database and state', async () => {
    db.getAllBooks.mockResolvedValueOnce([mockBook]);

    const { result } = renderHook(() => useBooks(), { wrapper });

    await act(async () => {});

    await act(async () => {
      await result.current.updateBook('book-1', { isRead: false });
    });

    expect(db.updateBook).toHaveBeenCalledWith('book-1', { isRead: false });
    expect(result.current.books[0].isRead).toBe(false);
  });

  it('removeBook deletes from database and state', async () => {
    db.getAllBooks.mockResolvedValueOnce([mockBook]);

    const { result } = renderHook(() => useBooks(), { wrapper });

    await act(async () => {});

    await act(async () => {
      await result.current.removeBook('book-1');
    });

    expect(db.deleteBook).toHaveBeenCalledWith('book-1');
    expect(result.current.books).toHaveLength(0);
  });

  it('moveToOwned sets inWishlist to false', async () => {
    db.getAllBooks.mockResolvedValueOnce([mockWishlistBook]);

    const { result } = renderHook(() => useBooks(), { wrapper });

    await act(async () => {});

    await act(async () => {
      await result.current.moveToOwned('book-2');
    });

    expect(db.updateBook).toHaveBeenCalledWith('book-2', { inWishlist: false });
    expect(result.current.books[0].inWishlist).toBe(false);
  });

  it('getBookById returns the correct book', async () => {
    db.getAllBooks.mockResolvedValueOnce([mockBook, mockWishlistBook]);

    const { result } = renderHook(() => useBooks(), { wrapper });

    await act(async () => {});

    expect(result.current.getBookById('book-1')).toEqual(mockBook);
    expect(result.current.getBookById('nonexistent')).toBeUndefined();
  });

  it('getSeriesById returns the correct series', async () => {
    db.getAllSeries.mockResolvedValueOnce([mockSeries]);

    const { result } = renderHook(() => useBooks(), { wrapper });

    await act(async () => {});

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
    db.getAllBooks.mockResolvedValueOnce([vol2, vol1, mockWishlistBook]);

    const { result } = renderHook(() => useBooks(), { wrapper });

    await act(async () => {});

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
