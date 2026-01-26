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

    const author = result.author_name?.[0] || "Unknown";
    if (bookExists(result.title, author)) {
      alert("This book is already in your library!");
      setAddingId(null);
      return;
    }

    const book = searchResultToBook(result);
    addBook({ ...book, inWishlist: toWishlist });

    await new Promise((r) => setTimeout(r, 300));
    setAddingId(null);

    if (!toWishlist) {
      navigate({ to: "/library" });
    }
  };

  const handleSuggestionClick = (suggestion: SearchResult) => {
    setQuery(suggestion.title);
    setSuggestions([]);
    setLoading(true);
    setSearched(true);
    searchBooks(suggestion.title).then((data) => {
      setResults(data);
      setLoading(false);
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-title text-3xl">Search Books</h1>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="relative mb-8">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, author, or ISBN..."
              className="w-full px-4 py-3 border-2 border-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral focus:border-coral transition-colors"
            />

            {/* Autocomplete Suggestions */}
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border-2 border-t-0 border-gray-900 rounded-b-lg z-10 neo-shadow-md">
                {suggestions.map((s) => (
                  <div
                    key={s.key}
                    onClick={() => handleSuggestionClick(s)}
                    className="flex items-center gap-4 p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-200 last:border-0"
                  >
                    <div className="w-10 h-12 bg-yellow rounded border border-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {s.cover_i ? (
                        <img
                          src={getCoverUrl(s.cover_i, "S")}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-500">?</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{s.title}</div>
                      <div className="text-xs text-gray-500">
                        {s.author_name?.[0] || "Unknown Author"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-coral text-gray-900 font-title border-2 border-gray-900 rounded-lg neo-shadow-md hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50"
          >
            {loading ? "..." : "Search"}
          </button>
        </div>
      </form>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-gray-500">
          <div className="w-6 h-6 border-3 border-gray-300 border-t-coral rounded-full animate-spin mr-3" />
          Searching...
        </div>
      )}

      {/* No Results */}
      {!loading && searched && results.length === 0 && (
        <div className="text-center py-16">
          <h3 className="font-title text-xl mb-2">No results found</h3>
          <p className="text-gray-600">Try a different search term</p>
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((result) => {
            const author = result.author_name?.[0] || "Unknown";
            const alreadyOwned = bookExists(result.title, author);

            return (
              <div key={result.key} className="bg-white border-2 border-gray-900 rounded-xl overflow-hidden neo-shadow-md">
                {/* Cover */}
                <div className="h-48 bg-yellow flex items-center justify-center border-b-2 border-gray-900">
                  {result.cover_i ? (
                    <img
                      src={getCoverUrl(result.cover_i, "M")}
                      alt={result.title}
                      className="h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl text-gray-400">?</span>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h3 className="font-title text-lg line-clamp-2">{result.title}</h3>
                    {alreadyOwned && (
                      <span className="px-2 py-1 text-xs bg-cyan text-gray-900 rounded-full whitespace-nowrap">
                        In Library
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{author}</p>
                  {result.first_publish_year && (
                    <p className="text-xs text-gray-400 mb-4">
                      First published: {result.first_publish_year}
                    </p>
                  )}

                  {!alreadyOwned && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddBook(result, false)}
                        disabled={addingId === result.key}
                        className="flex-1 px-3 py-2 bg-coral text-gray-900 font-title text-sm border-2 border-gray-900 rounded-lg hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50"
                      >
                        {addingId === result.key ? "Adding..." : "Add to Library"}
                      </button>
                      <button
                        onClick={() => handleAddBook(result, true)}
                        disabled={addingId === result.key}
                        className="px-3 py-2 border-2 border-gray-900 rounded-lg font-title text-sm hover:bg-gray-100 transition-colors"
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
