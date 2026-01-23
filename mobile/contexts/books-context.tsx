/**
 * Books Context
 * Manages the book collection state with SQLite persistence
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from 'react';
import * as db from '@/services/database';
import type { Book, Series } from '@/types/book';

interface BooksContextValue {
  books: Book[];
  series: Series[];
  ownedBooks: Book[];
  wishlistBooks: Book[];
  upcomingBooks: Book[];
  isLoading: boolean;
  addBook: (book: Book) => Promise<void>;
  addSeries: (series: Series) => Promise<void>;
  updateBook: (id: string, updates: Partial<Book>) => Promise<void>;
  removeBook: (id: string) => Promise<void>;
  moveToOwned: (id: string) => Promise<void>;
  getBookById: (id: string) => Book | undefined;
  getSeriesById: (id: string) => Series | undefined;
  getBooksForSeries: (seriesId: string) => Book[];
}

const BooksContext = createContext<BooksContextValue | null>(null);

interface BooksProviderProps {
  children: ReactNode;
}

export function BooksProvider({ children }: BooksProviderProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize database and load data
  useEffect(() => {
    async function initializeData() {
      try {
        // Initialize database
        await db.initDatabase();

        // Seed with mock data if empty
        await db.seedDatabaseIfEmpty();

        // Load data from database
        const [loadedBooks, loadedSeries] = await Promise.all([
          db.getAllBooks(),
          db.getAllSeries(),
        ]);

        setBooks(loadedBooks);
        setSeries(loadedSeries);
      } catch (error) {
        console.error('Failed to initialize database:', error);
      } finally {
        setIsLoading(false);
      }
    }

    initializeData();
  }, []);

  const addBook = useCallback(async (book: Book) => {
    try {
      // Check if book already exists
      const exists = await db.bookExists(book.id);
      if (exists) return;

      // Insert into database
      await db.insertBook(book);

      // Update state
      setBooks((prev) => [...prev, book]);
    } catch (error) {
      console.error('Failed to add book:', error);
      throw error;
    }
  }, []);

  const addSeries = useCallback(async (newSeries: Series) => {
    try {
      // Check if series already exists
      const exists = await db.seriesExists(newSeries.id);
      if (exists) return;

      // Insert into database
      await db.insertSeries(newSeries);

      // Update state
      setSeries((prev) => [...prev, newSeries]);
    } catch (error) {
      console.error('Failed to add series:', error);
      throw error;
    }
  }, []);

  const updateBook = useCallback(async (id: string, updates: Partial<Book>) => {
    try {
      // Update in database
      await db.updateBook(id, updates);

      // Update state
      setBooks((prev) =>
        prev.map((book) => (book.id === id ? { ...book, ...updates } : book))
      );
    } catch (error) {
      console.error('Failed to update book:', error);
      throw error;
    }
  }, []);

  const removeBook = useCallback(async (id: string) => {
    try {
      // Delete from database
      await db.deleteBook(id);

      // Update state
      setBooks((prev) => prev.filter((book) => book.id !== id));
    } catch (error) {
      console.error('Failed to remove book:', error);
      throw error;
    }
  }, []);

  const moveToOwned = useCallback(async (id: string) => {
    try {
      // Update in database
      await db.updateBook(id, { inWishlist: false });

      // Update state
      setBooks((prev) =>
        prev.map((book) => (book.id === id ? { ...book, inWishlist: false } : book))
      );
    } catch (error) {
      console.error('Failed to move book to owned:', error);
      throw error;
    }
  }, []);

  // Helper to get today's date in YYYY-MM-DD format
  const getTodayDateString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Filtered lists
  const ownedBooks = useMemo(
    () => books.filter((book) => !book.inWishlist),
    [books]
  );

  // Wishlist books: in wishlist AND (no release date OR release date <= today)
  const wishlistBooks = useMemo(() => {
    const today = getTodayDateString();
    return books.filter((book) => {
      if (!book.inWishlist) return false;
      // No release date means already available
      if (!book.releaseDate) return true;
      // Release date is today or in the past
      return book.releaseDate <= today;
    });
  }, [books]);

  // Upcoming books: in wishlist AND release date > today
  const upcomingBooks = useMemo(() => {
    const today = getTodayDateString();
    return books
      .filter((book) => {
        if (!book.inWishlist) return false;
        // Must have a future release date
        return book.releaseDate && book.releaseDate > today;
      })
      .sort((a, b) => {
        // Sort by release date ascending (soonest first)
        if (!a.releaseDate || !b.releaseDate) return 0;
        return a.releaseDate.localeCompare(b.releaseDate);
      });
  }, [books]);

  const getBookById = useCallback(
    (id: string) => books.find((book) => book.id === id),
    [books]
  );

  const getSeriesById = useCallback(
    (id: string) => series.find((s) => s.id === id),
    [series]
  );

  const getBooksForSeries = useCallback(
    (seriesId: string) =>
      books
        .filter((book) => book.seriesId === seriesId)
        .sort((a, b) => (a.volumeNumber ?? 0) - (b.volumeNumber ?? 0)),
    [books]
  );

  const value = useMemo<BooksContextValue>(
    () => ({
      books,
      series,
      ownedBooks,
      wishlistBooks,
      upcomingBooks,
      isLoading,
      addBook,
      addSeries,
      updateBook,
      removeBook,
      moveToOwned,
      getBookById,
      getSeriesById,
      getBooksForSeries,
    }),
    [
      books,
      series,
      ownedBooks,
      wishlistBooks,
      upcomingBooks,
      isLoading,
      addBook,
      addSeries,
      updateBook,
      removeBook,
      moveToOwned,
      getBookById,
      getSeriesById,
      getBooksForSeries,
    ]
  );

  return (
    <BooksContext.Provider value={value}>{children}</BooksContext.Provider>
  );
}

export function useBooks() {
  const context = useContext(BooksContext);
  if (!context) {
    throw new Error('useBooks must be used within a BooksProvider');
  }
  return context;
}
