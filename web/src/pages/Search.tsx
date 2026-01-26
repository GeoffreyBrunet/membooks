import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  searchBooks,
  addBook,
  searchResultToBook,
  getCoverUrl,
  bookExists,
  type SearchResult,
} from "../services/books";

export function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  // Debounced autocomplete
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      const data = await searchBooks(query);
      setSuggestions(data.slice(0, 5));
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    setSuggestions([]);

    const data = await searchBooks(query);
    setResults(data);
    setLoading(false);
  };

  const handleAddBook = async (result: SearchResult, toWishlist: boolean = false) => {
    setAddingId(result.key);

    // Check if already exists
    const author = result.author_name?.[0] || "Unknown";
    if (bookExists(result.title, author)) {
      alert("This book is already in your library!");
      setAddingId(null);
      return;
    }

    const book = searchResultToBook(result);
    addBook({ ...book, inWishlist: toWishlist });

    // Brief delay for feedback
    await new Promise((r) => setTimeout(r, 300));
    setAddingId(null);

    if (!toWishlist) {
      navigate({ to: "/library" });
    }
  };

  const handleSuggestionClick = (suggestion: SearchResult) => {
    setQuery(suggestion.title);
    setSuggestions([]);
    // Trigger search
    setLoading(true);
    setSearched(true);
    searchBooks(suggestion.title).then((data) => {
      setResults(data);
      setLoading(false);
    });
  };

  return (
    <div className="screen">
      {/* Header */}
      <div className="screen-header">
        <h1 className="title">Search Books</h1>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} style={{ position: "relative", marginBottom: "var(--space-xl)" }}>
        <div style={{ display: "flex", gap: "var(--space-md)" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <input
              type="text"
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, author, or ISBN..."
            />

            {/* Autocomplete Suggestions */}
            {suggestions.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: "var(--bg-primary)",
                  border: "2px solid var(--border-color)",
                  borderTop: "none",
                  borderRadius: "0 0 8px 8px",
                  zIndex: 10,
                  boxShadow: "var(--shadow-md)",
                }}
              >
                {suggestions.map((s) => (
                  <div
                    key={s.key}
                    onClick={() => handleSuggestionClick(s)}
                    style={{
                      padding: "var(--space-md)",
                      cursor: "pointer",
                      borderBottom: "1px solid var(--bg-tertiary)",
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-md)",
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = "var(--bg-secondary)")}
                    onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "50px",
                        background: "var(--yellow)",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid var(--border-color)",
                        overflow: "hidden",
                        flexShrink: 0,
                      }}
                    >
                      {s.cover_i ? (
                        <img
                          src={getCoverUrl(s.cover_i, "S")}
                          alt=""
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <span style={{ fontSize: "16px" }}>?</span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {s.title}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                        {s.author_name?.[0] || "Unknown Author"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "..." : "Search"}
          </button>
        </div>
      </form>

      {/* Loading */}
      {loading && (
        <div className="loading">
          <div className="spinner" />
          Searching...
        </div>
      )}

      {/* No Results */}
      {!loading && searched && results.length === 0 && (
        <div className="empty-state">
          <h3>No results found</h3>
          <p>Try a different search term</p>
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div className="grid grid-auto">
          {results.map((result) => {
            const author = result.author_name?.[0] || "Unknown";
            const alreadyOwned = bookExists(result.title, author);

            return (
              <div key={result.key} className="book-card">
                <div className="book-card-cover">
                  {result.cover_i ? (
                    <img src={getCoverUrl(result.cover_i, "M")} alt={result.title} />
                  ) : (
                    <span className="book-card-cover-placeholder">?</span>
                  )}
                </div>
                <div className="book-card-content">
                  <div className="book-card-header">
                    <span className="book-card-title">{result.title}</span>
                    {alreadyOwned && (
                      <span className="badge badge-cyan">In Library</span>
                    )}
                  </div>
                  <div className="book-card-author">{author}</div>
                  {result.first_publish_year && (
                    <div style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "4px" }}>
                      First published: {result.first_publish_year}
                    </div>
                  )}

                  {!alreadyOwned && (
                    <div style={{ display: "flex", gap: "var(--space-sm)", marginTop: "var(--space-md)" }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleAddBook(result, false)}
                        disabled={addingId === result.key}
                        style={{ flex: 1 }}
                      >
                        {addingId === result.key ? "Adding..." : "Add to Library"}
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleAddBook(result, true)}
                        disabled={addingId === result.key}
                      >
                        Wishlist
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
