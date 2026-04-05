import { useState, useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Highlight from '@tiptap/extension-highlight';
import { NoteFolder, Note } from '../types';

interface NotesPanelProps {
  folders: NoteFolder[];
  onChange: (folders: NoteFolder[]) => void;
}

const NOTE_COLORS = [
  '#000000', '#c0392b', '#e67e22', '#f1c40f', '#27ae60',
  '#2980b9', '#8e44ad', '#1a1a2e', '#555555', '#999999',
];

const NOTE_HIGHLIGHTS = [
  '#ffeaa7', '#fab1a0', '#a29bfe', '#74b9ff', '#55efc4',
  '#fdcb6e', '#e8daef', '#d5f5e3', '#fadbd8', '#dfe6e9',
];

function NoteEditor({ content, onChange }: { content: string; onChange: (c: string) => void }) {
  const [showNoteColors, setShowNoteColors] = useState(false);
  const [showNoteHighlights, setShowNoteHighlights] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      FontFamily,
      Highlight.configure({ multicolor: true }),
    ],
    content,
    editorProps: {
      attributes: { class: 'note-rich-editor', dir: 'rtl' },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content]);

  if (!editor) return null;

  return (
    <div className="note-editor-wrapper">
      <div className="note-toolbar" onClick={e => e.stopPropagation()}>
        <button className={`note-tb ${editor.isActive('bold') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleBold().run()}>
          <strong>B</strong>
        </button>
        <button className={`note-tb ${editor.isActive('italic') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <em>I</em>
        </button>
        <button className={`note-tb ${editor.isActive('underline') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <u>U</u>
        </button>
        <button className={`note-tb ${editor.isActive('strike') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <s>S</s>
        </button>

        <span className="note-tb-divider" />

        <div className="note-tb-group">
          <button className="note-tb" onClick={() => { setShowNoteColors(!showNoteColors); setShowNoteHighlights(false); }}>
            <span style={{ borderBottom: `3px solid ${editor.getAttributes('textStyle').color || '#000'}` }}>A</span>
          </button>
          {showNoteColors && (
            <div className="note-tb-dropdown">
              {NOTE_COLORS.map(c => (
                <button key={c} className="note-color-swatch" style={{ background: c }}
                  onClick={() => { editor.chain().focus().setColor(c).run(); setShowNoteColors(false); }} />
              ))}
            </div>
          )}
        </div>

        <div className="note-tb-group">
          <button className={`note-tb ${editor.isActive('highlight') ? 'active' : ''}`}
            onClick={() => { setShowNoteHighlights(!showNoteHighlights); setShowNoteColors(false); }}>
            <span style={{ background: '#ffeaa7', padding: '0 3px', borderRadius: '2px', fontSize: '12px' }}>H</span>
          </button>
          {showNoteHighlights && (
            <div className="note-tb-dropdown">
              {NOTE_HIGHLIGHTS.map(c => (
                <button key={c} className="note-color-swatch" style={{ background: c }}
                  onClick={() => { editor.chain().focus().toggleHighlight({ color: c }).run(); setShowNoteHighlights(false); }} />
              ))}
            </div>
          )}
        </div>

        <span className="note-tb-divider" />

        <button className={`note-tb ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H</button>
        <button className={`note-tb ${editor.isActive('bulletList') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}>•≡</button>
        <button className={`note-tb ${editor.isActive('orderedList') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}>1.</button>

        <span className="note-tb-divider" />

        <button className={`note-tb ${editor.isActive({ textAlign: 'right' }) ? 'active' : ''}`}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}>≡▐</button>
        <button className={`note-tb ${editor.isActive({ textAlign: 'center' }) ? 'active' : ''}`}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}>≡</button>
        <button className={`note-tb ${editor.isActive({ textAlign: 'left' }) ? 'active' : ''}`}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}>▐≡</button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

export default function NotesPanel({ folders, onChange }: NotesPanelProps) {
  const [activeFolderIdx, setActiveFolderIdx] = useState(0);
  const [activeNoteIdx, setActiveNoteIdx] = useState<number | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => new Set(folders.map(f => f.id)));
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderIcon, setNewFolderIcon] = useState('📁');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');

  const activeFolder = folders[activeFolderIdx] || null;
  const activeNote = activeFolder && activeNoteIdx !== null ? activeFolder.notes[activeNoteIdx] : null;

  const FOLDER_ICONS = ['📁', '👤', '📝', '💡', '⚔️', '🏰', '🗺️', '📊', '🎭', '❤️', '⭐', '🔮', '📌', '🎯', '🧩'];

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectNote = (folderIdx: number, noteIdx: number) => {
    setActiveFolderIdx(folderIdx);
    setActiveNoteIdx(noteIdx);
  };

  const addFolder = useCallback(() => {
    if (!newFolderName.trim()) return;
    const newFolder: NoteFolder = {
      id: `folder_${Date.now()}`,
      name: newFolderName.trim(),
      icon: newFolderIcon,
      notes: [],
    };
    onChange([...folders, newFolder]);
    setExpandedFolders(prev => new Set([...prev, newFolder.id]));
    setShowNewFolder(false);
    setNewFolderName('');
    setNewFolderIcon('📁');
  }, [folders, newFolderName, newFolderIcon, onChange]);

  const deleteFolder = useCallback((folderIdx: number) => {
    if (folders.length <= 1) return;
    const updated = folders.filter((_, i) => i !== folderIdx);
    onChange(updated);
    if (activeFolderIdx >= updated.length) setActiveFolderIdx(Math.max(0, updated.length - 1));
    setActiveNoteIdx(null);
  }, [folders, activeFolderIdx, onChange]);

  const renameFolder = useCallback((folderIdx: number, name: string) => {
    const updated = folders.map((f, i) => i === folderIdx ? { ...f, name } : f);
    onChange(updated);
    setEditingFolderId(null);
  }, [folders, onChange]);

  const addNote = useCallback((folderIdx: number) => {
    const newNote: Note = {
      id: `note_${Date.now()}`,
      title: 'הערה חדשה',
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = folders.map((f, i) => {
      if (i === folderIdx) return { ...f, notes: [...f.notes, newNote] };
      return f;
    });
    onChange(updated);
    setActiveFolderIdx(folderIdx);
    setActiveNoteIdx(updated[folderIdx].notes.length - 1);
    setExpandedFolders(prev => new Set([...prev, folders[folderIdx].id]));
  }, [folders, onChange]);

  const deleteNote = useCallback(() => {
    if (activeNoteIdx === null || !activeFolder) return;
    const updated = folders.map((f, i) => {
      if (i === activeFolderIdx) {
        return { ...f, notes: f.notes.filter((_, ni) => ni !== activeNoteIdx) };
      }
      return f;
    });
    onChange(updated);
    setActiveNoteIdx(null);
  }, [folders, activeFolderIdx, activeNoteIdx, activeFolder, onChange]);

  const updateNoteTitle = useCallback((title: string) => {
    if (activeNoteIdx === null) return;
    const updated = folders.map((f, i) => {
      if (i === activeFolderIdx) {
        const notes = f.notes.map((n, ni) => ni === activeNoteIdx ? { ...n, title, updatedAt: Date.now() } : n);
        return { ...f, notes };
      }
      return f;
    });
    onChange(updated);
  }, [folders, activeFolderIdx, activeNoteIdx, onChange]);

  const updateNoteContent = useCallback((content: string) => {
    if (activeNoteIdx === null) return;
    const updated = folders.map((f, i) => {
      if (i === activeFolderIdx) {
        const notes = f.notes.map((n, ni) => ni === activeNoteIdx ? { ...n, content, updatedAt: Date.now() } : n);
        return { ...f, notes };
      }
      return f;
    });
    onChange(updated);
  }, [folders, activeFolderIdx, activeNoteIdx, onChange]);

  return (
    <div className="notes-panel">
      {/* Folders sidebar */}
      <div className="notes-sidebar">
        <div className="notes-sidebar-header">
          <span>📂 תיקיות</span>
          <button className="btn-add-folder" onClick={() => setShowNewFolder(true)} title="תיקייה חדשה">+</button>
        </div>

        <div className="notes-folder-list">
          {folders.map((folder, fIdx) => (
            <div key={folder.id} className="notes-folder-item">
              <div
                className={`notes-folder-header ${activeFolderIdx === fIdx && activeNoteIdx === null ? 'active' : ''}`}
                onClick={() => { toggleFolder(folder.id); setActiveFolderIdx(fIdx); setActiveNoteIdx(null); }}
              >
                <span className="folder-expand">{expandedFolders.has(folder.id) ? '▾' : '▸'}</span>
                <span className="folder-icon">{folder.icon}</span>
                {editingFolderId === folder.id ? (
                  <input
                    className="folder-rename-input"
                    value={editFolderName}
                    onChange={e => setEditFolderName(e.target.value)}
                    onBlur={() => renameFolder(fIdx, editFolderName)}
                    onKeyDown={e => { if (e.key === 'Enter') renameFolder(fIdx, editFolderName); }}
                    autoFocus
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <span className="folder-name">{folder.name}</span>
                )}
                <div className="folder-actions">
                  <button
                    className="folder-action-btn"
                    onClick={e => { e.stopPropagation(); addNote(fIdx); }}
                    title="הערה חדשה"
                  >+</button>
                  <button
                    className="folder-action-btn"
                    onClick={e => { e.stopPropagation(); setEditingFolderId(folder.id); setEditFolderName(folder.name); }}
                    title="שנה שם"
                  >✏️</button>
                  {folders.length > 1 && (
                    <button
                      className="folder-action-btn folder-delete-btn"
                      onClick={e => { e.stopPropagation(); deleteFolder(fIdx); }}
                      title="מחק תיקייה"
                    >🗑️</button>
                  )}
                </div>
              </div>

              {expandedFolders.has(folder.id) && (
                <div className="notes-list">
                  {folder.notes.length === 0 ? (
                    <div className="notes-empty">
                      <button className="btn-add-note-inline" onClick={() => addNote(fIdx)}>
                        + הוסף הערה
                      </button>
                    </div>
                  ) : (
                    folder.notes.map((note, nIdx) => (
                      <button
                        key={note.id}
                        className={`note-item ${activeFolderIdx === fIdx && activeNoteIdx === nIdx ? 'active' : ''}`}
                        onClick={() => selectNote(fIdx, nIdx)}
                      >
                        <span className="note-item-title">{note.title}</span>
                        <span className="note-item-preview">
                          {note.content.replace(/<[^>]*>/g, '').slice(0, 50) || 'ריק'}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {showNewFolder && (
          <div className="new-folder-form">
            <div className="new-folder-icons">
              {FOLDER_ICONS.map(icon => (
                <button
                  key={icon}
                  className={`icon-pick ${newFolderIcon === icon ? 'active' : ''}`}
                  onClick={() => setNewFolderIcon(icon)}
                >{icon}</button>
              ))}
            </div>
            <input
              className="new-folder-input"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              placeholder="שם התיקייה"
              onKeyDown={e => { if (e.key === 'Enter') addFolder(); }}
              autoFocus
            />
            <div className="new-folder-actions">
              <button className="btn-create-folder" onClick={addFolder}>יצירה</button>
              <button className="btn-cancel-folder" onClick={() => { setShowNewFolder(false); setNewFolderName(''); }}>ביטול</button>
            </div>
          </div>
        )}
      </div>

      {/* Note editor */}
      <div className="notes-editor">
        {activeNote ? (
          <>
            <div className="notes-editor-header">
              <input
                className="note-title-input"
                value={activeNote.title}
                onChange={e => updateNoteTitle(e.target.value)}
                placeholder="כותרת ההערה"
              />
              <div className="notes-editor-meta">
                <span className="note-folder-badge">{activeFolder?.icon} {activeFolder?.name}</span>
                <button className="btn-delete-note" onClick={deleteNote}>🗑️ מחק הערה</button>
              </div>
            </div>
            <NoteEditor
              content={activeNote.content}
              onChange={updateNoteContent}
            />
          </>
        ) : (
          <div className="notes-empty-state">
            <div className="notes-empty-icon">📝</div>
            <h3>הערות הסופר</h3>
            <p>בחר הערה מהרשימה או צור הערה חדשה</p>
            <p className="notes-hint">ההערות לא ייכללו בייצוא ה-PDF</p>
            {activeFolder && (
              <button className="btn-add-note-empty" onClick={() => addNote(activeFolderIdx)}>
                + הערה חדשה ב{activeFolder.name}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
