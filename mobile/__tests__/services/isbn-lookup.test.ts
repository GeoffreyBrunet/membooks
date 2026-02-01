import { describe, it, expect, beforeEach, mock } from 'bun:test';

// Ensure we use the real service (not a mock from other test files)
mock.module('@/services/isbn-lookup', () => require('../../services/isbn-lookup'));

import { lookupISBN } from '@/services/isbn-lookup';

const mockFetch = global.fetch as ReturnType<typeof mock>;

beforeEach(() => {
  mockFetch.mockReset();
});

describe('lookupISBN', () => {
  it('returns a Book object for a valid ISBN', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          'ISBN:9780441013593': {
            title: 'Dune',
            authors: [{ name: 'Frank Herbert' }],
            subjects: ['Science Fiction'],
          },
        }),
    });

    const book = await lookupISBN('9780441013593');

    expect(book).toEqual({
      id: 'isbn-9780441013593',
      title: 'Dune',
      author: 'Frank Herbert',
      bookType: 'novel',
      categories: ['sf'],
      isRead: false,
      inWishlist: false,
    });
  });

  it('cleans ISBN by removing dashes', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          'ISBN:9780441013593': {
            title: 'Dune',
            authors: [{ name: 'Frank Herbert' }],
          },
        }),
    });

    await lookupISBN('978-0-441-01359-3');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://openlibrary.org/api/books?bibkeys=ISBN:9780441013593&format=json&jsmcmd=data'
    );
  });

  it('cleans ISBN by removing spaces', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          'ISBN:9780441013593': {
            title: 'Dune',
            authors: [{ name: 'Frank Herbert' }],
          },
        }),
    });

    await lookupISBN('978 0441 013593');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://openlibrary.org/api/books?bibkeys=ISBN:9780441013593&format=json&jsmcmd=data'
    );
  });

  it('returns null when book is not found', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const book = await lookupISBN('0000000000');
    expect(book).toBeNull();
  });

  it('returns null on API error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const book = await lookupISBN('9780441013593');
    expect(book).toBeNull();
  });

  it('returns null on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const book = await lookupISBN('9780441013593');
    expect(book).toBeNull();
  });

  it('defaults author to Unknown Author when missing', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          'ISBN:1234567890': {
            title: 'Mystery Book',
          },
        }),
    });

    const book = await lookupISBN('1234567890');
    expect(book?.author).toBe('Unknown Author');
  });

  it('defaults title to Unknown Title when missing', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          'ISBN:1234567890': {
            authors: [{ name: 'Author' }],
          },
        }),
    });

    const book = await lookupISBN('1234567890');
    expect(book?.title).toBe('Unknown Title');
  });

  it('guesses manga type from subjects', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          'ISBN:1234567890': {
            title: 'One Piece Vol 1',
            authors: [{ name: 'Eiichiro Oda' }],
            subjects: ['Manga', 'Adventure'],
          },
        }),
    });

    const book = await lookupISBN('1234567890');
    expect(book?.bookType).toBe('manga');
  });

  it('defaults to sliceOfLife when no categories match', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          'ISBN:1234567890': {
            title: 'A Simple Book',
            authors: [{ name: 'Author' }],
            subjects: ['cooking'],
          },
        }),
    });

    const book = await lookupISBN('1234567890');
    expect(book?.categories).toEqual(['sliceOfLife']);
  });
});
