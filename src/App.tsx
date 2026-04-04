import { useState, useEffect } from 'react';
import { Book, AppView } from './types';
import { getCurrentUser, logout } from './utils/storage';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import BookEditor from './components/BookEditor';

export default function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(getCurrentUser);
  const [view, setView] = useState<AppView>(currentUser ? 'dashboard' : 'login');
  const [activeBook, setActiveBook] = useState<Book | null>(null);

  useEffect(() => {
    if (currentUser) {
      setView('dashboard');
    } else {
      setView('login');
    }
  }, [currentUser]);

  function handleLogin(username: string) {
    setCurrentUser(username);
    setView('dashboard');
  }

  function handleLogout() {
    logout();
    setCurrentUser(null);
    setActiveBook(null);
    setView('login');
  }

  function handleOpenBook(book: Book) {
    setActiveBook(book);
    setView('editor');
  }

  function handleBackToDashboard() {
    setActiveBook(null);
    setView('dashboard');
  }

  if (view === 'login' || view === 'register' || !currentUser) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  if (view === 'editor' && activeBook) {
    return <BookEditor book={activeBook} onBack={handleBackToDashboard} />;
  }

  return (
    <Dashboard
      username={currentUser}
      onLogout={handleLogout}
      onOpenBook={handleOpenBook}
    />
  );
}
