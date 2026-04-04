import { useState, useEffect } from 'react';
import { Book } from '../types';
import { getBooks, createNewBook, saveBook, deleteBook } from '../utils/storage';
import { BookCoverPreview } from './CoverEditor';

interface DashboardProps {
  username: string;
  onLogout: () => void;
  onOpenBook: (book: Book) => void;
}

export default function Dashboard({ username, onLogout, onOpenBook }: DashboardProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewBook, setShowNewBook] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newLanguage, setNewLanguage] = useState<'he' | 'en'>('he');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    getBooks(username).then(books => {
      setBooks(books);
      setLoading(false);
    });
  }, [username]);

  async function handleCreateBook(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const book = createNewBook(username, newTitle.trim(), newAuthor.trim() || username, newLanguage);
    await saveBook(book);
    setBooks(prev => [book, ...prev]);
    setShowNewBook(false);
    setNewTitle('');
    setNewAuthor('');
  }

  async function handleDeleteBook(bookId: string) {
    await deleteBook(bookId);
    setBooks(prev => prev.filter(b => b.id !== bookId));
    setDeleteConfirm(null);
  }

  function formatDate(ts: number) {
    return new Date(ts).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-header-right">
          <div className="dashboard-logo">📖</div>
          <div>
            <h1>By The Book</h1>
            <span className="dashboard-welcome">שלום, {username}</span>
          </div>
        </div>
        <button className="btn-logout" onClick={onLogout}>
          התנתקות
        </button>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-actions">
          <h2>הספרים שלי</h2>
          <button className="btn-new-book" onClick={() => setShowNewBook(true)}>
            + ספר חדש
          </button>
        </div>

        {showNewBook && (
          <div className="modal-overlay" onClick={() => setShowNewBook(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>יצירת ספר חדש</h3>
              <form onSubmit={handleCreateBook}>
                <div className="input-group">
                  <label>שם הספר</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="הכנס שם לספר"
                    required
                    autoFocus
                  />
                </div>
                <div className="input-group">
                  <label>שם המחבר</label>
                  <input
                    type="text"
                    value={newAuthor}
                    onChange={e => setNewAuthor(e.target.value)}
                    placeholder={username}
                  />
                </div>
                <div className="input-group">
                  <label>שפת הספר</label>
                  <div className="language-select">
                    <button
                      type="button"
                      className={`lang-btn ${newLanguage === 'he' ? 'active' : ''}`}
                      onClick={() => setNewLanguage('he')}
                    >
                      עברית 🇮🇱
                    </button>
                    <button
                      type="button"
                      className={`lang-btn ${newLanguage === 'en' ? 'active' : ''}`}
                      onClick={() => setNewLanguage('en')}
                    >
                      English 🇺🇸
                    </button>
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="submit" className="btn-primary">יצירת ספר</button>
                  <button type="button" className="btn-secondary" onClick={() => setShowNewBook(false)}>ביטול</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {deleteConfirm && (
          <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
            <div className="modal modal-small" onClick={e => e.stopPropagation()}>
              <h3>מחיקת ספר</h3>
              <p>האם אתה בטוח שברצונך למחוק את הספר? פעולה זו אינה ניתנת לביטול.</p>
              <div className="modal-actions">
                <button className="btn-danger" onClick={() => handleDeleteBook(deleteConfirm)}>מחק</button>
                <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>ביטול</button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="empty-state">
            <div className="empty-icon">⏳</div>
            <h3>טוען ספרים...</h3>
          </div>
        ) : books.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>אין ספרים עדיין</h3>
            <p>לחץ על "ספר חדש" כדי להתחיל לכתוב את הספר הראשון שלך</p>
          </div>
        ) : (
          <div className="books-grid">
            {books.map(book => (
              <div key={book.id} className="book-card" onClick={() => onOpenBook(book)}>
                <div className="book-card-cover-wrapper">
                  <BookCoverPreview 
                    cover={book.cover} 
                    title={book.title} 
                    author={book.author} 
                    isRtl={book.language === 'he'} 
                    small 
                  />
                  <div className="book-pages-badge">{book.pages.length} עמודים</div>
                </div>
                <div className="book-info">
                  <span className="book-lang">{book.language === 'he' ? '🇮🇱 עברית' : '🇺🇸 English'}</span>
                  <span className="book-date">{formatDate(book.updatedAt)}</span>
                </div>
                <button
                  className="btn-delete-book"
                  onClick={e => {
                    e.stopPropagation();
                    setDeleteConfirm(book.id);
                  }}
                  title="מחק ספר"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
