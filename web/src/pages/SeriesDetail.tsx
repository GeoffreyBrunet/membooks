import React, { useState, useEffect } from "react";
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
      <div className="screen">
        <div className="empty-state">
          <h3>Series not found</h3>
          <Link to="/library" className="btn btn-primary" style={{ marginTop: "16px" }}>
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
    <div className="screen">
      {/* Header */}
      <div className="screen-header">
        <Link to="/library" className="btn btn-outline btn-sm">
          ← Back
        </Link>
        <h1 className="title">Series Details</h1>
        <div style={{ width: "80px" }} />
      </div>

      {/* Series Info Card */}
      <div className="card" style={{ marginBottom: "var(--space-xl)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "var(--space-md)" }}>
          <div>
            <h2 className="subtitle">{series.name}</h2>
            <p style={{ color: "var(--text-secondary)", marginTop: "var(--space-xs)" }}>{series.author}</p>
          </div>
          <span className="badge badge-outline">{BOOK_TYPE_LABELS[series.bookType]}</span>
        </div>

        {/* Progress Bars */}
        <div style={{ marginTop: "var(--space-lg)" }}>
          {/* Collection Progress */}
          <div style={{ marginBottom: "var(--space-md)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-xs)" }}>
              <span>Collection</span>
              <span>{progress.owned} / {progress.total} volumes ({collectionPercentage}%)</span>
            </div>
            <div className="progress-bar" style={{ height: "12px" }}>
              <div
                className="progress-fill"
                style={{ width: `${collectionPercentage}%`, background: "var(--purple)" }}
              />
            </div>
          </div>

          {/* Reading Progress */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-xs)" }}>
              <span>Read</span>
              <span>{readCount} / {books.length} volumes ({readPercentage}%)</span>
            </div>
            <div className="progress-bar" style={{ height: "12px" }}>
              <div
                className="progress-fill"
                style={{ width: `${readPercentage}%`, background: "var(--cyan)" }}
              />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: "flex", gap: "var(--space-md)", marginTop: "var(--space-lg)", flexWrap: "wrap" }}>
          {readCount < books.length && (
            <button className="btn btn-secondary btn-sm" onClick={handleMarkAllRead}>
              Mark All as Read
            </button>
          )}
          {readCount > 0 && (
            <button className="btn btn-outline btn-sm" onClick={handleMarkAllUnread}>
              Mark All as Unread
            </button>
          )}
          <button className="btn btn-danger btn-sm" onClick={handleDeleteSeries}>
            Delete Series
          </button>
        </div>
      </div>

      {/* Volumes List */}
      <h3 className="subtitle" style={{ marginBottom: "var(--space-md)" }}>
        Volumes ({books.length})
      </h3>

      {books.length === 0 ? (
        <div className="empty-state">
          <p>No volumes in this series yet</p>
        </div>
      ) : (
        <div className="grid grid-auto">
          {books
            .sort((a, b) => (a.volumeNumber || 0) - (b.volumeNumber || 0))
            .map((book, index) => (
              <React.Fragment key={book.id}>
                <div
                  className="card card-pressable"
                  onClick={() => handleToggleRead(book.id)}
                  style={{ cursor: "pointer" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
                    {/* Volume Number */}
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "8px",
                        background: book.isRead ? "var(--cyan)" : "var(--yellow)",
                        border: "2px solid var(--border-color)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "var(--font-title)",
                        fontSize: "20px",
                        flexShrink: 0,
                      }}
                    >
                      {book.volumeNumber || "?"}
                    </div>

                    {/* Title */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{book.title}</div>
                      <div style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                        {book.isRead ? "Read" : "Unread"}
                      </div>
                    </div>

                    {/* Status indicator */}
                    <div
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        border: "2px solid var(--border-color)",
                        background: book.isRead ? "var(--cyan)" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {book.isRead && (
                        <span style={{ color: "var(--text-primary)", fontSize: "14px" }}>✓</span>
                      )}
                    </div>
                  </div>
                </div>
                {index < books.length - 1 && (
                  <div className="separator" style={{ gridColumn: "1 / -1" }}>
                    <div className="separator-diamond" />
                  </div>
                )}
              </React.Fragment>
            ))}
        </div>
      )}

      {/* Missing Volumes */}
      {progress.total > progress.owned && (
        <div className="card" style={{ marginTop: "var(--space-xl)", background: "var(--bg-secondary)" }}>
          <h4 style={{ marginBottom: "var(--space-sm)" }}>Missing Volumes</h4>
          <p style={{ color: "var(--text-secondary)" }}>
            You have {progress.owned} of {progress.total} volumes.
            {progress.total - progress.owned} volume{progress.total - progress.owned > 1 ? "s" : ""} left to collect.
          </p>
        </div>
      )}
    </div>
  );
}
