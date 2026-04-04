import { useState } from 'react';
import { login, register } from '../utils/storage';

interface AuthScreenProps {
  onLogin: (username: string) => void;
}

export default function AuthScreen({ onLogin }: AuthScreenProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (isRegister) {
      if (password !== confirmPassword) {
        setError('הסיסמאות אינן תואמות');
        return;
      }
      const result = register(username, password);
      if (result.success) {
        onLogin(username);
      } else {
        setError(result.error || 'שגיאה בהרשמה');
      }
    } else {
      const result = login(username, password);
      if (result.success) {
        onLogin(username);
      } else {
        setError(result.error || 'שגיאה בהתחברות');
      }
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-bg">
        <div className="auth-bg-shape auth-bg-shape-1" />
        <div className="auth-bg-shape auth-bg-shape-2" />
        <div className="auth-bg-shape auth-bg-shape-3" />
      </div>
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">📖</div>
          <h1>By The Book</h1>
          <p className="auth-subtitle">עורך הספרים המתקדם</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <h2>{isRegister ? 'יצירת חשבון חדש' : 'התחברות'}</h2>

          <div className="input-group">
            <label htmlFor="username">שם משתמש</label>
            <div className="input-wrapper">
              <span className="input-icon">👤</span>
              <input
                id="username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="הכנס שם משתמש"
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">סיסמה</label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="הכנס סיסמה"
                required
                autoComplete={isRegister ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {isRegister && (
            <div className="input-group">
              <label htmlFor="confirm-password">אישור סיסמה</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="הכנס סיסמה שוב"
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-btn">
            {isRegister ? 'הרשמה' : 'התחברות'}
          </button>

          <button
            type="button"
            className="auth-switch"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
              setConfirmPassword('');
            }}
          >
            {isRegister ? 'כבר יש לי חשבון - התחברות' : 'אין לי חשבון - הרשמה'}
          </button>
        </form>
      </div>
    </div>
  );
}
