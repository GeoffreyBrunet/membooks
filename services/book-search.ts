/**
 * Book Search Service
 * Uses Open Library Search API to find books
 */

import type { Book, BookType, BookCategory } from '@/types/book';

interface OpenLibrarySearchDoc {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  subject?: string[];
  isbn?: string[];
  cover_i?: number;
}

interface OpenLibrarySearchResponse {
  numFound: number;
  docs: OpenLibrarySearchDoc[];
}

export interface SearchResult {
  id: string;
  title: string;
  author: string;
  year?: number;
  bookType: BookType;
  categories: BookCategory[];
  coverId?: number;
  description?: string;
}

interface OpenLibraryWorkResponse {
  title: string;
  description?: string | { value: string };
  covers?: number[];
  subjects?: string[];
  authors?: { author: { key: string } }[];
}

interface OpenLibraryAuthorResponse {
  name: string;
}

/**
 * Search for books by title or author
 */
export async function searchBooks(query: string, limit = 20): Promise<SearchResult[]> {
  try {
    if (!query.trim()) return [];

    const encodedQuery = encodeURIComponent(query.trim());
    const response = await fetch(
      `https://openlibrary.org/search.json?q=${encodedQuery}&limit=${limit}`
    );

    if (!response.ok) {
      console.error('Open Library Search API error:', response.status);
      return [];
    }

    const data: OpenLibrarySearchResponse = await response.json();

    return data.docs.map((doc) => {
      const subjects = doc.subject?.map((s) => s.toLowerCase()) ?? [];
      return {
        id: doc.key,
        title: doc.title,
        author: doc.author_name?.[0] ?? 'Unknown Author',
        year: doc.first_publish_year,
        bookType: guessBookType(subjects),
        categories: guessCategories(subjects),
        coverId: doc.cover_i,
      };
    });
  } catch (error) {
    console.error('Error searching books:', error);
    return [];
  }
}

/**
 * Convert a search result to a Book object
 */
export function searchResultToBook(result: SearchResult, inWishlist: boolean): Book {
  return {
    id: `search-${result.id.replace('/works/', '')}`,
    title: result.title,
    author: result.author,
    bookType: result.bookType,
    categories: result.categories,
    isRead: false,
    inWishlist,
  };
}

/**
 * Get cover image URL for a book
 */
export function getCoverUrl(coverId: number | undefined, size: 'S' | 'M' | 'L' = 'M'): string | null {
  if (!coverId) return null;
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}

/**
 * Quick search for autocomplete (fewer results, faster)
 */
export async function quickSearch(query: string, limit = 5): Promise<SearchResult[]> {
  return searchBooks(query, limit);
}

/**
 * Get detailed information about a book/work
 */
export async function getBookDetails(workId: string): Promise<{
  title: string;
  author: string;
  description: string;
  coverId?: number;
  subjects: string[];
} | null> {
  try {
    const cleanId = workId.replace('/works/', '');
    const response = await fetch(`https://openlibrary.org/works/${cleanId}.json`);

    if (!response.ok) {
      console.error('Open Library Work API error:', response.status);
      return null;
    }

    const data: OpenLibraryWorkResponse = await response.json();

    // Get author name
    let authorName = 'Unknown Author';
    if (data.authors && data.authors.length > 0) {
      const authorKey = data.authors[0].author.key;
      const authorResponse = await fetch(`https://openlibrary.org${authorKey}.json`);
      if (authorResponse.ok) {
        const authorData: OpenLibraryAuthorResponse = await authorResponse.json();
        authorName = authorData.name;
      }
    }

    // Extract description
    let description = '';
    if (typeof data.description === 'string') {
      description = data.description;
    } else if (data.description?.value) {
      description = data.description.value;
    }

    return {
      title: data.title,
      author: authorName,
      description,
      coverId: data.covers?.[0],
      subjects: data.subjects ?? [],
    };
  } catch (error) {
    console.error('Error fetching book details:', error);
    return null;
  }
}

/**
 * Search for other books by the same author
 */
export async function searchByAuthor(author: string, limit = 10): Promise<SearchResult[]> {
  try {
    if (!author.trim()) return [];

    const encodedAuthor = encodeURIComponent(author.trim());
    const response = await fetch(
      `https://openlibrary.org/search.json?author=${encodedAuthor}&limit=${limit}`
    );

    if (!response.ok) {
      console.error('Open Library Search API error:', response.status);
      return [];
    }

    const data: OpenLibrarySearchResponse = await response.json();

    return data.docs.map((doc) => {
      const subjects = doc.subject?.map((s) => s.toLowerCase()) ?? [];
      return {
        id: doc.key,
        title: doc.title,
        author: doc.author_name?.[0] ?? author,
        year: doc.first_publish_year,
        bookType: guessBookType(subjects),
        categories: guessCategories(subjects),
        coverId: doc.cover_i,
      };
    });
  } catch (error) {
    console.error('Error searching by author:', error);
    return [];
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

  if (categories.length === 0) {
    categories.push('sliceOfLife');
  }

  return categories;
}
