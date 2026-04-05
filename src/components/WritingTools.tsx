import { useState, useEffect, useCallback, useRef } from 'react';

// ===== 1. Word Count Bar =====
interface WordCountBarProps {
  content: string;
  totalBookContent: string;
}

function countWords(text: string): number {
  const stripped = text.replace(/<[^>]*>/g, '').trim();
  if (!stripped) return 0;
  return stripped.split(/\s+/).filter(Boolean).length;
}

function countChars(text: string): number {
  return text.replace(/<[^>]*>/g, '').length;
}

export function WordCountBar({ content, totalBookContent }: WordCountBarProps) {
  const pageWords = countWords(content);
  const pageChars = countChars(content);
  const totalWords = countWords(totalBookContent);
  const readingTime = Math.max(1, Math.ceil(totalWords / 250));

  return (
    <div className="word-count-bar">
      <span className="wc-item">עמוד: {pageWords} מילים</span>
      <span className="wc-divider">|</span>
      <span className="wc-item">{pageChars} תווים</span>
      <span className="wc-divider">|</span>
      <span className="wc-item">ספר: {totalWords} מילים</span>
      <span className="wc-divider">|</span>
      <span className="wc-item">~{readingTime} דק' קריאה</span>
    </div>
  );
}

// ===== 2. Autosave Indicator =====
interface AutosaveIndicatorProps {
  saving: boolean;
  lastSaved: number | null;
}

export function AutosaveIndicator({ saving, lastSaved }: AutosaveIndicatorProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  const timeAgo = lastSaved ? Math.floor((now - lastSaved) / 1000) : null;
  const timeText = timeAgo === null ? '' : timeAgo < 10 ? 'עכשיו' : timeAgo < 60 ? `לפני ${timeAgo} שניות` : `לפני ${Math.floor(timeAgo / 60)} דקות`;

  return (
    <div className={`autosave-indicator ${saving ? 'saving' : 'saved'}`}>
      {saving ? (
        <><span className="autosave-dot pulse" /> שומר...</>
      ) : (
        <><span className="autosave-dot" /> נשמר {timeText}</>
      )}
    </div>
  );
}

// ===== 3. Focus/Zen Mode =====
interface ZenModeProps {
  active: boolean;
  onToggle: () => void;
}

export function ZenModeToggle({ active, onToggle }: ZenModeProps) {
  return (
    <button
      className={`toolbar-btn zen-btn ${active ? 'active' : ''}`}
      onClick={onToggle}
      title="מצב כתיבה מרוכז"
    >
      {active ? '⊡' : '⊞'}
    </button>
  );
}

// ===== 4. Writing Goals & Sprint Timer =====
interface WritingGoalsProps {
  currentWords: number;
}

export function WritingGoals({ currentWords }: WritingGoalsProps) {
  const [goalWords, setGoalWords] = useState(() => parseInt(localStorage.getItem('btb_goal') || '500'));
  const [sessionStartWords] = useState(currentWords);
  const [sprintActive, setSprintActive] = useState(false);
  const [sprintTime, setSprintTime] = useState(25 * 60); // 25 min default
  const [sprintRemaining, setSprintRemaining] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const wordsWritten = Math.max(0, currentWords - sessionStartWords);
  const progress = Math.min(100, (wordsWritten / goalWords) * 100);

  const startSprint = useCallback((minutes: number) => {
    setSprintRemaining(minutes * 60);
    setSprintActive(true);
    setShowSettings(false);
  }, []);

  const stopSprint = useCallback(() => {
    setSprintActive(false);
    setSprintRemaining(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (sprintActive && sprintRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setSprintRemaining(prev => {
          if (prev <= 1) {
            setSprintActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }
  }, [sprintActive, sprintRemaining]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="writing-goals-panel">
      <div className="goals-header">
        <span>יעד כתיבה</span>
        <button className="goals-settings-btn" onClick={() => setShowSettings(!showSettings)}>⚙</button>
      </div>

      {showSettings && (
        <div className="goals-settings">
          <label>יעד מילים יומי:</label>
          <input
            type="number"
            value={goalWords}
            onChange={e => { const v = parseInt(e.target.value) || 100; setGoalWords(v); localStorage.setItem('btb_goal', v.toString()); }}
            min={50}
            step={50}
          />
          <div className="sprint-presets">
            <span>ספרינט:</span>
            <button onClick={() => startSprint(10)}>10 דק'</button>
            <button onClick={() => startSprint(15)}>15 דק'</button>
            <button onClick={() => startSprint(25)}>25 דק'</button>
          </div>
        </div>
      )}

      <div className="goals-progress">
        <div className="goals-bar">
          <div className="goals-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="goals-text">{wordsWritten} / {goalWords} מילים</span>
      </div>

      {sprintActive && (
        <div className="sprint-timer">
          <span className="sprint-time">{formatTime(sprintRemaining)}</span>
          <button className="sprint-stop" onClick={stopSprint}>עצור</button>
        </div>
      )}
    </div>
  );
}

// ===== 5. Scene Break Ornaments =====
export const SCENE_BREAKS = [
  { id: 'stars', label: '✦ ✦ ✦', html: '<p style="text-align:center;letter-spacing:12px;font-size:18px;margin:24px 0">✦ ✦ ✦</p>' },
  { id: 'dashes', label: '— — —', html: '<p style="text-align:center;letter-spacing:8px;font-size:16px;margin:24px 0">— — —</p>' },
  { id: 'dots', label: '• • •', html: '<p style="text-align:center;letter-spacing:12px;font-size:20px;margin:24px 0">• • •</p>' },
  { id: 'ornate', label: '❧', html: '<p style="text-align:center;font-size:24px;margin:24px 0">❧</p>' },
  { id: 'flower', label: '✿', html: '<p style="text-align:center;font-size:24px;margin:24px 0">❀ ❀ ❀</p>' },
  { id: 'line', label: '───', html: '<p style="text-align:center;letter-spacing:4px;font-size:14px;margin:24px 0;color:#999">─────────────</p>' },
  { id: 'wave', label: '〰', html: '<p style="text-align:center;font-size:18px;margin:24px 0;color:#999">〰〰〰〰〰</p>' },
  { id: 'diamond', label: '◆', html: '<p style="text-align:center;letter-spacing:16px;font-size:12px;margin:24px 0">◆ ◆ ◆</p>' },
];

// ===== 6. Chapter Templates =====
export const CHAPTER_TEMPLATES = [
  {
    id: 'chapter_standard',
    name: 'פרק רגיל',
    icon: '📖',
    html: '<h1 style="text-align:center;margin-bottom:32px">פרק [מספר]</h1><p></p>',
  },
  {
    id: 'chapter_titled',
    name: 'פרק עם כותרת',
    icon: '📑',
    html: '<h2 style="text-align:center;color:#999;margin-bottom:4px">פרק [מספר]</h2><h1 style="text-align:center;margin-bottom:32px">[כותרת הפרק]</h1><p></p>',
  },
  {
    id: 'chapter_epigraph',
    name: 'פרק עם אפיגרף',
    icon: '💬',
    html: '<h1 style="text-align:center;margin-bottom:16px">פרק [מספר]</h1><blockquote><p><em>"ציטוט פתיחה"</em></p><p style="text-align:left;font-size:14px">— מחבר</p></blockquote><p></p>',
  },
  {
    id: 'prologue',
    name: 'פרולוג',
    icon: '🌅',
    html: '<h1 style="text-align:center;margin-bottom:32px;font-style:italic">פרולוג</h1><p></p>',
  },
  {
    id: 'epilogue',
    name: 'אפילוג',
    icon: '🌇',
    html: '<h1 style="text-align:center;margin-bottom:32px;font-style:italic">אפילוג</h1><p></p>',
  },
  {
    id: 'letter',
    name: 'מכתב',
    icon: '✉️',
    html: '<p style="text-align:right"><em>[תאריך]</em></p><p></p><p>ל[שם] היקר/ה,</p><p></p><p></p><p></p><p>בברכה,</p><p>[שם השולח]</p>',
  },
  {
    id: 'diary',
    name: 'יומן',
    icon: '📓',
    html: '<h3>[תאריך]</h3><p></p><p>יומן יקר,</p><p></p>',
  },
  {
    id: 'scene',
    name: 'סצנה',
    icon: '🎬',
    html: '<p><strong>[מיקום] — [זמן]</strong></p><p></p>',
  },
];

// ===== 7. Keyboard Shortcuts Panel =====
interface ShortcutsPanelProps {
  show: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: 'Ctrl+B', desc: 'מודגש' },
  { keys: 'Ctrl+I', desc: 'נטוי' },
  { keys: 'Ctrl+U', desc: 'קו תחתון' },
  { keys: 'Ctrl+Z', desc: 'ביטול' },
  { keys: 'Ctrl+Shift+Z', desc: 'חזרה' },
  { keys: 'Ctrl+Shift+7', desc: 'רשימה ממוספרת' },
  { keys: 'Ctrl+Shift+8', desc: 'רשימת תבליטים' },
  { keys: 'Ctrl+Shift+B', desc: 'ציטוט' },
  { keys: 'Ctrl+K', desc: 'לוח פקודות' },
  { keys: 'F11', desc: 'מצב מרוכז' },
  { keys: 'Ctrl+S', desc: 'שמירה' },
  { keys: 'Ctrl+Shift+1', desc: 'כותרת 1' },
  { keys: 'Ctrl+Shift+2', desc: 'כותרת 2' },
  { keys: 'Ctrl+Shift+3', desc: 'כותרת 3' },
];

export function ShortcutsPanel({ show, onClose }: ShortcutsPanelProps) {
  if (!show) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal shortcuts-modal" onClick={e => e.stopPropagation()}>
        <h3>קיצורי מקלדת ⌨️</h3>
        <div className="shortcuts-grid">
          {SHORTCUTS.map(s => (
            <div key={s.keys} className="shortcut-item">
              <kbd className="shortcut-keys">{s.keys}</kbd>
              <span className="shortcut-desc">{s.desc}</span>
            </div>
          ))}
        </div>
        <button className="btn-secondary" onClick={onClose} style={{ marginTop: 16, width: '100%' }}>סגור</button>
      </div>
    </div>
  );
}

// ===== 8. Command Palette =====
interface CommandPaletteProps {
  show: boolean;
  onClose: () => void;
  pages: { id: string; pageNumber: number; content: string }[];
  onGoToPage: (idx: number) => void;
  onAction: (action: string) => void;
  bookmarks: Set<number>;
}

export function CommandPalette({ show, onClose, pages, onGoToPage, onAction, bookmarks }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (show) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [show]);

  if (!show) return null;

  const actions = [
    { id: 'save', label: 'שמירה', icon: '💾' },
    { id: 'export', label: 'ייצוא PDF', icon: '📄' },
    { id: 'zen', label: 'מצב מרוכז', icon: '🧘' },
    { id: 'shortcuts', label: 'קיצורי מקלדת', icon: '⌨️' },
    { id: 'cover', label: 'עריכת כריכה', icon: '🎨' },
    { id: 'notes', label: 'הערות', icon: '📝' },
    { id: 'addpage', label: 'עמוד חדש', icon: '➕' },
    { id: 'goals', label: 'יעד כתיבה', icon: '🎯' },
    { id: 'theme', label: 'החלפת ערכת נושא', icon: '🌓' },
  ];

  const q = query.toLowerCase();
  const filteredPages = pages.filter(p =>
    p.pageNumber.toString().includes(q) ||
    p.content.replace(/<[^>]*>/g, '').toLowerCase().includes(q)
  ).slice(0, 8);
  const filteredActions = actions.filter(a => a.label.includes(q));

  return (
    <div className="modal-overlay command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={e => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="command-input"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="חפש עמוד, פקודה..."
          onKeyDown={e => { if (e.key === 'Escape') onClose(); }}
        />
        <div className="command-results">
          {filteredActions.length > 0 && (
            <div className="command-section">
              <div className="command-section-title">פקודות</div>
              {filteredActions.map(a => (
                <button key={a.id} className="command-item" onClick={() => { onAction(a.id); onClose(); }}>
                  <span className="command-icon">{a.icon}</span>
                  <span>{a.label}</span>
                </button>
              ))}
            </div>
          )}
          {filteredPages.length > 0 && (
            <div className="command-section">
              <div className="command-section-title">עמודים</div>
              {filteredPages.map((p, i) => (
                <button key={p.id} className="command-item" onClick={() => { onGoToPage(i); onClose(); }}>
                  <span className="command-icon">{bookmarks.has(i) ? '⭐' : '📄'}</span>
                  <span>עמוד {p.pageNumber}</span>
                  <span className="command-preview">{p.content.replace(/<[^>]*>/g, '').slice(0, 40)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== 9. Find & Replace =====
interface FindReplaceProps {
  show: boolean;
  onClose: () => void;
  editor: any;
}

export function FindReplace({ show, onClose, editor }: FindReplaceProps) {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (show) setTimeout(() => inputRef.current?.focus(), 50);
  }, [show]);

  useEffect(() => {
    if (!findText || !editor) { setMatchCount(0); return; }
    const html = editor.getHTML().replace(/<[^>]*>/g, '');
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = html.match(regex);
    setMatchCount(matches ? matches.length : 0);
  }, [findText, editor]);

  const handleReplace = () => {
    if (!findText || !editor) return;
    const content = editor.getHTML();
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const updated = content.replace(regex, replaceText);
    editor.commands.setContent(updated);
  };

  const handleReplaceAll = () => {
    if (!findText || !editor) return;
    const content = editor.getHTML();
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const updated = content.replace(regex, replaceText);
    editor.commands.setContent(updated);
  };

  if (!show) return null;

  return (
    <div className="find-replace-bar">
      <div className="find-row">
        <input ref={inputRef} value={findText} onChange={e => setFindText(e.target.value)} placeholder="חיפוש..." className="find-input"
          onKeyDown={e => { if (e.key === 'Escape') onClose(); }} />
        <span className="find-count">{matchCount} תוצאות</span>
      </div>
      <div className="replace-row">
        <input value={replaceText} onChange={e => setReplaceText(e.target.value)} placeholder="החלפה ב..." className="find-input" />
        <button className="find-btn" onClick={handleReplace}>החלף</button>
        <button className="find-btn" onClick={handleReplaceAll}>החלף הכל</button>
      </div>
      <button className="find-close" onClick={onClose}>✕</button>
    </div>
  );
}

// ===== 10. Session Statistics =====
export function useSessionStats(totalWords: number) {
  const [startWords] = useState(totalWords);
  const [startTime] = useState(Date.now());

  const wordsWritten = Math.max(0, totalWords - startWords);
  const minutes = Math.max(1, Math.floor((Date.now() - startTime) / 60000));
  const wordsPerMinute = Math.round(wordsWritten / minutes);

  return { wordsWritten, minutes, wordsPerMinute };
}
