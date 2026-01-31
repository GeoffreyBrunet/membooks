import { describe, it, expect, beforeEach, mock } from 'bun:test';

// Ensure we use the real service (not a mock from other test files)
mock.module('@/services/book-search', () => require('../../services/book-search'));

import {
  searchBooks,
  searchResultToBook,
  getCoverUrl,
  getBookDetails,
  searchByAuthor,
} from '@/services/book-search';

const mockFetch = global.fetch as ReturnType<typeof mock>;

beforeEach(() => {
  mockFetch.mockReset();
});

describe('getCoverUrl', () => {
  it('returns null when coverId is undefined', () => {
    expect(getCoverUrl(undefined)).toBeNull();
  });

  it('returns null when coverId is 0', () => {
    expect(getCoverUrl(0)).toBeNull();
  });

  it('returns correct URL with default size M', () => {
    expect(getCoverUrl(12345)).toBe(
      'https://covers.openlibrary.org/b/id/12345-M.jpg'
    );
  });

  it('returns correct URL with size S', () => {
    expect(getCoverUrl(12345, 'S')).toBe(
      'https://covers.openlibrary.org/b/id/12345-S.jpg'
    );
  });

  it('returns correct URL with size L', () => {
    expect(getCoverUrl(12345, 'L')).toBe(
      'https://covers.openlibrary.org/b/id/12345-L.jpg'
    );
  });
});

describe('searchResultToBook', () => {
  const result = {
    id: '/works/OL123W',
    title: 'Test Book',
    author: 'Test Author',
    year: 2023,
    bookType: 'novel' as const,
    categories: ['sf' as const],
    coverId: 999,
  };

  it('converts search result to a Book with inWishlist false', () => {
    const book = searchResultToBook(result, false);
    expect(book).toEqual({
      id: 'search-OL123W',
      title: 'Test Book',
      author: 'Test Author',
      bookType: 'novel',
      categories: ['sf'],
      isRead: false,
      inWishlist: false,
    });
  });

  it('converts search result to a Book with inWishlist true', () => {
    const book = searchResultToBook(result, true);
    expect(book.inWishlist).toBe(true);
  });

  it('strips /works/ prefix from id', () => {
    const book = searchResultToBook(result, false);
    expect(book.id).toBe('search-OL123W');
  });
});

describe('searchBooks', () => {
  it('returns empty array for empty query', async () => {
    const results = await searchBooks('');
    expect(results).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns empty array for whitespace-only query', async () => {
    const results = await searchBooks('   ');
    expect(results).toEqual([]);
  });

  it('calls Open Library API with encoded query', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ numFound: 0, docs: [] }),
    });

    await searchBooks('test query');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://openlibrary.org/search.json?q=test%20query&limit=20'
    );
  });

  it('maps API docs to SearchResult objects', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          numFound: 1,
          docs: [
            {
              key: '/works/OL1W',
              title: 'Dune',
              author_name: ['Frank Herbert'],
              first_publish_year: 1965,
              subject: ['Science Fiction', 'Adventure'],
              cover_i: 100,
            },
          ],
        }),
    });

    const results = await searchBooks('dune');

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      id: '/works/OL1W',
      title: 'Dune',
      author: 'Frank Herbert',
      year: 1965,
      bookType: 'novel',
      categories: ['sf', 'adventure'],
      coverId: 100,
    });
  });

  it('defaults author to Unknown Author when missing', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          numFound: 1,
          docs: [{ key: '/works/OL2W', title: 'No Author Book' }],
        }),
    });

    const results = await searchBooks('no author');
    expect(results[0].author).toBe('Unknown Author');
  });

  it('guesses manga type from subjects', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          numFound: 1,
          docs: [
            {
              key: '/works/OL3W',
              title: 'Naruto',
              subject: ['Manga', 'Japanese comics'],
            },
          ],
        }),
    });

    const results = await searchBooks('naruto');
    expect(results[0].bookType).toBe('manga');
  });

  it('returns empty array on API error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const results = await searchBooks('test');
    expect(results).toEqual([]);
  });

  it('returns empty array on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const results = await searchBooks('test');
    expect(results).toEqual([]);
  });

  it('respects custom limit', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ numFound: 0, docs: [] }),
    });

    await searchBooks('test', 5);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://openlibrary.org/search.json?q=test&limit=5'
    );
  });
});

describe('getBookDetails', () => {
  it('fetches work details and author', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            title: 'Dune',
            description: 'A desert planet story',
            covers: [100],
            subjects: ['Science Fiction'],
            authors: [{ author: { key: '/authors/OL1A' } }],
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ name: 'Frank Herbert' }),
      });

    const result = await getBookDetails('/works/OL1W');

    expect(result).toEqual({
      title: 'Dune',
      author: 'Frank Herbert',
      description: 'A desert planet story',
      coverId: 100,
      subjects: ['Science Fiction'],
    });
  });

  it('strips /works/ prefix from workId', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            title: 'Test',
            authors: [],
          }),
      });

    await getBookDetails('/works/OL1W');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://openlibrary.org/works/OL1W.json'
    );
  });

  it('handles description as object with value', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          title: 'Test',
          description: { value: 'Object description' },
          authors: [],
        }),
    });

    const result = await getBookDetails('OL2W');
    expect(result?.description).toBe('Object description');
  });

  it('returns null on API error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

    const result = await getBookDetails('OL3W');
    expect(result).toBeNull();
  });

  it('returns null on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await getBookDetails('OL3W');
    expect(result).toBeNull();
  });

  it('defaults author to Unknown Author when no authors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          title: 'Test',
          authors: [],
        }),
    });

    const result = await getBookDetails('OL4W');
    expect(result?.author).toBe('Unknown Author');
  });
});

describe('searchByAuthor', () => {
  it('returns empty array for empty author', async () => {
    const results = await searchByAuthor('');
    expect(results).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('calls API with author parameter', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ numFound: 0, docs: [] }),
    });

    await searchByAuthor('Frank Herbert');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://openlibrary.org/search.json?author=Frank%20Herbert&limit=10'
    );
  });

  it('uses author name as fallback when author_name is missing', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          numFound: 1,
          docs: [{ key: '/works/OL1W', title: 'Dune' }],
        }),
    });

    const results = await searchByAuthor('Frank Herbert');
    expect(results[0].author).toBe('Frank Herbert');
  });

  it('returns empty array on error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const results = await searchByAuthor('test');
    expect(results).toEqual([]);
  });
});
