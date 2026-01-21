/**
 * Book Types
 */

// Book format types
export type BookType = 'novel' | 'comic' | 'manga' | 'artbook' | 'essay';

// Genre categories
export type BookCategory =
  | 'sf'
  | 'fantasy'
  | 'thriller'
  | 'romance'
  | 'horror'
  | 'adventure'
  | 'sliceOfLife'
  | 'historical'
  | 'mystery'
  | 'biography';

export interface Book {
  id: string;
  title: string;
  author: string;
  bookType: BookType;
  categories: BookCategory[];
  seriesId?: string;
  volumeNumber?: number;
}

export interface Series {
  id: string;
  name: string;
  totalVolumes: number;
  bookType: BookType;
  categories: BookCategory[];
}

export interface SeriesWithBooks extends Series {
  books: Book[];
}

// Union type for list display (can be a book or a series)
export type LibraryItem =
  | { type: 'book'; data: Book }
  | { type: 'series'; data: SeriesWithBooks };
