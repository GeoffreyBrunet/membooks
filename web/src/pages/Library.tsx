import React, { useState, useEffect, useMemo } from "react";
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

  // Combine books and series for unified list
  const libraryItems = useMemo<LibraryItem[]>(() => {
    const items: LibraryItem[] = [];
    const seriesIds = new Set<string>();

    // Group books by series
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

    // Add series
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
    await new Promise((r) => setTimeout(r, 300)); // Simulate delay
    moveToOwned(id);
    refreshData();
    setMovingId(null);
  };

  const handleRemoveFromWishlist = (id: string) => {
    deleteBook(id);
    refreshData();
  };

  return (
    <div className="screen">
      {/* Header */}
      <div className="screen-header">
        <h1 className="title">My Library</h1>
        <div style={{ display: "flex", gap: "var(--space-md)" }}>
          <Link to="/statistics" className="btn btn-accent btn-sm">
            Statistics
          </Link>
          <Link to="/profile" className="btn btn-primary btn-sm">
            Profile
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === "books" ? "active" : ""}`}
          onClick={() => setActiveTab("books")}
        >
          My Books
          <span className="badge badge-coral" style={{ marginLeft: "8px" }}>
            {books.length}
          </span>
        </button>
        <button
          className={`tab ${activeTab === "wishlist" ? "active" : ""}`}
          onClick={() => setActiveTab("wishlist")}
        >
          Wishlist
          <span className="badge badge-outline" style={{ marginLeft: "8px" }}>
            {wishlist.length}
          </span>
        </button>
        <button
          className={`tab ${activeTab === "releases" ? "active" : ""}`}
          onClick={() => setActiveTab("releases")}
        >
          Releases
          <span className="badge badge-outline" style={{ marginLeft: "8px" }}>
            {upcoming.length}
          </span>
        </button>
      </div>

      {/* My Books Tab */}
      {activeTab === "books" && (
        <>
          {libraryItems.length === 0 ? (
            <div className="empty-state">
              <h3>No books yet</h3>
              <p>Start building your library by searching for books</p>
              <Link to="/search" className="btn btn-primary" style={{ marginTop: "16px" }}>
                Search Books
              </Link>
            </div>
          ) : (
            <div className="grid grid-auto">
              {libraryItems.map((item, index) => (
                <React.Fragment key={item.id}>
                  {item.type === "series" ? (
                    <Link to={`/series/${item.id}`} style={{ textDecoration: "none" }}>
                      <div className="series-card">
                        <div className="series-card-header">
                          <span className="series-card-title">{item.title}</span>
                          <span className={`badge ${item.readCount && item.progress && item.readCount >= item.progress.owned ? "badge-cyan" : "badge-yellow"}`}>
                            {item.readCount && item.progress && item.readCount >= item.progress.owned ? "Read" : "Reading"}
                          </span>
                        </div>
                        <div className="series-card-author">{item.author}</div>
                        <span className="badge badge-outline">{BOOK_TYPE_LABELS[item.bookType as keyof typeof BOOK_TYPE_LABELS]}</span>
                        {item.progress && (
                          <div className="series-progress">
                            <div className="progress-bar">
                              <div
                                className="progress-fill"
                                style={{ width: `${(item.progress.owned / item.progress.total) * 100}%` }}
                              />
                            </div>
                            <div className="progress-text">
                              {item.progress.owned} of {item.progress.total} volumes owned
                            </div>
                          </div>
                        )}
                      </div>
                    </Link>
                  ) : (
                    <Link to={`/book/${item.id}`} style={{ textDecoration: "none" }}>
                      <div className="card card-pressable">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                          <span className="subtitle" style={{ flex: 1 }}>{item.title}</span>
                          <span className={`badge ${item.isRead ? "badge-cyan" : "badge-yellow"}`}>
                            {item.isRead ? "Read" : "Unread"}
                          </span>
                        </div>
                        <div style={{ color: "var(--text-secondary)", marginBottom: "12px" }}>{item.author}</div>
                        <span className="badge badge-outline">{BOOK_TYPE_LABELS[item.bookType as keyof typeof BOOK_TYPE_LABELS]}</span>
                      </div>
                    </Link>
                  )}
                  {index < libraryItems.length - 1 && (
                    <div className="separator" style={{ gridColumn: "1 / -1" }}>
                      <div className="separator-diamond" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </>
      )}

      {/* Wishlist Tab */}
      {activeTab === "wishlist" && (
        <>
          {wishlist.length === 0 ? (
            <div className="empty-state">
              <h3>Wishlist is empty</h3>
              <p>Add books you want to read later</p>
              <Link to="/search" className="btn btn-primary" style={{ marginTop: "16px" }}>
                Search Books
              </Link>
            </div>
          ) : (
            <div className="grid grid-auto">
              {wishlist.map((book) => (
                <div key={book.id} className="card">
                  <div style={{ marginBottom: "12px" }}>
                    <div className="subtitle">{book.title}</div>
                    <div style={{ color: "var(--text-secondary)" }}>{book.author}</div>
                  </div>
                  <div style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap" }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleMoveToOwned(book.id)}
                      disabled={movingId === book.id}
                    >
                      {movingId === book.id ? "Moving..." : "Move to Owned"}
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleRemoveFromWishlist(book.id)}
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
            <div className="empty-state">
              <h3>No upcoming releases</h3>
              <p>Books with future release dates will appear here</p>
            </div>
          ) : (
            <div className="grid grid-auto">
              {upcoming.map((book) => (
                <div key={book.id} className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <span className="subtitle">{book.title}</span>
                    <span className="badge badge-purple">
                      {new Date(book.releaseDate!).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ color: "var(--text-secondary)" }}>{book.author}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Floating Add Button */}
      <Link
        to="/search"
        className="btn btn-primary"
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          fontSize: "24px",
          padding: 0,
        }}
      >
        +
      </Link>
    </div>
  );
}
