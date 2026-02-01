import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { usePageTitle } from "../hooks/usePageTitle";
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
  usePageTitle("Book Details");
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
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-16">
          <h3 className="font-title text-xl mb-4">Book not found</h3>
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

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <Link to="/library" className="px-4 py-2 border-2 border-gray-900 rounded-lg font-title text-sm hover:bg-gray-100 transition-colors">
          ← Back
        </Link>
        <h1 className="font-title text-3xl">Book Details</h1>
        <div className="w-20" />
      </div>

      {editing ? (
        <div className="bg-white border-2 border-gray-900 rounded-xl p-6 neo-shadow-md">
          <h2 className="font-title text-xl mb-6">Edit Book</h2>
          <form onSubmit={handleSaveEdit} className="space-y-5">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                id="title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                required
                className="w-full px-4 py-3 border-2 border-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral"
              />
            </div>

            <div>
              <label htmlFor="author" className="block text-sm font-medium mb-2">Author</label>
              <input
                type="text"
                id="author"
                value={editForm.author}
                onChange={(e) => setEditForm({ ...editForm, author: e.target.value })}
                required
                className="w-full px-4 py-3 border-2 border-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral"
              />
            </div>

            <div>
              <label htmlFor="bookType" className="block text-sm font-medium mb-2">Type</label>
              <select
                id="bookType"
                value={editForm.bookType}
                onChange={(e) => setEditForm({ ...editForm, bookType: e.target.value as BookType })}
                className="w-full px-4 py-3 border-2 border-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral"
              >
                {Object.entries(BOOK_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Genre(s)</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <label
                    key={value}
                    className={`px-3 py-1.5 rounded-lg border-2 cursor-pointer transition-colors ${
                      editForm.categories.includes(value as BookCategory)
                        ? "bg-purple text-white border-gray-900"
                        : "bg-white border-gray-300 hover:border-gray-900"
                    }`}
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
                      className="hidden"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                id="notes"
                rows={4}
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Your personal notes about this book..."
                className="w-full px-4 py-3 border-2 border-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral resize-none"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={editForm.isRead}
                onChange={(e) => setEditForm({ ...editForm, isRead: e.target.checked })}
                className="w-5 h-5 rounded border-2 border-gray-900"
              />
              <span>Marked as read</span>
            </label>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="px-6 py-3 bg-coral text-gray-900 font-title border-2 border-gray-900 rounded-lg neo-shadow-md hover:translate-y-0.5 hover:shadow-none transition-all"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-6 py-3 border-2 border-gray-900 rounded-lg font-title hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div className="bg-white border-2 border-gray-900 rounded-xl p-6 neo-shadow-md">
            {book.coverId && (
              <div className="mb-6 text-center">
                <img
                  src={`https://covers.openlibrary.org/b/id/${book.coverId}-L.jpg`}
                  alt={book.title}
                  className="max-w-48 max-h-72 mx-auto rounded-lg border-2 border-gray-900 neo-shadow-md"
                />
              </div>
            )}

            <div className="flex justify-between items-start mb-4">
              <h2 className="font-title text-2xl flex-1">{book.title}</h2>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${book.isRead ? "bg-cyan" : "bg-yellow"} text-gray-900`}>
                {book.isRead ? "Read" : "Unread"}
              </span>
            </div>

            <p className="text-gray-600 text-lg mb-4">{book.author}</p>

            <div className="flex flex-wrap gap-2 mb-6">
              <span className="px-3 py-1 text-sm border-2 border-gray-300 rounded-full">
                {BOOK_TYPE_LABELS[book.bookType]}
              </span>
              {book.categories.map((cat) => (
                <span key={cat} className="px-3 py-1 text-sm bg-purple text-white rounded-full">
                  {CATEGORY_LABELS[cat]}
                </span>
              ))}
            </div>

            {book.isbn && (
              <p className="mb-2"><strong>ISBN:</strong> {book.isbn}</p>
            )}

            {book.firstPublishYear && (
              <p className="mb-2"><strong>First Published:</strong> {book.firstPublishYear}</p>
            )}

            {book.notes && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <strong>Notes:</strong>
                <p className="mt-2 text-gray-600 whitespace-pre-wrap">{book.notes}</p>
              </div>
            )}
          </div>

          <div className="bg-white border-2 border-gray-900 rounded-xl p-6 neo-shadow-md mt-6">
            <h3 className="font-title text-lg mb-4">Actions</h3>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleToggleRead}
                className={`px-4 py-2 font-title text-sm border-2 border-gray-900 rounded-lg transition-all ${
                  book.isRead ? "bg-white hover:bg-gray-100" : "bg-cyan hover:translate-y-0.5"
                }`}
              >
                {book.isRead ? "Mark as Unread" : "Mark as Read"}
              </button>
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-coral text-gray-900 font-title text-sm border-2 border-gray-900 rounded-lg hover:translate-y-0.5 transition-all"
              >
                Edit Book
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white font-title text-sm border-2 border-gray-900 rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
