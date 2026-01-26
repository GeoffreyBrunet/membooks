import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  getBook,
  updateBook,
  deleteBook,
  BOOK_TYPE_LABELS,
  CATEGORY_LABELS,
  type Book,
  type BookType,
  type BookCategory,
} from "../services/books";

export function BookDetailPage() {
  const navigate = useNavigate();
  const { bookId } = useParams({ from: "/book/$bookId" });
  const [book, setBook] = useState<Book | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    author: "",
    bookType: "novel" as BookType,
    categories: [] as BookCategory[],
    isRead: false,
    notes: "",
  });

  useEffect(() => {
    const foundBook = getBook(bookId);
    if (foundBook) {
      setBook(foundBook);
      setEditForm({
        title: foundBook.title,
        author: foundBook.author,
        bookType: foundBook.bookType,
        categories: foundBook.categories || [],
        isRead: foundBook.isRead,
        notes: foundBook.notes || "",
      });
    }
  }, [bookId]);

  const handleToggleRead = () => {
    if (!book) return;
    updateBook(book.id, { isRead: !book.isRead });
    setBook({ ...book, isRead: !book.isRead });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!book) return;
    updateBook(book.id, editForm);
    setBook({ ...book, ...editForm });
    setEditing(false);
  };

  const handleDelete = () => {
    if (!book) return;
    if (confirm("Are you sure you want to delete this book?")) {
      deleteBook(book.id);
      navigate({ to: "/library" });
    }
  };

  if (!book) {
    return (
      <div className="screen">
        <div className="empty-state">
          <h3>Book not found</h3>
          <Link to="/library" className="btn btn-primary" style={{ marginTop: "16px" }}>
            Back to Library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      {/* Header */}
      <div className="screen-header">
        <Link to="/library" className="btn btn-outline btn-sm">
          ← Back
        </Link>
        <h1 className="title">Book Details</h1>
        <div style={{ width: "80px" }} />
      </div>

      {editing ? (
        /* Edit Form */
        <div className="card" style={{ maxWidth: "600px" }}>
          <h2 className="subtitle" style={{ marginBottom: "var(--space-lg)" }}>Edit Book</h2>
          <form onSubmit={handleSaveEdit}>
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                className="input"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="author">Author</label>
              <input
                type="text"
                id="author"
                className="input"
                value={editForm.author}
                onChange={(e) => setEditForm({ ...editForm, author: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="bookType">Type</label>
              <select
                id="bookType"
                className="input"
                value={editForm.bookType}
                onChange={(e) => setEditForm({ ...editForm, bookType: e.target.value as BookType })}
              >
                {Object.entries(BOOK_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Genre(s)</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-sm)" }}>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <label
                    key={value}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-xs)",
                      padding: "var(--space-xs) var(--space-sm)",
                      borderRadius: "4px",
                      border: "2px solid var(--border-color)",
                      background: editForm.categories.includes(value as BookCategory) ? "var(--purple)" : "transparent",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={editForm.categories.includes(value as BookCategory)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEditForm({ ...editForm, categories: [...editForm.categories, value as BookCategory] });
                        } else {
                          setEditForm({ ...editForm, categories: editForm.categories.filter((c) => c !== value) });
                        }
                      }}
                      style={{ display: "none" }}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                className="input"
                rows={4}
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Your personal notes about this book..."
              />
            </div>

            <div className="form-group">
              <label style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={editForm.isRead}
                  onChange={(e) => setEditForm({ ...editForm, isRead: e.target.checked })}
                  style={{ width: "20px", height: "20px" }}
                />
                <span>Marked as read</span>
              </label>
            </div>

            <div style={{ display: "flex", gap: "var(--space-md)" }}>
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Book Info */
        <>
          <div className="card" style={{ maxWidth: "600px" }}>
            {/* Cover placeholder */}
            {book.coverId && (
              <div style={{ marginBottom: "var(--space-lg)", textAlign: "center" }}>
                <img
                  src={`https://covers.openlibrary.org/b/id/${book.coverId}-L.jpg`}
                  alt={book.title}
                  style={{
                    maxWidth: "200px",
                    maxHeight: "300px",
                    borderRadius: "8px",
                    border: "2px solid var(--border-color)",
                    boxShadow: "var(--shadow-md)",
                  }}
                />
              </div>
            )}

            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "var(--space-md)" }}>
              <h2 className="subtitle" style={{ flex: 1 }}>{book.title}</h2>
              <span className={`badge ${book.isRead ? "badge-cyan" : "badge-yellow"}`}>
                {book.isRead ? "Read" : "Unread"}
              </span>
            </div>

            <div style={{ marginBottom: "var(--space-lg)" }}>
              <p style={{ color: "var(--text-secondary)", fontSize: "18px", marginBottom: "var(--space-md)" }}>
                {book.author}
              </p>
              <div style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap" }}>
                <span className="badge badge-outline">{BOOK_TYPE_LABELS[book.bookType]}</span>
                {book.categories.map((cat) => (
                  <span key={cat} className="badge badge-purple">{CATEGORY_LABELS[cat]}</span>
                ))}
              </div>
            </div>

            {book.isbn && (
              <div style={{ marginBottom: "var(--space-md)" }}>
                <strong>ISBN:</strong> {book.isbn}
              </div>
            )}

            {book.firstPublishYear && (
              <div style={{ marginBottom: "var(--space-md)" }}>
                <strong>First Published:</strong> {book.firstPublishYear}
              </div>
            )}

            {book.notes && (
              <div style={{ marginBottom: "var(--space-lg)" }}>
                <strong>Notes:</strong>
                <p style={{ marginTop: "var(--space-sm)", color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>
                  {book.notes}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="card" style={{ maxWidth: "600px", marginTop: "var(--space-lg)" }}>
            <h3 className="subtitle" style={{ marginBottom: "var(--space-md)" }}>Actions</h3>
            <div style={{ display: "flex", gap: "var(--space-md)", flexWrap: "wrap" }}>
              <button
                className={`btn ${book.isRead ? "btn-outline" : "btn-secondary"}`}
                onClick={handleToggleRead}
              >
                {book.isRead ? "Mark as Unread" : "Mark as Read"}
              </button>
              <button className="btn btn-primary" onClick={() => setEditing(true)}>
                Edit Book
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
