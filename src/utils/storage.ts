import { User, Book, BookCover, NoteFolder } from '../types';

const USERS_KEY = 'btb_users';
const BOOKS_KEY = 'btb_books';
const SESSION_KEY = 'btb_session';

function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'h_' + Math.abs(hash).toString(36) + '_' + password.length;
}

function getUsers(): User[] {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
}

function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function register(username: string, password: string): { success: boolean; error?: string } {
  if (username.length < 2) return { success: false, error: 'שם משתמש חייב להכיל לפחות 2 תווים' };
  if (password.length < 4) return { success: false, error: 'סיסמה חייבת להכיל לפחות 4 תווים' };

  const users = getUsers();
  if (users.find(u => u.username === username)) {
    return { success: false, error: 'שם משתמש כבר קיים' };
  }

  users.push({ username, passwordHash: hashPassword(password) });
  saveUsers(users);
  localStorage.setItem(SESSION_KEY, username);
  return { success: true };
}

export function login(username: string, password: string): { success: boolean; error?: string } {
  const users = getUsers();
  const user = users.find(u => u.username === username);
  if (!user) return { success: false, error: 'שם משתמש לא נמצא' };
  if (user.passwordHash !== hashPassword(password)) return { success: false, error: 'סיסמה שגויה' };

  localStorage.setItem(SESSION_KEY, username);
  return { success: true };
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getCurrentUser(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

export function getBooks(owner: string): Book[] {
  const data = localStorage.getItem(BOOKS_KEY);
  const allBooks: Book[] = data ? JSON.parse(data) : [];
  return allBooks.filter(b => b.owner === owner).map(migrateBook);
}

function getAllBooks(): Book[] {
  const data = localStorage.getItem(BOOKS_KEY);
  return data ? JSON.parse(data) : [];
}

// Migrate old books that don't have noteFolders
function migrateBook(book: Book): Book {
  if (!book.noteFolders) {
    book.noteFolders = [...DEFAULT_NOTE_FOLDERS];
  }
  return book;
}

export function saveBook(book: Book): void {
  const allBooks = getAllBooks();
  const idx = allBooks.findIndex(b => b.id === book.id);
  book.updatedAt = Date.now();
  if (idx >= 0) {
    allBooks[idx] = book;
  } else {
    allBooks.push(book);
  }
  localStorage.setItem(BOOKS_KEY, JSON.stringify(allBooks));
}

export function deleteBook(bookId: string): void {
  const allBooks = getAllBooks().filter(b => b.id !== bookId);
  localStorage.setItem(BOOKS_KEY, JSON.stringify(allBooks));
}

export const DEFAULT_COVER: BookCover = {
  color: '#8B4513',
  textColor: '#F5E6C8',
  spineColor: '#6B3410',
  pattern: 'frame',
  titleFontSize: 36,
  authorFontSize: 20,
  titleFont: 'Frank Ruhl Libre',
  authorFont: 'Frank Ruhl Libre',
  showSubtitle: false,
  subtitle: '',
  image: null,
};

export const DEFAULT_NOTE_FOLDERS: NoteFolder[] = [
  {
    id: 'folder_characters',
    name: 'דמויות',
    icon: '👤',
    notes: [],
  },
];

export function createNewBook(owner: string, title: string, author: string, language: 'he' | 'en'): Book {
  const book: Book = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    owner,
    title,
    author,
    language,
    cover: { ...DEFAULT_COVER },
    pages: [
      {
        id: 'page_1',
        content: '',
        pageNumber: 1,
      }
    ],
    noteFolders: DEFAULT_NOTE_FOLDERS.map(f => ({ ...f, notes: [...f.notes] })),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  saveBook(book);
  return book;
}
