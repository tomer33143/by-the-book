import { useState, useCallback } from 'react';
import { Chapter, PageData } from '../types';

interface ChaptersPanelProps {
  chapters: Chapter[];
  pages: PageData[];
  onChange: (chapters: Chapter[]) => void;
  onGoToPage: (pageIdx: number) => void;
}

const CHAPTER_COLORS = [
  '#6c5ce7', '#00b894', '#e17055', '#0984e3', '#fdcb6e',
  '#e84393', '#00cec9', '#636e72', '#d63031', '#a29bfe',
  '#55efc4', '#fab1a0', '#74b9ff', '#ffeaa7', '#ff7675',
  '#81ecec', '#dfe6e9', '#fd79a8', '#2d3436', '#b2bec3',
];

const CHAPTER_ICONS = [
  '📖', '✨', '🌅', '🌙', '⚔️', '💔', '🏰', '🌊',
  '🔥', '🗝️', '💀', '👑', '🌸', '🎭', '🐉', '💫',
  '🕊️', '🌍', '⏳', '🎪', '💎', '🦋', '🌪️', '🏔️',
];

function getPageWords(page: PageData): number {
  const text = page.content.replace(/<[^>]*>/g, '').trim();
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

export default function ChaptersPanel({ chapters, pages, onChange, onGoToPage }: ChaptersPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [showIconPicker, setShowIconPicker] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [showPageAssign, setShowPageAssign] = useState<string | null>(null);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);

  // Pages not assigned to any chapter
  const assignedPageIds = new Set(chapters.flatMap(c => c.pageIds));
  const unassignedPages = pages.filter(p => !assignedPageIds.has(p.id));

  const addChapter = useCallback(() => {
    const newChapter: Chapter = {
      id: `ch_${Date.now()}`,
      title: `פרק ${chapters.length + 1}`,
      icon: '📖',
      color: CHAPTER_COLORS[chapters.length % CHAPTER_COLORS.length],
      description: '',
      pageIds: [],
    };
    onChange([...chapters, newChapter]);
    setEditingId(newChapter.id);
    setEditTitle(newChapter.title);
    setEditDesc('');
  }, [chapters, onChange]);

  const deleteChapter = useCallback((id: string) => {
    onChange(chapters.filter(c => c.id !== id));
  }, [chapters, onChange]);

  const updateChapter = useCallback((id: string, updates: Partial<Chapter>) => {
    onChange(chapters.map(c => c.id === id ? { ...c, ...updates } : c));
  }, [chapters, onChange]);

  const saveEditing = useCallback(() => {
    if (!editingId) return;
    updateChapter(editingId, { title: editTitle, description: editDesc });
    setEditingId(null);
  }, [editingId, editTitle, editDesc, updateChapter]);

  const togglePageInChapter = useCallback((chapterId: string, pageId: string) => {
    onChange(chapters.map(c => {
      if (c.id !== chapterId) return c;
      const has = c.pageIds.includes(pageId);
      return { ...c, pageIds: has ? c.pageIds.filter(id => id !== pageId) : [...c.pageIds, pageId] };
    }));
  }, [chapters, onChange]);

  const moveChapter = useCallback((idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= chapters.length) return;
    const arr = [...chapters];
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    onChange(arr);
  }, [chapters, onChange]);

  const getChapterPages = (ch: Chapter) => pages.filter(p => ch.pageIds.includes(p.id));
  const getChapterWords = (ch: Chapter) => getChapterPages(ch).reduce((sum, p) => sum + getPageWords(p), 0);

  return (
    <div className="chapters-panel">
      <div className="chapters-header">
        <div className="chapters-header-info">
          <h2>מבנה הספר</h2>
          <span className="chapters-count">{chapters.length} פרקים &bull; {pages.length} עמודים</span>
        </div>
        <button className="btn-add-chapter" onClick={addChapter}>
          + פרק חדש
        </button>
      </div>

      {chapters.length === 0 ? (
        <div className="chapters-empty">
          <div className="chapters-empty-icon">📚</div>
          <h3>אין פרקים עדיין</h3>
          <p>חלק את הספר לפרקים כדי לארגן את המבנה שלו</p>
          <button className="btn-add-chapter-big" onClick={addChapter}>
            + צור פרק ראשון
          </button>
        </div>
      ) : (
        <div className="chapters-grid">
          {chapters.map((ch, idx) => {
            const chapterPages = getChapterPages(ch);
            const wordCount = getChapterWords(ch);
            const isExpanded = expandedChapter === ch.id;
            const isEditing = editingId === ch.id;

            return (
              <div
                key={ch.id}
                className={`chapter-card ${isExpanded ? 'expanded' : ''}`}
                style={{ borderTopColor: ch.color }}
              >
                {/* Card Header */}
                <div className="chapter-card-header">
                  <div className="chapter-card-number" style={{ background: ch.color }}>
                    <button
                      className="chapter-icon-btn"
                      onClick={e => { e.stopPropagation(); setShowIconPicker(showIconPicker === ch.id ? null : ch.id); setShowColorPicker(null); }}
                    >
                      {ch.icon}
                    </button>
                    {showIconPicker === ch.id && (
                      <div className="chapter-picker chapter-icon-picker" onClick={e => e.stopPropagation()}>
                        {CHAPTER_ICONS.map(icon => (
                          <button key={icon} className="picker-item" onClick={() => { updateChapter(ch.id, { icon }); setShowIconPicker(null); }}>
                            {icon}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="chapter-card-title-area">
                    {isEditing ? (
                      <input
                        className="chapter-title-input"
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        onBlur={saveEditing}
                        onKeyDown={e => { if (e.key === 'Enter') saveEditing(); }}
                        autoFocus
                        placeholder="שם הפרק..."
                      />
                    ) : (
                      <h3 className="chapter-card-title" onClick={() => { setEditingId(ch.id); setEditTitle(ch.title); setEditDesc(ch.description); }}>
                        {ch.title}
                      </h3>
                    )}
                    <span className="chapter-card-meta">
                      {chapterPages.length} עמודים &bull; {wordCount} מילים
                    </span>
                  </div>

                  <div className="chapter-card-actions">
                    <button className="ch-act-btn" onClick={() => moveChapter(idx, -1)} disabled={idx === 0} title="הזז למעלה">▲</button>
                    <button className="ch-act-btn" onClick={() => moveChapter(idx, 1)} disabled={idx === chapters.length - 1} title="הזז למטה">▼</button>
                    <button
                      className="ch-act-btn"
                      onClick={e => { e.stopPropagation(); setShowColorPicker(showColorPicker === ch.id ? null : ch.id); setShowIconPicker(null); }}
                      title="צבע"
                    >
                      <span className="ch-color-dot" style={{ background: ch.color }} />
                    </button>
                    {showColorPicker === ch.id && (
                      <div className="chapter-picker chapter-color-picker" onClick={e => e.stopPropagation()}>
                        {CHAPTER_COLORS.map(color => (
                          <button key={color} className="picker-color" style={{ background: color }}
                            onClick={() => { updateChapter(ch.id, { color }); setShowColorPicker(null); }} />
                        ))}
                      </div>
                    )}
                    <button className="ch-act-btn" onClick={() => setExpandedChapter(isExpanded ? null : ch.id)} title={isExpanded ? 'סגור' : 'פתח'}>
                      {isExpanded ? '▾' : '▸'}
                    </button>
                    <button className="ch-act-btn ch-delete" onClick={() => deleteChapter(ch.id)} title="מחק פרק">✕</button>
                  </div>
                </div>

                {/* Description */}
                {isEditing && (
                  <textarea
                    className="chapter-desc-input"
                    value={editDesc}
                    onChange={e => setEditDesc(e.target.value)}
                    onBlur={saveEditing}
                    placeholder="תיאור קצר של הפרק..."
                    rows={2}
                  />
                )}
                {!isEditing && ch.description && (
                  <p className="chapter-card-desc" onClick={() => { setEditingId(ch.id); setEditTitle(ch.title); setEditDesc(ch.description); }}>
                    {ch.description}
                  </p>
                )}

                {/* Expanded: show pages */}
                {isExpanded && (
                  <div className="chapter-pages-section">
                    <div className="chapter-pages-header">
                      <span>עמודים בפרק</span>
                      <button className="btn-assign-pages" onClick={() => setShowPageAssign(showPageAssign === ch.id ? null : ch.id)}>
                        {showPageAssign === ch.id ? 'סגור' : '+ שייך עמודים'}
                      </button>
                    </div>

                    {showPageAssign === ch.id && (
                      <div className="page-assign-grid">
                        {pages.map((p, pIdx) => {
                          const isAssigned = ch.pageIds.includes(p.id);
                          const assignedElsewhere = !isAssigned && assignedPageIds.has(p.id);
                          return (
                            <button
                              key={p.id}
                              className={`page-assign-item ${isAssigned ? 'assigned' : ''} ${assignedElsewhere ? 'taken' : ''}`}
                              onClick={() => !assignedElsewhere && togglePageInChapter(ch.id, p.id)}
                              disabled={assignedElsewhere}
                              title={assignedElsewhere ? 'משויך לפרק אחר' : isAssigned ? 'הסר מפרק' : 'שייך לפרק'}
                            >
                              <span className="page-assign-num">{p.pageNumber}</span>
                              <span className="page-assign-preview">{p.content.replace(/<[^>]*>/g, '').slice(0, 30) || 'ריק'}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {chapterPages.length === 0 ? (
                      <div className="chapter-no-pages">
                        אין עמודים בפרק. לחץ "שייך עמודים" כדי להוסיף.
                      </div>
                    ) : (
                      <div className="chapter-page-list">
                        {chapterPages.map(p => {
                          const pageIdx = pages.findIndex(pg => pg.id === p.id);
                          return (
                            <div key={p.id} className="chapter-page-row" onClick={() => onGoToPage(pageIdx)}>
                              <span className="chapter-page-num" style={{ borderColor: ch.color }}>{p.pageNumber}</span>
                              <span className="chapter-page-preview">{p.content.replace(/<[^>]*>/g, '').slice(0, 60) || 'עמוד ריק'}</span>
                              <span className="chapter-page-words">{getPageWords(p)} מילים</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Mini page bar (collapsed view) */}
                {!isExpanded && chapterPages.length > 0 && (
                  <div className="chapter-pages-mini">
                    {chapterPages.map(p => (
                      <div
                        key={p.id}
                        className="chapter-mini-page"
                        style={{ background: ch.color + '30', borderColor: ch.color }}
                        onClick={() => onGoToPage(pages.findIndex(pg => pg.id === p.id))}
                        title={`עמוד ${p.pageNumber}`}
                      >
                        {p.pageNumber}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Unassigned pages */}
      {unassignedPages.length > 0 && chapters.length > 0 && (
        <div className="unassigned-section">
          <h4>עמודים ללא פרק ({unassignedPages.length})</h4>
          <div className="unassigned-pages">
            {unassignedPages.map(p => (
              <div key={p.id} className="unassigned-page" onClick={() => onGoToPage(pages.findIndex(pg => pg.id === p.id))}>
                <span className="unassigned-num">{p.pageNumber}</span>
                <span className="unassigned-preview">{p.content.replace(/<[^>]*>/g, '').slice(0, 40) || 'ריק'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
