import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  getSeries,
  getBooksForSeries,
  getSeriesProgress,
  updateBook,
  deleteSeries,
  BOOK_TYPE_LABELS,
  type Series,
  type Book,
} from "../services/books";

export function SeriesDetailPage() {
  const navigate = useNavigate();
  const { seriesId } = useParams({ from: "/series/$seriesId" });
  const [series, setSeries] = useState<Series | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [progress, setProgress] = useState({ owned: 0, total: 0 });

  const refreshData = () => {
    const foundSeries = getSeries(seriesId);
    if (foundSeries) {
      setSeries(foundSeries);
      setBooks(getBooksForSeries(seriesId));
      setProgress(getSeriesProgress(seriesId));
    }
  };

  useEffect(() => {
    refreshData();
  }, [seriesId]);

  const handleToggleRead = (bookId: string) => {
    const book = books.find((b) => b.id === bookId);
    if (book) {
      updateBook(bookId, { isRead: !book.isRead });
      refreshData();
    }
  };

  const handleMarkAllRead = () => {
    books.forEach((book) => {
      if (!book.isRead) {
        updateBook(book.id, { isRead: true });
      }
    });
    refreshData();
  };

  const handleMarkAllUnread = () => {
    books.forEach((book) => {
      if (book.isRead) {
        updateBook(book.id, { isRead: false });
      }
    });
    refreshData();
  };

  const handleDeleteSeries = () => {
    if (!series) return;
    if (confirm(`Delete "${series.name}" and all its volumes? This cannot be undone.`)) {
      deleteSeries(series.id);
      navigate({ to: "/library" });
    }
  };

  if (!series) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-16">
          <h3 className="font-title text-xl mb-4">Series not found</h3>
          <Link
            to="/library"
            className="inline-block px-6 py-3 bg-coral text-gray-900 font-title border-2 border-gray-900 rounded-lg neo-shadow-md"
          >
            Back to Library
          </Link>
        </div>
      </div>
    );
  }

  const readCount = books.filter((b) => b.isRead).length;
  const readPercentage = books.length > 0 ? Math.round((readCount / books.length) * 100) : 0;
  const collectionPercentage = progress.total > 0 ? Math.round((progress.owned / progress.total) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <Link to="/library" className="px-4 py-2 border-2 border-gray-900 rounded-lg font-title text-sm hover:bg-gray-100 transition-colors">
          ← Back
        </Link>
        <h1 className="font-title text-3xl">Series Details</h1>
        <div className="w-20" />
      </div>

      {/* Series Info */}
      <div className="bg-white border-2 border-gray-900 rounded-xl p-6 neo-shadow-md mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="font-title text-2xl">{series.name}</h2>
            <p className="text-gray-600 mt-1">{series.author}</p>
          </div>
          <span className="px-3 py-1 text-sm border-2 border-gray-300 rounded-full">
            {BOOK_TYPE_LABELS[series.bookType]}
          </span>
        </div>

        {/* Progress Bars */}
        <div className="space-y-4 mt-6">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Collection</span>
              <span>{progress.owned} / {progress.total} volumes ({collectionPercentage}%)</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
              <div className="h-full bg-purple transition-all" style={{ width: `${collectionPercentage}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Read</span>
              <span>{readCount} / {books.length} volumes ({readPercentage}%)</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
              <div className="h-full bg-cyan transition-all" style={{ width: `${readPercentage}%` }} />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 mt-6">
          {readCount < books.length && (
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 bg-cyan text-gray-900 font-title text-sm border-2 border-gray-900 rounded-lg hover:translate-y-0.5 transition-all"
            >
              Mark All as Read
            </button>
          )}
          {readCount > 0 && (
            <button
              onClick={handleMarkAllUnread}
              className="px-4 py-2 border-2 border-gray-900 rounded-lg font-title text-sm hover:bg-gray-100 transition-colors"
            >
              Mark All as Unread
            </button>
          )}
          <button
            onClick={handleDeleteSeries}
            className="px-4 py-2 bg-red-500 text-white font-title text-sm border-2 border-gray-900 rounded-lg hover:bg-red-600 transition-colors"
          >
            Delete Series
          </button>
        </div>
      </div>

      {/* Volumes List */}
      <h3 className="font-title text-xl mb-4">Volumes ({books.length})</h3>

      {books.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No volumes in this series yet
        </div>
      ) : (
        <div className="space-y-3">
          {books
            .sort((a, b) => (a.volumeNumber || 0) - (b.volumeNumber || 0))
            .map((book) => (
              <div
                key={book.id}
                onClick={() => handleToggleRead(book.id)}
                className="bg-white border-2 border-gray-900 rounded-xl p-4 neo-shadow-sm cursor-pointer hover:translate-y-[-1px] hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-lg border-2 border-gray-900 flex items-center justify-center font-title text-xl flex-shrink-0 ${
                      book.isRead ? "bg-cyan" : "bg-yellow"
                    }`}
                  >
                    {book.volumeNumber || "?"}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{book.title}</div>
                    <div className="text-xs text-gray-500">{book.isRead ? "Read" : "Unread"}</div>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 border-gray-900 flex items-center justify-center ${
                      book.isRead ? "bg-cyan" : "bg-transparent"
                    }`}
                  >
                    {book.isRead && <span className="text-sm">✓</span>}
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Missing Volumes */}
      {progress.total > progress.owned && (
        <div className="bg-gray-100 border-2 border-gray-300 rounded-xl p-4 mt-6">
          <h4 className="font-semibold mb-1">Missing Volumes</h4>
          <p className="text-gray-600 text-sm">
            You have {progress.owned} of {progress.total} volumes.
            {progress.total - progress.owned} volume{progress.total - progress.owned > 1 ? "s" : ""} left to collect.
          </p>
        </div>
      )}
    </div>
  );
}
