import { useState, useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  getOwnedBooks,
  getWishlistBooks,
  getUpcomingBooks,
  getAllSeries,
  getBooksForSeries,
  getSeriesProgress,
  deleteBook,
  moveToOwned,
  type Book,
  type Series,
  BOOK_TYPE_LABELS,
} from "../services/books";

type Tab = "books" | "wishlist" | "releases";

interface LibraryItem {
  type: "book" | "series";
  id: string;
  title: string;
  author: string;
  isRead?: boolean;
  bookType: string;
  progress?: { owned: number; total: number };
  readCount?: number;
}

export function LibraryPage() {
  const [activeTab, setActiveTab] = useState<Tab>("books");
  const [books, setBooks] = useState<Book[]>([]);
  const [wishlist, setWishlist] = useState<Book[]>([]);
  const [upcoming, setUpcoming] = useState<Book[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [movingId, setMovingId] = useState<string | null>(null);

  const refreshData = () => {
    setBooks(getOwnedBooks());
    setWishlist(getWishlistBooks());
    setUpcoming(getUpcomingBooks());
    setSeries(getAllSeries());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const libraryItems = useMemo<LibraryItem[]>(() => {
    const items: LibraryItem[] = [];
    const seriesIds = new Set<string>();

    for (const book of books) {
      if (book.seriesId) {
        seriesIds.add(book.seriesId);
      } else {
        items.push({
          type: "book",
          id: book.id,
          title: book.title,
          author: book.author,
          isRead: book.isRead,
          bookType: book.bookType,
        });
      }
    }

    for (const s of series) {
      if (seriesIds.has(s.id)) {
        const seriesBooks = getBooksForSeries(s.id);
        const readCount = seriesBooks.filter((b) => b.isRead).length;
        items.push({
          type: "series",
          id: s.id,
          title: s.name,
          author: s.author,
          bookType: s.bookType,
          progress: getSeriesProgress(s.id),
          readCount,
        });
      }
    }

    return items.sort((a, b) => a.title.localeCompare(b.title));
  }, [books, series]);

  const handleMoveToOwned = async (id: string) => {
    setMovingId(id);
    await new Promise((r) => setTimeout(r, 300));
    moveToOwned(id);
    refreshData();
    setMovingId(null);
  };

  const handleRemoveFromWishlist = (id: string) => {
    deleteBook(id);
    refreshData();
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-title text-3xl">My Library</h1>
        <div className="flex gap-3">
          <Link
            to="/statistics"
            className="px-4 py-2 bg-purple text-white font-title text-sm border-2 border-gray-900 rounded-lg neo-shadow-sm hover:translate-y-0.5 hover:shadow-none transition-all"
          >
            Statistics
          </Link>
          <Link
            to="/profile"
            className="px-4 py-2 bg-coral text-gray-900 font-title text-sm border-2 border-gray-900 rounded-lg neo-shadow-sm hover:translate-y-0.5 hover:shadow-none transition-all"
          >
            Profile
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b-2 border-gray-200">
        <button
          onClick={() => setActiveTab("books")}
          className={`px-6 py-3 font-title text-sm border-b-2 -mb-0.5 transition-colors ${
            activeTab === "books"
              ? "border-coral text-coral"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          My Books
          <span className="ml-2 px-2 py-0.5 text-xs bg-coral text-gray-900 rounded-full">
            {books.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("wishlist")}
          className={`px-6 py-3 font-title text-sm border-b-2 -mb-0.5 transition-colors ${
            activeTab === "wishlist"
              ? "border-coral text-coral"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Wishlist
          <span className="ml-2 px-2 py-0.5 text-xs border border-gray-300 rounded-full">
            {wishlist.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("releases")}
          className={`px-6 py-3 font-title text-sm border-b-2 -mb-0.5 transition-colors ${
            activeTab === "releases"
              ? "border-coral text-coral"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Releases
          <span className="ml-2 px-2 py-0.5 text-xs border border-gray-300 rounded-full">
            {upcoming.length}
          </span>
        </button>
      </div>

      {/* My Books Tab */}
      {activeTab === "books" && (
        <>
          {libraryItems.length === 0 ? (
            <div className="text-center py-16">
              <h3 className="font-title text-xl mb-2">No books yet</h3>
              <p className="text-gray-600 mb-6">Start building your library by searching for books</p>
              <Link
                to="/search"
                className="inline-block px-6 py-3 bg-coral text-gray-900 font-title border-2 border-gray-900 rounded-lg neo-shadow-md hover:translate-y-0.5 hover:shadow-none transition-all"
              >
                Search Books
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {libraryItems.map((item) =>
                item.type === "series" ? (
                  <Link key={item.id} to={`/series/${item.id}`} className="block">
                    <div className="bg-white border-2 border-gray-900 rounded-xl p-5 neo-shadow-md hover:translate-y-[-2px] hover:shadow-lg transition-all cursor-pointer">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-title text-lg">{item.title}</h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            item.readCount && item.progress && item.readCount >= item.progress.owned
                              ? "bg-cyan text-gray-900"
                              : "bg-yellow text-gray-900"
                          }`}
                        >
                          {item.readCount && item.progress && item.readCount >= item.progress.owned
                            ? "Read"
                            : "Reading"}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{item.author}</p>
                      <span className="inline-block px-2 py-1 text-xs border border-gray-300 rounded-full mb-3">
                        {BOOK_TYPE_LABELS[item.bookType as keyof typeof BOOK_TYPE_LABELS]}
                      </span>
                      {item.progress && (
                        <div className="mt-3">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                            <div
                              className="h-full bg-purple transition-all"
                              style={{ width: `${(item.progress.owned / item.progress.total) * 100}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {item.progress.owned} of {item.progress.total} volumes owned
                          </p>
                        </div>
                      )}
                    </div>
                  </Link>
                ) : (
                  <Link key={item.id} to={`/book/${item.id}`} className="block">
                    <div className="bg-white border-2 border-gray-900 rounded-xl p-5 neo-shadow-md hover:translate-y-[-2px] hover:shadow-lg transition-all cursor-pointer">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-title text-lg">{item.title}</h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            item.isRead ? "bg-cyan text-gray-900" : "bg-yellow text-gray-900"
                          }`}
                        >
                          {item.isRead ? "Read" : "Unread"}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{item.author}</p>
                      <span className="inline-block px-2 py-1 text-xs border border-gray-300 rounded-full">
                        {BOOK_TYPE_LABELS[item.bookType as keyof typeof BOOK_TYPE_LABELS]}
                      </span>
                    </div>
                  </Link>
                )
              )}
            </div>
          )}
        </>
      )}

      {/* Wishlist Tab */}
      {activeTab === "wishlist" && (
        <>
          {wishlist.length === 0 ? (
            <div className="text-center py-16">
              <h3 className="font-title text-xl mb-2">Wishlist is empty</h3>
              <p className="text-gray-600 mb-6">Add books you want to read later</p>
              <Link
                to="/search"
                className="inline-block px-6 py-3 bg-coral text-gray-900 font-title border-2 border-gray-900 rounded-lg neo-shadow-md hover:translate-y-0.5 hover:shadow-none transition-all"
              >
                Search Books
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlist.map((book) => (
                <div key={book.id} className="bg-white border-2 border-gray-900 rounded-xl p-5 neo-shadow-md">
                  <h3 className="font-title text-lg mb-1">{book.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{book.author}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMoveToOwned(book.id)}
                      disabled={movingId === book.id}
                      className="flex-1 px-3 py-2 bg-cyan text-gray-900 font-title text-sm border-2 border-gray-900 rounded-lg hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50"
                    >
                      {movingId === book.id ? "Moving..." : "Move to Owned"}
                    </button>
                    <button
                      onClick={() => handleRemoveFromWishlist(book.id)}
                      className="px-3 py-2 border-2 border-gray-900 rounded-lg font-title text-sm hover:bg-gray-100 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Releases Tab */}
      {activeTab === "releases" && (
        <>
          {upcoming.length === 0 ? (
            <div className="text-center py-16">
              <h3 className="font-title text-xl mb-2">No upcoming releases</h3>
              <p className="text-gray-600">Books with future release dates will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcoming.map((book) => (
                <div key={book.id} className="bg-white border-2 border-gray-900 rounded-xl p-5 neo-shadow-md">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-title text-lg">{book.title}</h3>
                    <span className="px-2 py-1 text-xs bg-purple text-white rounded-full">
                      {new Date(book.releaseDate!).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{book.author}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Floating Add Button */}
      <Link
        to="/search"
        className="fixed bottom-6 right-6 w-14 h-14 bg-coral text-gray-900 font-title text-2xl border-2 border-gray-900 rounded-full flex items-center justify-center neo-shadow-md hover:translate-y-0.5 hover:shadow-none transition-all"
      >
        +
      </Link>
    </div>
  );
}
