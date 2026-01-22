/**
 * ISBN Lookup Service
 * Uses Open Library API to fetch book information
 */

import type { Book, BookType, BookCategory } from '@/types/book';

interface OpenLibraryBook {
  title?: string;
  authors?: { name: string }[];
  publishers?: string[];
  publish_date?: string;
  number_of_pages?: number;
  subjects?: string[];
  covers?: number[];
}

interface OpenLibraryResponse {
  [key: string]: OpenLibraryBook;
}

/**
 * Lookup book information by ISBN
 */
export async function lookupISBN(isbn: string): Promise<Book | null> {
  try {
    // Clean ISBN (remove dashes and spaces)
    const cleanISBN = isbn.replace(/[-\s]/g, '');

    // Fetch from Open Library API
    const response = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanISBN}&format=json&jsmcmd=data`
    );

    if (!response.ok) {
      console.error('Open Library API error:', response.status);
      return null;
    }

    const data: OpenLibraryResponse = await response.json();
    const bookData = data[`ISBN:${cleanISBN}`];

    if (!bookData) {
      console.log('Book not found for ISBN:', cleanISBN);
      return null;
    }

    // Extract author
    const author = bookData.authors?.[0]?.name ?? 'Unknown Author';

    // Try to guess book type and category from subjects
    const subjects = bookData.subjects?.map((s) => s.toLowerCase()) ?? [];
    const bookType = guessBookType(subjects);
    const categories = guessCategories(subjects);

    const book: Book = {
      id: `isbn-${cleanISBN}`,
      title: bookData.title ?? 'Unknown Title',
      author,
      bookType,
      categories,
      isRead: false,
      inWishlist: false,
    };

    return book;
  } catch (error) {
    console.error('Error looking up ISBN:', error);
    return null;
  }
}

/**
 * Guess book type from subjects
 */
function guessBookType(subjects: string[]): BookType {
  const subjectsStr = subjects.join(' ').toLowerCase();

  if (subjectsStr.includes('manga') || subjectsStr.includes('comic')) {
    return 'manga';
  }
  if (subjectsStr.includes('graphic novel') || subjectsStr.includes('comics')) {
    return 'comic';
  }
  if (subjectsStr.includes('art') || subjectsStr.includes('illustration')) {
    return 'artbook';
  }
  if (subjectsStr.includes('essay') || subjectsStr.includes('philosophy')) {
    return 'essay';
  }

  return 'novel';
}

/**
 * Guess categories from subjects
 */
function guessCategories(subjects: string[]): BookCategory[] {
  const categories: BookCategory[] = [];
  const subjectsStr = subjects.join(' ').toLowerCase();

  if (subjectsStr.includes('science fiction') || subjectsStr.includes('sci-fi')) {
    categories.push('sf');
  }
  if (subjectsStr.includes('fantasy') || subjectsStr.includes('magic')) {
    categories.push('fantasy');
  }
  if (subjectsStr.includes('thriller') || subjectsStr.includes('mystery') || subjectsStr.includes('detective')) {
    categories.push('thriller');
  }
  if (subjectsStr.includes('romance') || subjectsStr.includes('love')) {
    categories.push('romance');
  }
  if (subjectsStr.includes('horror') || subjectsStr.includes('scary')) {
    categories.push('horror');
  }
  if (subjectsStr.includes('adventure')) {
    categories.push('adventure');
  }
  if (subjectsStr.includes('history') || subjectsStr.includes('historical')) {
    categories.push('historical');
  }
  if (subjectsStr.includes('biography') || subjectsStr.includes('memoir')) {
    categories.push('biography');
  }

  // Default to slice of life if no category found
  if (categories.length === 0) {
    categories.push('sliceOfLife');
  }

  return categories;
}
