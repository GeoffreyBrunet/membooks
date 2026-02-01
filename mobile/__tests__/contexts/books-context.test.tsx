import { describe, it, expect, beforeEach, spyOn } from 'bun:test';
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import * as db from '@/services/database';
import { BooksProvider, useBooks } from '@/contexts/books-context';
import type { Book, Series } from '@/types/book';

// Use spyOn on the database module namespace instead of mock.module
// This avoids CJS/ESM module instance issues on Linux Bun
const spyInitDatabase = spyOn(db, 'initDatabase');
const spySeedDatabaseIfEmpty = spyOn(db, 'seedDatabaseIfEmpty');
const spyGetAllBooks = spyOn(db, 'getAllBooks');
const spyGetAllSeries = spyOn(db, 'getAllSeries');
const spyInsertBook = spyOn(db, 'insertBook');
const spyInsertSeries = spyOn(db, 'insertSeries');
const spyUpdateBook = spyOn(db, 'updateBook');
const spyDeleteBook = spyOn(db, 'deleteBook');
const spyBookExists = spyOn(db, 'bookExists');
const spySeriesExists = spyOn(db, 'seriesExists');

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
  spyInitDatabase.mockReset().mockImplementation(() => Promise.resolve(undefined) as any);
  spySeedDatabaseIfEmpty.mockReset().mockImplementation(() => Promise.resolve(undefined) as any);
  spyGetAllBooks.mockReset().mockImplementation(() => Promise.resolve([] as Book[]) as any);
  spyGetAllSeries.mockReset().mockImplementation(() => Promise.resolve([] as Series[]) as any);
  spyInsertBook.mockReset().mockImplementation(() => Promise.resolve(undefined) as any);
  spyInsertSeries.mockReset().mockImplementation(() => Promise.resolve(undefined) as any);
  spyUpdateBook.mockReset().mockImplementation(() => Promise.resolve(undefined) as any);
  spyDeleteBook.mockReset().mockImplementation(() => Promise.resolve(undefined) as any);
  spyBookExists.mockReset().mockImplementation(() => Promise.resolve(false) as any);
  spySeriesExists.mockReset().mockImplementation(() => Promise.resolve(false) as any);
});

describe('BooksContext', () => {
  it('initializes database and loads data', async () => {
    spyGetAllBooks.mockImplementation(() => Promise.resolve([mockBook]) as any);
    spyGetAllSeries.mockImplementation(() => Promise.resolve([mockSeries]) as any);

    const { result } = renderHook(() => useBooks(), { wrapper });

    await waitForLoaded(result);

    expect(spyInitDatabase).toHaveBeenCalled();
    expect(spySeedDatabaseIfEmpty).toHaveBeenCalled();
    expect(result.current.books).toHaveLength(1);
    expect(result.current.series).toHaveLength(1);
    expect(result.current.isLoading).toBe(false);
  });

  it('filters ownedBooks (not in wishlist)', async () => {
    spyGetAllBooks.mockImplementation(() =>
      Promise.resolve([mockBook, mockWishlistBook, mockUpcomingBook]) as any
    );

    const { result } = renderHook(() => useBooks(), { wrapper });

    await waitForLoaded(result);

    expect(result.current.ownedBooks).toHaveLength(1);
    expect(result.current.ownedBooks[0].id).toBe('book-1');
  });

  it('filters wishlistBooks (in wishlist, no future release date)', async () => {
    spyGetAllBooks.mockImplementation(() =>
      Promise.resolve([mockBook, mockWishlistBook, mockUpcomingBook]) as any
    );

    const { result } = renderHook(() => useBooks(), { wrapper });

    await waitForLoaded(result);

    expect(result.current.wishlistBooks).toHaveLength(1);
    expect(result.current.wishlistBooks[0].id).toBe('book-2');
  });

  it('filters upcomingBooks (in wishlist with future release date)', async () => {
    spyGetAllBooks.mockImplementation(() =>
      Promise.resolve([mockBook, mockWishlistBook, mockUpcomingBook]) as any
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
    spyGetAllBooks.mockImplementation(() => Promise.resolve([upcoming1, upcoming2]) as any);

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

    expect(spyBookExists).toHaveBeenCalledWith('book-1');
    expect(spyInsertBook).toHaveBeenCalledWith(mockBook);
    expect(result.current.books).toHaveLength(1);
  });

  it('addBook skips if book already exists', async () => {
    spyBookExists.mockImplementation(() => Promise.resolve(true) as any);

    const { result } = renderHook(() => useBooks(), { wrapper });

    await waitForLoaded(result);

    await act(async () => {
      await result.current.addBook(mockBook);
    });

    expect(spyInsertBook).not.toHaveBeenCalled();
    expect(result.current.books).toHaveLength(0);
  });

  it('addSeries inserts into database and updates state', async () => {
    const { result } = renderHook(() => useBooks(), { wrapper });

    await waitForLoaded(result);

    await act(async () => {
      await result.current.addSeries(mockSeries);
    });

    expect(spySeriesExists).toHaveBeenCalledWith('series-1');
    expect(spyInsertSeries).toHaveBeenCalledWith(mockSeries);
    expect(result.current.series).toHaveLength(1);
  });

  it('addSeries skips if series already exists', async () => {
    spySeriesExists.mockImplementation(() => Promise.resolve(true) as any);

    const { result } = renderHook(() => useBooks(), { wrapper });

    await waitForLoaded(result);

    await act(async () => {
      await result.current.addSeries(mockSeries);
    });

    expect(spyInsertSeries).not.toHaveBeenCalled();
  });

  it('updateBook updates database and state', async () => {
    spyGetAllBooks.mockImplementation(() => Promise.resolve([mockBook]) as any);

    const { result } = renderHook(() => useBooks(), { wrapper });

    await waitForLoaded(result);

    await act(async () => {
      await result.current.updateBook('book-1', { isRead: false });
    });

    expect(spyUpdateBook).toHaveBeenCalledWith('book-1', { isRead: false });
    expect(result.current.books[0].isRead).toBe(false);
  });

  it('removeBook deletes from database and state', async () => {
    spyGetAllBooks.mockImplementation(() => Promise.resolve([mockBook]) as any);

    const { result } = renderHook(() => useBooks(), { wrapper });

    await waitForLoaded(result);

    await act(async () => {
      await result.current.removeBook('book-1');
    });

    expect(spyDeleteBook).toHaveBeenCalledWith('book-1');
    expect(result.current.books).toHaveLength(0);
  });

  it('moveToOwned sets inWishlist to false', async () => {
    spyGetAllBooks.mockImplementation(() => Promise.resolve([mockWishlistBook]) as any);

    const { result } = renderHook(() => useBooks(), { wrapper });

    await waitForLoaded(result);

    await act(async () => {
      await result.current.moveToOwned('book-2');
    });

    expect(spyUpdateBook).toHaveBeenCalledWith('book-2', { inWishlist: false });
    expect(result.current.books[0].inWishlist).toBe(false);
  });

  it('getBookById returns the correct book', async () => {
    spyGetAllBooks.mockImplementation(() =>
      Promise.resolve([mockBook, mockWishlistBook]) as any
    );

    const { result } = renderHook(() => useBooks(), { wrapper });

    await waitForLoaded(result);

    expect(result.current.getBookById('book-1')).toEqual(mockBook);
    expect(result.current.getBookById('nonexistent')).toBeUndefined();
  });

  it('getSeriesById returns the correct series', async () => {
    spyGetAllSeries.mockImplementation(() => Promise.resolve([mockSeries]) as any);

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
    spyGetAllBooks.mockImplementation(() =>
      Promise.resolve([vol2, vol1, mockWishlistBook]) as any
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
