import { useState } from 'react';
import { BookCover } from '../types';

interface CoverEditorProps {
  cover: BookCover;
  title: string;
  author: string;
  language: 'he' | 'en';
  onChange: (cover: BookCover) => void;
  onTitleChange: (title: string) => void;
  onAuthorChange: (author: string) => void;
}

const COVER_COLORS = [
  '#8B4513', '#2C1810', '#1a1a2e', '#0f3460', '#16213e',
  '#4a0e0e', '#2d572c', '#1b4332', '#3d0066', '#4a1942',
  '#c0392b', '#2980b9', '#27ae60', '#8e44ad', '#d35400',
  '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#e67e22',
  '#f39c12', '#1abc9c', '#34495e', '#7f8c8d', '#2c3e50',
];

const TEXT_COLORS = [
  '#F5E6C8', '#FFD700', '#FFFFFF', '#E8D5B7', '#FFF8DC',
  '#C0C0C0', '#FFE4B5', '#FAEBD7', '#F0E68C', '#DEB887',
];

const PATTERNS = [
  { value: 'none' as const, label: 'ללא' },
  { value: 'frame' as const, label: 'מסגרת' },
  { value: 'lines' as const, label: 'קווים' },
  { value: 'dots' as const, label: 'נקודות' },
  { value: 'diamond' as const, label: 'יהלומים' },
  { value: 'ornate' as const, label: 'מעוטר' },
];

const FONTS = [
  { name: 'Frank Ruhl Libre', label: 'פרנק רוהל' },
  { name: 'David Libre', label: 'דוד' },
  { name: 'Heebo', label: 'חיבו' },
  { name: 'Rubik', label: 'רוביק' },
  { name: 'Secular One', label: 'סקולר' },
  { name: 'Assistant', label: 'אסיסטנט' },
  { name: 'Noto Sans Hebrew', label: 'נוטו' },
  { name: 'Merriweather', label: 'Merriweather' },
  { name: 'Playfair Display', label: 'Playfair' },
  { name: 'Lora', label: 'Lora' },
];

export default function CoverEditor({ cover, title, author, language, onChange, onTitleChange, onAuthorChange }: CoverEditorProps) {
  const [activeTab, setActiveTab] = useState<'colors' | 'text' | 'pattern'>('colors');
  const isRtl = language === 'he';

  function update(partial: Partial<BookCover>) {
    onChange({ ...cover, ...partial });
  }

  return (
    <div className="cover-editor-layout">
      {/* Live Cover Preview */}
      <div className="cover-preview-area">
        <div className="cover-3d-wrapper">
          <BookCoverPreview cover={cover} title={title} author={author} isRtl={isRtl} />
        </div>
      </div>

      {/* Editing Panel */}
      <div className="cover-panel">
        <h3>עיצוב כריכה</h3>

        <div className="cover-tabs">
          <button className={`cover-tab ${activeTab === 'colors' ? 'active' : ''}`} onClick={() => setActiveTab('colors')}>
            צבעים
          </button>
          <button className={`cover-tab ${activeTab === 'text' ? 'active' : ''}`} onClick={() => setActiveTab('text')}>
            טקסט
          </button>
          <button className={`cover-tab ${activeTab === 'pattern' ? 'active' : ''}`} onClick={() => setActiveTab('pattern')}>
            עיטור
          </button>
        </div>

        {activeTab === 'colors' && (
          <div className="cover-section">
            <label>צבע כריכה</label>
            <div className="cover-color-grid">
              {COVER_COLORS.map(c => (
                <button
                  key={c}
                  className={`cover-color-swatch ${cover.color === c ? 'active' : ''}`}
                  style={{ background: c }}
                  onClick={() => update({ color: c, spineColor: darkenColor(c, 30) })}
                />
              ))}
              <label className="cover-color-custom" title="צבע מותאם אישית">
                <input
                  type="color"
                  value={cover.color}
                  onChange={e => update({ color: e.target.value, spineColor: darkenColor(e.target.value, 30) })}
                />
                <span>+</span>
              </label>
            </div>

            <label>צבע טקסט</label>
            <div className="cover-color-grid">
              {TEXT_COLORS.map(c => (
                <button
                  key={c}
                  className={`cover-color-swatch ${cover.textColor === c ? 'active' : ''}`}
                  style={{ background: c }}
                  onClick={() => update({ textColor: c })}
                />
              ))}
              <label className="cover-color-custom" title="צבע מותאם אישית">
                <input
                  type="color"
                  value={cover.textColor}
                  onChange={e => update({ textColor: e.target.value })}
                />
                <span>+</span>
              </label>
            </div>
          </div>
        )}

        {activeTab === 'text' && (
          <div className="cover-section">
            <label>שם הספר</label>
            <input
              type="text"
              value={title}
              onChange={e => onTitleChange(e.target.value)}
              className="cover-input"
            />

            <label>שם המחבר</label>
            <input
              type="text"
              value={author}
              onChange={e => onAuthorChange(e.target.value)}
              className="cover-input"
            />

            <label>כותרת משנה</label>
            <div className="cover-toggle-row">
              <input
                type="text"
                value={cover.subtitle}
                onChange={e => update({ subtitle: e.target.value, showSubtitle: e.target.value.length > 0 })}
                placeholder="אופציונלי"
                className="cover-input"
              />
            </div>

            <label>גופן כותרת</label>
            <select
              value={cover.titleFont}
              onChange={e => update({ titleFont: e.target.value })}
              className="cover-select"
            >
              {FONTS.map(f => (
                <option key={f.name} value={f.name} style={{ fontFamily: f.name }}>{f.label}</option>
              ))}
            </select>

            <label>גודל כותרת: {cover.titleFontSize}px</label>
            <input
              type="range"
              min={20}
              max={60}
              value={cover.titleFontSize}
              onChange={e => update({ titleFontSize: Number(e.target.value) })}
              className="cover-range"
            />

            <label>גופן מחבר</label>
            <select
              value={cover.authorFont}
              onChange={e => update({ authorFont: e.target.value })}
              className="cover-select"
            >
              {FONTS.map(f => (
                <option key={f.name} value={f.name} style={{ fontFamily: f.name }}>{f.label}</option>
              ))}
            </select>

            <label>גודל מחבר: {cover.authorFontSize}px</label>
            <input
              type="range"
              min={12}
              max={36}
              value={cover.authorFontSize}
              onChange={e => update({ authorFontSize: Number(e.target.value) })}
              className="cover-range"
            />
          </div>
        )}

        {activeTab === 'pattern' && (
          <div className="cover-section">
            <label>סגנון עיטור</label>
            <div className="cover-pattern-grid">
              {PATTERNS.map(p => (
                <button
                  key={p.value}
                  className={`cover-pattern-btn ${cover.pattern === p.value ? 'active' : ''}`}
                  onClick={() => update({ pattern: p.value })}
                >
                  <PatternPreview pattern={p.value} />
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0x00FF) - amount);
  const b = Math.max(0, (num & 0x0000FF) - amount);
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

export function BookCoverPreview({ cover, title, author, isRtl, small }: {
  cover: BookCover;
  title: string;
  author: string;
  isRtl: boolean;
  small?: boolean;
}) {
  const scale = small ? 0.4 : 1;
  const w = 340 * scale;
  const h = 480 * scale;

  return (
    <div
      className={`book-cover-3d ${small ? 'small' : ''}`}
      style={{
        width: w,
        height: h,
        background: cover.color,
        color: cover.textColor,
        direction: isRtl ? 'rtl' : 'ltr',
      }}
    >
      {/* Spine */}
      <div
        className="cover-spine"
        style={{
          background: cover.spineColor,
          [isRtl ? 'right' : 'left']: 0,
        }}
      />

      {/* Pattern overlay */}
      <CoverPattern pattern={cover.pattern} color={cover.textColor} />

      {/* Content */}
      <div className="cover-content">
        <div className="cover-title" style={{
          fontFamily: cover.titleFont,
          fontSize: cover.titleFontSize * scale,
          color: cover.textColor,
        }}>
          {title || 'שם הספר'}
        </div>

        {cover.showSubtitle && cover.subtitle && (
          <div className="cover-subtitle" style={{
            fontFamily: cover.authorFont,
            fontSize: (cover.authorFontSize - 2) * scale,
            color: cover.textColor,
            opacity: 0.8,
          }}>
            {cover.subtitle}
          </div>
        )}

        <div className="cover-divider" style={{ background: cover.textColor }} />

        <div className="cover-author" style={{
          fontFamily: cover.authorFont,
          fontSize: cover.authorFontSize * scale,
          color: cover.textColor,
        }}>
          {author || 'שם המחבר'}
        </div>
      </div>
    </div>
  );
}

function CoverPattern({ pattern, color }: { pattern: BookCover['pattern']; color: string }) {
  const opacity = 0.15;

  if (pattern === 'none') return null;

  if (pattern === 'frame') {
    return (
      <div className="cover-pattern-overlay" style={{ opacity }}>
        <div style={{
          position: 'absolute',
          inset: '16px',
          border: `2px solid ${color}`,
          borderRadius: '2px',
        }} />
        <div style={{
          position: 'absolute',
          inset: '22px',
          border: `1px solid ${color}`,
          borderRadius: '2px',
        }} />
      </div>
    );
  }

  if (pattern === 'lines') {
    return (
      <div className="cover-pattern-overlay" style={{ opacity }}>
        <svg width="100%" height="100%">
          <defs>
            <pattern id="lines" patternUnits="userSpaceOnUse" width="20" height="20">
              <line x1="0" y1="0" x2="0" y2="20" stroke={color} strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#lines)" />
        </svg>
      </div>
    );
  }

  if (pattern === 'dots') {
    return (
      <div className="cover-pattern-overlay" style={{ opacity }}>
        <svg width="100%" height="100%">
          <defs>
            <pattern id="dots" patternUnits="userSpaceOnUse" width="16" height="16">
              <circle cx="8" cy="8" r="1.5" fill={color} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>
    );
  }

  if (pattern === 'diamond') {
    return (
      <div className="cover-pattern-overlay" style={{ opacity }}>
        <svg width="100%" height="100%">
          <defs>
            <pattern id="diamond" patternUnits="userSpaceOnUse" width="24" height="24">
              <path d="M12 0 L24 12 L12 24 L0 12 Z" fill="none" stroke={color} strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diamond)" />
        </svg>
      </div>
    );
  }

  if (pattern === 'ornate') {
    return (
      <div className="cover-pattern-overlay" style={{ opacity: opacity + 0.05 }}>
        <div style={{
          position: 'absolute',
          inset: '12px',
          border: `3px double ${color}`,
        }} />
        <div style={{
          position: 'absolute',
          inset: '20px',
          border: `1px solid ${color}`,
        }} />
        {/* Corner ornaments */}
        {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(corner => {
          const [v, h] = corner.split('-');
          return (
            <div key={corner} style={{
              position: 'absolute',
              [v]: '26px',
              [h]: '26px',
              width: '30px',
              height: '30px',
              borderTop: v === 'top' ? `2px solid ${color}` : 'none',
              borderBottom: v === 'bottom' ? `2px solid ${color}` : 'none',
              borderLeft: h === 'left' ? `2px solid ${color}` : 'none',
              borderRight: h === 'right' ? `2px solid ${color}` : 'none',
            }} />
          );
        })}
        {/* Center ornament */}
        <svg style={{ position: 'absolute', top: '42%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.4 }} width="80" height="20" viewBox="0 0 80 20">
          <path d="M0 10 Q20 0 40 10 Q60 20 80 10" fill="none" stroke={color} strokeWidth="1" />
          <path d="M0 10 Q20 20 40 10 Q60 0 80 10" fill="none" stroke={color} strokeWidth="1" />
        </svg>
      </div>
    );
  }

  return null;
}

function PatternPreview({ pattern }: { pattern: BookCover['pattern'] }) {
  const size = 40;
  return (
    <div style={{ width: size, height: size, background: '#8B4513', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
      {pattern === 'frame' && (
        <div style={{ position: 'absolute', inset: 4, border: '1px solid rgba(245,230,200,0.4)', borderRadius: 1 }} />
      )}
      {pattern === 'lines' && (
        <svg width={size} height={size}>
          {[8, 16, 24, 32].map(x => (
            <line key={x} x1={x} y1={0} x2={x} y2={size} stroke="rgba(245,230,200,0.3)" strokeWidth="0.5" />
          ))}
        </svg>
      )}
      {pattern === 'dots' && (
        <svg width={size} height={size}>
          {[10, 20, 30].map(x => [10, 20, 30].map(y => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={1} fill="rgba(245,230,200,0.4)" />
          )))}
        </svg>
      )}
      {pattern === 'diamond' && (
        <svg width={size} height={size}>
          <path d="M20 4 L36 20 L20 36 L4 20 Z" fill="none" stroke="rgba(245,230,200,0.3)" strokeWidth="0.5" />
        </svg>
      )}
      {pattern === 'ornate' && (
        <>
          <div style={{ position: 'absolute', inset: 3, border: '1px double rgba(245,230,200,0.4)' }} />
          <div style={{ position: 'absolute', inset: 6, border: '0.5px solid rgba(245,230,200,0.3)' }} />
        </>
      )}
    </div>
  );
}
