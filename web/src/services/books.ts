const OPEN_LIBRARY_API = "https://openlibrary.org";

// Types
export type BookType = "novel" | "comic" | "manga" | "artbook" | "essay";
export type BookCategory =
  | "sf"
  | "fantasy"
  | "thriller"
  | "romance"
  | "horror"
  | "adventure"
  | "sliceOfLife"
  | "historical"
  | "mystery"
  | "biography";

export interface Book {
  id: string;
  title: string;
  author: string;
  bookType: BookType;
  categories: BookCategory[];
  isRead: boolean;
  inWishlist: boolean;
  coverUrl?: string;
  coverId?: number;
  seriesId?: string;
  volumeNumber?: number;
  releaseDate?: string;
  isbn?: string;
  firstPublishYear?: number;
  notes?: string;
}

export interface Series {
  id: string;
  name: string;
  author: string;
  totalVolumes: number;
  bookType: BookType;
  categories: BookCategory[];
}

export interface SearchResult {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  isbn?: string[];
}

// Storage keys
const BOOKS_KEY = "membooks_books";
const SERIES_KEY = "membooks_series";

// Initialize with seed data if empty
function initializeData() {
  const existingBooks = localStorage.getItem(BOOKS_KEY);
  const existingSeries = localStorage.getItem(SERIES_KEY);

  if (!existingBooks || !existingSeries) {
    const seedSeries: Series[] = [
      {
        id: "series-1",
        name: "The Expanse",
        author: "James S.A. Corey",
        totalVolumes: 9,
        bookType: "novel",
        categories: ["sf", "adventure"],
      },
      {
        id: "series-2",
        name: "One Piece",
        author: "Eiichiro Oda",
        totalVolumes: 107,
        bookType: "manga",
        categories: ["adventure", "fantasy"],
      },
    ];

    const seedBooks: Book[] = [
      {
        id: "book-1",
        title: "Leviathan Wakes",
        author: "James S.A. Corey",
        bookType: "novel",
        categories: ["sf", "adventure"],
        isRead: true,
        inWishlist: false,
        seriesId: "series-1",
        volumeNumber: 1,
      },
      {
        id: "book-2",
        title: "Caliban's War",
        author: "James S.A. Corey",
        bookType: "novel",
        categories: ["sf", "adventure"],
        isRead: true,
        inWishlist: false,
        seriesId: "series-1",
        volumeNumber: 2,
      },
      {
        id: "book-3",
        title: "Abaddon's Gate",
        author: "James S.A. Corey",
        bookType: "novel",
        categories: ["sf", "adventure"],
        isRead: false,
        inWishlist: false,
        seriesId: "series-1",
        volumeNumber: 3,
      },
      {
        id: "book-4",
        title: "One Piece Vol. 1",
        author: "Eiichiro Oda",
        bookType: "manga",
        categories: ["adventure", "fantasy"],
        isRead: true,
        inWishlist: false,
        seriesId: "series-2",
        volumeNumber: 1,
      },
      {
        id: "book-5",
        title: "Dune",
        author: "Frank Herbert",
        bookType: "novel",
        categories: ["sf", "adventure"],
        isRead: true,
        inWishlist: false,
      },
      {
        id: "book-6",
        title: "Project Hail Mary",
        author: "Andy Weir",
        bookType: "novel",
        categories: ["sf"],
        isRead: false,
        inWishlist: true,
        releaseDate: "2024-03-15",
      },
      {
        id: "book-7",
        title: "The Name of the Wind",
        author: "Patrick Rothfuss",
        bookType: "novel",
        categories: ["fantasy"],
        isRead: false,
        inWishlist: true,
      },
    ];

    localStorage.setItem(BOOKS_KEY, JSON.stringify(seedBooks));
    localStorage.setItem(SERIES_KEY, JSON.stringify(seedSeries));
  }
}

initializeData();

// Books CRUD
export function getAllBooks(): Book[] {
  const data = localStorage.getItem(BOOKS_KEY);
  return data ? JSON.parse(data) : [];
}

export function getOwnedBooks(): Book[] {
  return getAllBooks().filter((b) => !b.inWishlist);
}

export function getWishlistBooks(): Book[] {
  const today = new Date().toISOString().split("T")[0];
  return getAllBooks().filter(
    (b) => b.inWishlist && (!b.releaseDate || b.releaseDate <= today)
  );
}

export function getUpcomingBooks(): Book[] {
  const today = new Date().toISOString().split("T")[0];
  return getAllBooks()
    .filter((b) => b.inWishlist && b.releaseDate && b.releaseDate > today)
    .sort((a, b) => (a.releaseDate || "").localeCompare(b.releaseDate || ""));
}

export function getBook(id: string): Book | undefined {
  return getAllBooks().find((b) => b.id === id);
}

export function addBook(book: Omit<Book, "id">): Book {
  const books = getAllBooks();
  const newBook: Book = { ...book, id: crypto.randomUUID() };
  books.push(newBook);
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
  return newBook;
}

export function updateBook(id: string, updates: Partial<Book>): Book | null {
  const books = getAllBooks();
  const index = books.findIndex((b) => b.id === id);
  if (index === -1) return null;
  books[index] = { ...books[index], ...updates };
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
  return books[index];
}

export function deleteBook(id: string): boolean {
  const books = getAllBooks();
  const filtered = books.filter((b) => b.id !== id);
  if (filtered.length === books.length) return false;
  localStorage.setItem(BOOKS_KEY, JSON.stringify(filtered));
  return true;
}

export function moveToOwned(id: string): Book | null {
  return updateBook(id, { inWishlist: false });
}

export function bookExists(title: string, author: string): boolean {
  return getAllBooks().some(
    (b) =>
      b.title.toLowerCase() === title.toLowerCase() &&
      b.author.toLowerCase() === author.toLowerCase()
  );
}

// Series CRUD
export function getAllSeries(): Series[] {
  const data = localStorage.getItem(SERIES_KEY);
  return data ? JSON.parse(data) : [];
}

export function getSeries(id: string): Series | undefined {
  return getAllSeries().find((s) => s.id === id);
}

export function getBooksForSeries(seriesId: string): Book[] {
  return getAllBooks()
    .filter((b) => b.seriesId === seriesId)
    .sort((a, b) => (a.volumeNumber || 0) - (b.volumeNumber || 0));
}

export function getSeriesProgress(seriesId: string): { owned: number; total: number } {
  const series = getSeries(seriesId);
  const books = getBooksForSeries(seriesId);
  return {
    owned: books.length,
    total: series?.totalVolumes || books.length,
  };
}

export function addSeries(series: Omit<Series, "id">): Series {
  const allSeries = getAllSeries();
  const newSeries: Series = { ...series, id: crypto.randomUUID() };
  allSeries.push(newSeries);
  localStorage.setItem(SERIES_KEY, JSON.stringify(allSeries));
  return newSeries;
}

export function deleteSeries(seriesId: string): boolean {
  // Delete all books in the series
  const books = getAllBooks();
  const filteredBooks = books.filter((b) => b.seriesId !== seriesId);
  localStorage.setItem(BOOKS_KEY, JSON.stringify(filteredBooks));

  // Delete the series
  const allSeries = getAllSeries();
  const filteredSeries = allSeries.filter((s) => s.id !== seriesId);
  if (filteredSeries.length === allSeries.length) return false;
  localStorage.setItem(SERIES_KEY, JSON.stringify(filteredSeries));
  return true;
}

// Statistics
export function getStatistics() {
  const books = getOwnedBooks();
  const read = books.filter((b) => b.isRead).length;
  const unread = books.filter((b) => !b.isRead).length;

  const byType: Record<BookType, number> = {
    novel: 0,
    comic: 0,
    manga: 0,
    artbook: 0,
    essay: 0,
  };

  const byCategory: Record<BookCategory, number> = {
    sf: 0,
    fantasy: 0,
    thriller: 0,
    romance: 0,
    horror: 0,
    adventure: 0,
    sliceOfLife: 0,
    historical: 0,
    mystery: 0,
    biography: 0,
  };

  for (const book of books) {
    byType[book.bookType]++;
    for (const cat of book.categories) {
      byCategory[cat]++;
    }
  }

  return {
    total: books.length,
    read,
    unread,
    readPercentage: books.length > 0 ? Math.round((read / books.length) * 100) : 0,
    byType,
    byCategory,
  };
}

// Open Library Search
export async function searchBooks(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  try {
    const response = await fetch(
      `${OPEN_LIBRARY_API}/search.json?q=${encodeURIComponent(query)}&limit=20`
    );
    const data = await response.json();
    return data.docs || [];
  } catch {
    return [];
  }
}

export async function lookupISBN(isbn: string): Promise<SearchResult | null> {
  try {
    const response = await fetch(
      `${OPEN_LIBRARY_API}/search.json?isbn=${encodeURIComponent(isbn)}&limit=1`
    );
    const data = await response.json();
    return data.docs?.[0] || null;
  } catch {
    return null;
  }
}

export function getCoverUrl(coverId?: number, size: "S" | "M" | "L" = "M"): string | undefined {
  if (!coverId) return undefined;
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}

export function searchResultToBook(result: SearchResult): Omit<Book, "id"> {
  return {
    title: result.title,
    author: result.author_name?.[0] || "Unknown",
    bookType: "novel",
    categories: [],
    isRead: false,
    inWishlist: false,
    coverUrl: getCoverUrl(result.cover_i, "M"),
  };
}

// Category labels for display
export const CATEGORY_LABELS: Record<BookCategory, string> = {
  sf: "Sci-Fi",
  fantasy: "Fantasy",
  thriller: "Thriller",
  romance: "Romance",
  horror: "Horror",
  adventure: "Adventure",
  sliceOfLife: "Slice of Life",
  historical: "Historical",
  mystery: "Mystery",
  biography: "Biography",
};

export const BOOK_TYPE_LABELS: Record<BookType, string> = {
  novel: "Novel",
  comic: "Comic",
  manga: "Manga",
  artbook: "Artbook",
  essay: "Essay",
};
