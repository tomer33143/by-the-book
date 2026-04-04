import { useState, useCallback } from 'react';
import { NoteFolder, Note } from '../types';

interface NotesPanelProps {
  folders: NoteFolder[];
  onChange: (folders: NoteFolder[]) => void;
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
                          {note.content.slice(0, 50) || 'ריק'}
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
            <textarea
              className="note-content-textarea"
              value={activeNote.content}
              onChange={e => updateNoteContent(e.target.value)}
              placeholder="כתוב כאן את ההערות שלך..."
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
