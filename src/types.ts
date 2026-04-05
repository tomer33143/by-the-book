export interface User {
  username: string;
  passwordHash: string;
}

export interface BookCover {
  color: string;
  textColor: string;
  spineColor: string;
  pattern: 'none' | 'lines' | 'dots' | 'diamond' | 'frame' | 'ornate';
  titleFontSize: number;
  authorFontSize: number;
  titleFont: string;
  authorFont: string;
  showSubtitle: boolean;
  subtitle: string;
  image: string | null;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface NoteFolder {
  id: string;
  name: string;
  icon: string;
  notes: Note[];
  children?: NoteFolder[];
}

export interface Chapter {
  id: string;
  title: string;
  icon: string;
  color: string;
  description: string;
  pageIds: string[];
}

export interface Book {
  id: string;
  owner: string;
  title: string;
  author: string;
  language: 'he' | 'en';
  cover: BookCover;
  pages: PageData[];
  chapters: Chapter[];
  noteFolders: NoteFolder[];
  createdAt: number;
  updatedAt: number;
}

export interface PageData {
  id: string;
  content: string;
  pageNumber: number;
  chapter?: string;
}

export type AppView = 'login' | 'register' | 'dashboard' | 'editor';
export type BookView = 'cover' | 'pages' | 'chapters' | 'notes';
