import { describe, it, expect, beforeEach, mock } from "bun:test";
import {
  getAllBooks,
  getOwnedBooks,
  getWishlistBooks,
  getUpcomingBooks,
  getBook,
  addBook,
  updateBook,
  deleteBook,
  moveToOwned,
  bookExists,
  getAllSeries,
  getSeries,
  getBooksForSeries,
  getSeriesProgress,
  addSeries,
  deleteSeries,
  getStatistics,
  searchBooks,
  lookupISBN,
  getCoverUrl,
  searchResultToBook,
  type Book,
  type Series,
  type SearchResult,
} from "../../src/services/books";

const BOOKS_KEY = "membooks_books";
const SERIES_KEY = "membooks_series";

function setBooks(books: Book[]) {
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
}

function setSeries(series: Series[]) {
  localStorage.setItem(SERIES_KEY, JSON.stringify(series));
}

const makeBook = (overrides: Partial<Book> = {}): Book => ({
  id: "b1",
  title: "Test Book",
  author: "Author",
  bookType: "novel",
  categories: ["sf"],
  isRead: false,
  inWishlist: false,
  ...overrides,
});

const makeSeries = (overrides: Partial<Series> = {}): Series => ({
  id: "s1",
  name: "Test Series",
  author: "Author",
  totalVolumes: 5,
  bookType: "novel",
  categories: ["sf"],
  ...overrides,
});

beforeEach(() => {
  localStorage.clear();
});

// --- CRUD Books ---

describe("getAllBooks", () => {
  it("returns empty array when no data", () => {
    expect(getAllBooks()).toEqual([]);
  });

  it("returns stored books", () => {
    const books = [makeBook()];
    setBooks(books);
    expect(getAllBooks()).toEqual(books);
  });
});

describe("getBook", () => {
  it("finds book by id", () => {
    setBooks([makeBook({ id: "x" })]);
    expect(getBook("x")?.id).toBe("x");
  });

  it("returns undefined for missing id", () => {
    setBooks([makeBook()]);
    expect(getBook("missing")).toBeUndefined();
  });
});

describe("addBook", () => {
  it("adds book with generated id", () => {
    setBooks([]);
    const book = addBook({ title: "New", author: "A", bookType: "novel", categories: [], isRead: false, inWishlist: false });
    expect(book.id).toBeTruthy();
    expect(getAllBooks()).toHaveLength(1);
  });
});

describe("updateBook", () => {
  it("updates existing book", () => {
    setBooks([makeBook({ id: "b1", isRead: false })]);
    const updated = updateBook("b1", { isRead: true });
    expect(updated?.isRead).toBe(true);
    expect(getAllBooks()[0].isRead).toBe(true);
  });

  it("returns null for missing book", () => {
    setBooks([]);
    expect(updateBook("missing", { isRead: true })).toBeNull();
  });
});

describe("deleteBook", () => {
  it("deletes existing book", () => {
    setBooks([makeBook({ id: "b1" })]);
    expect(deleteBook("b1")).toBe(true);
    expect(getAllBooks()).toHaveLength(0);
  });

  it("returns false for missing book", () => {
    setBooks([]);
    expect(deleteBook("missing")).toBe(false);
  });
});

// --- Filters ---

describe("getOwnedBooks", () => {
  it("excludes wishlist books", () => {
    setBooks([makeBook({ id: "1", inWishlist: false }), makeBook({ id: "2", inWishlist: true })]);
    const owned = getOwnedBooks();
    expect(owned).toHaveLength(1);
    expect(owned[0].id).toBe("1");
  });
});

describe("getWishlistBooks", () => {
  it("returns wishlist books with past or no release date", () => {
    setBooks([
      makeBook({ id: "1", inWishlist: true }),
      makeBook({ id: "2", inWishlist: true, releaseDate: "2000-01-01" }),
      makeBook({ id: "3", inWishlist: true, releaseDate: "2099-01-01" }),
      makeBook({ id: "4", inWishlist: false }),
    ]);
    const wish = getWishlistBooks();
    expect(wish.map((b) => b.id).sort()).toEqual(["1", "2"]);
  });
});

describe("getUpcomingBooks", () => {
  it("returns future wishlist books sorted by date", () => {
    setBooks([
      makeBook({ id: "a", inWishlist: true, releaseDate: "2099-06-01" }),
      makeBook({ id: "b", inWishlist: true, releaseDate: "2099-03-01" }),
      makeBook({ id: "c", inWishlist: true, releaseDate: "2000-01-01" }),
      makeBook({ id: "d", inWishlist: false, releaseDate: "2099-01-01" }),
    ]);
    const upcoming = getUpcomingBooks();
    expect(upcoming.map((b) => b.id)).toEqual(["b", "a"]);
  });
});

// --- Series ---

describe("getAllSeries", () => {
  it("returns empty array when no data", () => {
    expect(getAllSeries()).toEqual([]);
  });

  it("returns stored series", () => {
    const series = [makeSeries()];
    setSeries(series);
    expect(getAllSeries()).toEqual(series);
  });
});

describe("getSeries", () => {
  it("finds series by id", () => {
    setSeries([makeSeries({ id: "s1" })]);
    expect(getSeries("s1")?.id).toBe("s1");
  });

  it("returns undefined for missing", () => {
    setSeries([]);
    expect(getSeries("missing")).toBeUndefined();
  });
});

describe("getBooksForSeries", () => {
  it("returns books sorted by volume", () => {
    setBooks([
      makeBook({ id: "a", seriesId: "s1", volumeNumber: 3 }),
      makeBook({ id: "b", seriesId: "s1", volumeNumber: 1 }),
      makeBook({ id: "c", seriesId: "s2", volumeNumber: 1 }),
    ]);
    const books = getBooksForSeries("s1");
    expect(books.map((b) => b.id)).toEqual(["b", "a"]);
  });
});

describe("getSeriesProgress", () => {
  it("returns owned count and total from series", () => {
    setSeries([makeSeries({ id: "s1", totalVolumes: 10 })]);
    setBooks([
      makeBook({ id: "a", seriesId: "s1", volumeNumber: 1 }),
      makeBook({ id: "b", seriesId: "s1", volumeNumber: 2 }),
    ]);
    expect(getSeriesProgress("s1")).toEqual({ owned: 2, total: 10 });
  });

  it("uses books.length when series not found", () => {
    setBooks([makeBook({ id: "a", seriesId: "s99", volumeNumber: 1 })]);
    expect(getSeriesProgress("s99")).toEqual({ owned: 1, total: 1 });
  });
});

describe("addSeries", () => {
  it("adds series with generated id", () => {
    setSeries([]);
    const s = addSeries({ name: "New", author: "A", totalVolumes: 3, bookType: "manga", categories: [] });
    expect(s.id).toBeTruthy();
    expect(getAllSeries()).toHaveLength(1);
  });
});

describe("deleteSeries", () => {
  it("deletes series and its books", () => {
    setSeries([makeSeries({ id: "s1" })]);
    setBooks([makeBook({ id: "a", seriesId: "s1" }), makeBook({ id: "b", seriesId: "other" })]);
    expect(deleteSeries("s1")).toBe(true);
    expect(getAllSeries()).toHaveLength(0);
    expect(getAllBooks()).toHaveLength(1);
    expect(getAllBooks()[0].id).toBe("b");
  });

  it("returns false for missing series", () => {
    setSeries([]);
    setBooks([]);
    expect(deleteSeries("missing")).toBe(false);
  });
});

// --- Statistics ---

describe("getStatistics", () => {
  it("computes stats from owned books", () => {
    setBooks([
      makeBook({ id: "1", isRead: true, inWishlist: false, bookType: "novel", categories: ["sf", "adventure"] }),
      makeBook({ id: "2", isRead: false, inWishlist: false, bookType: "manga", categories: ["fantasy"] }),
      makeBook({ id: "3", isRead: false, inWishlist: true, bookType: "novel", categories: ["sf"] }),
    ]);
    const stats = getStatistics();
    expect(stats.total).toBe(2);
    expect(stats.read).toBe(1);
    expect(stats.unread).toBe(1);
    expect(stats.readPercentage).toBe(50);
    expect(stats.byType.novel).toBe(1);
    expect(stats.byType.manga).toBe(1);
    expect(stats.byCategory.sf).toBe(1);
    expect(stats.byCategory.adventure).toBe(1);
    expect(stats.byCategory.fantasy).toBe(1);
  });

  it("handles empty library", () => {
    setBooks([]);
    const stats = getStatistics();
    expect(stats.total).toBe(0);
    expect(stats.readPercentage).toBe(0);
  });
});

// --- Utility ---

describe("bookExists", () => {
  it("returns true for existing title+author (case insensitive)", () => {
    setBooks([makeBook({ title: "Dune", author: "Frank Herbert" })]);
    expect(bookExists("dune", "frank herbert")).toBe(true);
  });

  it("returns false when not found", () => {
    setBooks([]);
    expect(bookExists("Dune", "Frank Herbert")).toBe(false);
  });
});

describe("moveToOwned", () => {
  it("sets inWishlist to false", () => {
    setBooks([makeBook({ id: "b1", inWishlist: true })]);
    const result = moveToOwned("b1");
    expect(result?.inWishlist).toBe(false);
  });
});

describe("getCoverUrl", () => {
  it("returns URL with cover id and size", () => {
    expect(getCoverUrl(12345, "L")).toBe("https://covers.openlibrary.org/b/id/12345-L.jpg");
  });

  it("defaults to M size", () => {
    expect(getCoverUrl(1)).toBe("https://covers.openlibrary.org/b/id/1-M.jpg");
  });

  it("returns undefined without cover id", () => {
    expect(getCoverUrl(undefined)).toBeUndefined();
    expect(getCoverUrl(0)).toBeUndefined();
  });
});

describe("searchResultToBook", () => {
  it("converts search result to book", () => {
    const result: SearchResult = {
      key: "/works/123",
      title: "Test",
      author_name: ["Author A"],
      cover_i: 42,
      first_publish_year: 2020,
    };
    const book = searchResultToBook(result);
    expect(book.title).toBe("Test");
    expect(book.author).toBe("Author A");
    expect(book.bookType).toBe("novel");
    expect(book.coverUrl).toBe("https://covers.openlibrary.org/b/id/42-M.jpg");
    expect(book.inWishlist).toBe(false);
  });

  it("uses Unknown when no author", () => {
    const result: SearchResult = { key: "k", title: "T" };
    expect(searchResultToBook(result).author).toBe("Unknown");
  });
});

// --- API: searchBooks ---

describe("searchBooks", () => {
  it("returns empty array for blank query", async () => {
    expect(await searchBooks("")).toEqual([]);
    expect(await searchBooks("   ")).toEqual([]);
  });

  it("returns docs on success", async () => {
    const docs = [{ key: "1", title: "A" }];
    globalThis.fetch = mock(() =>
      Promise.resolve({ json: () => Promise.resolve({ docs }) } as Response)
    ) as unknown as typeof fetch;
    const res = await searchBooks("test");
    expect(res).toEqual(docs);
  });

  it("returns empty array on error", async () => {
    globalThis.fetch = mock(() => Promise.reject(new Error("net"))) as unknown as typeof fetch;
    expect(await searchBooks("test")).toEqual([]);
  });
});

// --- API: lookupISBN ---

describe("lookupISBN", () => {
  it("returns first doc on success", async () => {
    const doc = { key: "1", title: "A" };
    globalThis.fetch = mock(() =>
      Promise.resolve({ json: () => Promise.resolve({ docs: [doc] }) } as Response)
    ) as unknown as typeof fetch;
    expect(await lookupISBN("123")).toEqual(doc);
  });

  it("returns null when no results", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve({ json: () => Promise.resolve({ docs: [] }) } as Response)
    ) as unknown as typeof fetch;
    expect(await lookupISBN("123")).toBeNull();
  });

  it("returns null on error", async () => {
    globalThis.fetch = mock(() => Promise.reject(new Error("net"))) as unknown as typeof fetch;
    expect(await lookupISBN("123")).toBeNull();
  });
});
