import { Book, BookCover, NoteFolder } from '../types';
import { supabase } from './supabase';

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

export async function register(username: string, password: string): Promise<{ success: boolean; error?: string }> {
  if (username.length < 2) return { success: false, error: 'שם משתמש חייב להכיל לפחות 2 תווים' };
  if (password.length < 4) return { success: false, error: 'סיסמה חייבת להכיל לפחות 4 תווים' };

  const { data: existing } = await supabase
    .from('users')
    .select('username')
    .eq('username', username)
    .single();

  if (existing) {
    return { success: false, error: 'שם משתמש כבר קיים' };
  }

  const { error } = await supabase
    .from('users')
    .insert({ username, password_hash: hashPassword(password) });

  if (error) {
    return { success: false, error: 'שגיאה בהרשמה' };
  }

  localStorage.setItem(SESSION_KEY, username);
  return { success: true };
}

export async function login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
  const { data: user } = await supabase
    .from('users')
    .select('username, password_hash')
    .eq('username', username)
    .single();

  if (!user) return { success: false, error: 'שם משתמש לא נמצא' };
  if (user.password_hash !== hashPassword(password)) return { success: false, error: 'סיסמה שגויה' };

  localStorage.setItem(SESSION_KEY, username);
  return { success: true };
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getCurrentUser(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

export async function getBooks(owner: string): Promise<Book[]> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('owner', owner)
    .order('updated_at', { ascending: false });

  if (error || !data) return [];

  return data.map(row => migrateBook({
    id: row.id,
    owner: row.owner,
    title: row.title,
    author: row.author,
    language: row.language as 'he' | 'en',
    cover: row.cover as BookCover,
    pages: row.pages as Book['pages'],
    chapters: (row.cover as any)?._chapters || [],
    noteFolders: row.note_folders as NoteFolder[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

function migrateBook(book: Book): Book {
  if (!book.noteFolders) {
    book.noteFolders = [...DEFAULT_NOTE_FOLDERS];
  }
  if (!book.chapters) {
    book.chapters = [];
  }
  return book;
}

export async function saveBook(book: Book): Promise<void> {
  book.updatedAt = Date.now();

  const { error } = await supabase
    .from('books')
    .upsert({
      id: book.id,
      owner: book.owner,
      title: book.title,
      author: book.author,
      language: book.language,
      cover: { ...book.cover, _chapters: book.chapters || [] },
      pages: book.pages,
      note_folders: book.noteFolders,
      created_at: book.createdAt,
      updated_at: book.updatedAt,
    });

  if (error) {
    console.error('Failed to save book:', error);
  }
}

export async function deleteBook(bookId: string): Promise<void> {
  const { error } = await supabase
    .from('books')
    .delete()
    .eq('id', bookId);

  if (error) {
    console.error('Failed to delete book:', error);
  }
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
    chapters: [],
    noteFolders: DEFAULT_NOTE_FOLDERS.map(f => ({ ...f, notes: [...f.notes] })),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  // Save is now async, caller should await saveBook(book)
  return book;
}
