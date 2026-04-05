import { useState, useCallback, useEffect, useRef } from 'react';
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

const FOLDER_ICONS = ['📁', '👤', '📝', '💡', '⚔️', '🏰', '🗺️', '📊', '🎭', '❤️', '⭐', '🔮', '📌', '🎯', '🧩'];

// ---- Helper: deep operations on nested folder tree ----
function findFolderPath(folders: NoteFolder[], targetId: string, path: number[] = []): number[] | null {
  for (let i = 0; i < folders.length; i++) {
    if (folders[i].id === targetId) return [...path, i];
    if (folders[i].children) {
      const found = findFolderPath(folders[i].children!, targetId, [...path, i]);
      if (found) return found;
    }
  }
  return null;
}

function getFolderByPath(folders: NoteFolder[], path: number[]): NoteFolder | null {
  let current: NoteFolder[] = folders;
  let folder: NoteFolder | null = null;
  for (const idx of path) {
    if (!current[idx]) return null;
    folder = current[idx];
    current = folder.children || [];
  }
  return folder;
}

function updateFolderTree(folders: NoteFolder[], path: number[], updater: (f: NoteFolder) => NoteFolder): NoteFolder[] {
  if (path.length === 0) return folders;
  const result = [...folders];
  const [head, ...rest] = path;
  if (rest.length === 0) {
    result[head] = updater(result[head]);
  } else {
    result[head] = { ...result[head], children: updateFolderTree(result[head].children || [], rest, updater) };
  }
  return result;
}

function removeFolderFromTree(folders: NoteFolder[], path: number[]): { tree: NoteFolder[]; removed: NoteFolder } {
  const result = [...folders];
  if (path.length === 1) {
    const [removed] = result.splice(path[0], 1);
    return { tree: result, removed };
  }
  const [head, ...rest] = path;
  const sub = removeFolderFromTree(result[head].children || [], rest);
  result[head] = { ...result[head], children: sub.tree };
  return { tree: result, removed: sub.removed };
}

function removeNoteFromTree(folders: NoteFolder[], folderPath: number[], noteIdx: number): { tree: NoteFolder[]; removed: Note } {
  let removedNote: Note | null = null;
  const newTree = updateFolderTree(folders, folderPath, f => {
    const notes = [...f.notes];
    [removedNote] = notes.splice(noteIdx, 1);
    return { ...f, notes };
  });
  return { tree: newTree, removed: removedNote! };
}

function addNoteToFolder(folders: NoteFolder[], folderPath: number[], note: Note): NoteFolder[] {
  return updateFolderTree(folders, folderPath, f => ({ ...f, notes: [...f.notes, note] }));
}

function addSubfolder(folders: NoteFolder[], parentPath: number[], subfolder: NoteFolder): NoteFolder[] {
  return updateFolderTree(folders, parentPath, f => ({ ...f, children: [...(f.children || []), subfolder] }));
}

// ---- Rich Note Editor ----
function NoteEditor({ content, onChange }: { content: string; onChange: (c: string) => void }) {
  const [showNoteColors, setShowNoteColors] = useState(false);
  const [showNoteHighlights, setShowNoteHighlights] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit, Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle, Color, FontFamily,
      Highlight.configure({ multicolor: true }),
    ],
    content,
    editorProps: { attributes: { class: 'note-rich-editor', dir: 'rtl' } },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) editor.commands.setContent(content);
  }, [content]);

  if (!editor) return null;

  return (
    <div className="note-editor-wrapper">
      <div className="note-toolbar" onClick={e => e.stopPropagation()}>
        <button className={`note-tb ${editor.isActive('bold') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleBold().run()}><strong>B</strong></button>
        <button className={`note-tb ${editor.isActive('italic') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleItalic().run()}><em>I</em></button>
        <button className={`note-tb ${editor.isActive('underline') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleUnderline().run()}><u>U</u></button>
        <button className={`note-tb ${editor.isActive('strike') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleStrike().run()}><s>S</s></button>
        <span className="note-tb-divider" />
        <div className="note-tb-group">
          <button className="note-tb" onClick={() => { setShowNoteColors(!showNoteColors); setShowNoteHighlights(false); }}>
            <span style={{ borderBottom: `3px solid ${editor.getAttributes('textStyle').color || '#000'}` }}>A</span>
          </button>
          {showNoteColors && (
            <div className="note-tb-dropdown">{NOTE_COLORS.map(c => (
              <button key={c} className="note-color-swatch" style={{ background: c }} onClick={() => { editor.chain().focus().setColor(c).run(); setShowNoteColors(false); }} />
            ))}</div>
          )}
        </div>
        <div className="note-tb-group">
          <button className={`note-tb ${editor.isActive('highlight') ? 'active' : ''}`} onClick={() => { setShowNoteHighlights(!showNoteHighlights); setShowNoteColors(false); }}>
            <span style={{ background: '#ffeaa7', padding: '0 3px', borderRadius: '2px', fontSize: '12px' }}>H</span>
          </button>
          {showNoteHighlights && (
            <div className="note-tb-dropdown">{NOTE_HIGHLIGHTS.map(c => (
              <button key={c} className="note-color-swatch" style={{ background: c }} onClick={() => { editor.chain().focus().toggleHighlight({ color: c }).run(); setShowNoteHighlights(false); }} />
            ))}</div>
          )}
        </div>
        <span className="note-tb-divider" />
        <button className={`note-tb ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H</button>
        <button className={`note-tb ${editor.isActive('bulletList') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleBulletList().run()}>•≡</button>
        <button className={`note-tb ${editor.isActive('orderedList') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1.</button>
        <span className="note-tb-divider" />
        <button className={`note-tb ${editor.isActive({ textAlign: 'right' }) ? 'active' : ''}`} onClick={() => editor.chain().focus().setTextAlign('right').run()}>≡▐</button>
        <button className={`note-tb ${editor.isActive({ textAlign: 'center' }) ? 'active' : ''}`} onClick={() => editor.chain().focus().setTextAlign('center').run()}>≡</button>
        <button className={`note-tb ${editor.isActive({ textAlign: 'left' }) ? 'active' : ''}`} onClick={() => editor.chain().focus().setTextAlign('left').run()}>▐≡</button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

// ---- Recursive Folder Component ----
interface FolderTreeProps {
  folders: NoteFolder[];
  depth: number;
  activePath: number[] | null;
  activeNoteIdx: number | null;
  expandedFolders: Set<string>;
  editingFolderId: string | null;
  editFolderName: string;
  onToggle: (id: string) => void;
  onSelectFolder: (path: number[]) => void;
  onSelectNote: (folderPath: number[], noteIdx: number) => void;
  onAddNote: (path: number[]) => void;
  onAddSubfolder: (path: number[]) => void;
  onDeleteFolder: (path: number[]) => void;
  onStartRename: (id: string, name: string) => void;
  onRename: (path: number[], name: string) => void;
  setEditFolderName: (n: string) => void;
  onDragStartFolder: (path: number[]) => void;
  onDragStartNote: (folderPath: number[], noteIdx: number) => void;
  onDropOnFolder: (targetPath: number[]) => void;
  parentPath?: number[];
  totalFolders: number;
}

function FolderTree({
  folders, depth, activePath, activeNoteIdx, expandedFolders, editingFolderId, editFolderName,
  onToggle, onSelectFolder, onSelectNote, onAddNote, onAddSubfolder, onDeleteFolder,
  onStartRename, onRename, setEditFolderName, onDragStartFolder, onDragStartNote, onDropOnFolder,
  parentPath = [], totalFolders,
}: FolderTreeProps) {
  const [dragOver, setDragOver] = useState<string | null>(null);

  return (
    <>
      {folders.map((folder, idx) => {
        const currentPath = [...parentPath, idx];
        const isActive = activePath && activePath.join(',') === currentPath.join(',') && activeNoteIdx === null;
        const isExpanded = expandedFolders.has(folder.id);

        return (
          <div key={folder.id} className="notes-folder-item" style={{ paddingRight: depth * 16 }}>
            <div
              className={`notes-folder-header ${isActive ? 'active' : ''} ${dragOver === folder.id ? 'drag-over' : ''}`}
              onClick={() => { onToggle(folder.id); onSelectFolder(currentPath); }}
              draggable
              onDragStart={e => { e.dataTransfer.setData('text/plain', ''); onDragStartFolder(currentPath); }}
              onDragOver={e => { e.preventDefault(); setDragOver(folder.id); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => { e.preventDefault(); setDragOver(null); onDropOnFolder(currentPath); }}
            >
              <span className="folder-expand">{isExpanded ? '▾' : '▸'}</span>
              <span className="folder-icon">{folder.icon}</span>
              {editingFolderId === folder.id ? (
                <input
                  className="folder-rename-input"
                  value={editFolderName}
                  onChange={e => setEditFolderName(e.target.value)}
                  onBlur={() => onRename(currentPath, editFolderName)}
                  onKeyDown={e => { if (e.key === 'Enter') onRename(currentPath, editFolderName); }}
                  autoFocus onClick={e => e.stopPropagation()}
                />
              ) : (
                <span className="folder-name">{folder.name}</span>
              )}
              <div className="folder-actions">
                <button className="folder-action-btn" onClick={e => { e.stopPropagation(); onAddNote(currentPath); }} title="הערה חדשה">+</button>
                <button className="folder-action-btn" onClick={e => { e.stopPropagation(); onAddSubfolder(currentPath); }} title="תת-תיקייה">📁+</button>
                <button className="folder-action-btn" onClick={e => { e.stopPropagation(); onStartRename(folder.id, folder.name); }} title="שנה שם">✏️</button>
                {totalFolders > 1 && (
                  <button className="folder-action-btn folder-delete-btn" onClick={e => { e.stopPropagation(); onDeleteFolder(currentPath); }} title="מחק">🗑️</button>
                )}
              </div>
            </div>

            {isExpanded && (
              <div className="notes-list">
                {folder.notes.map((note, nIdx) => {
                  const isNoteActive = activePath && activePath.join(',') === currentPath.join(',') && activeNoteIdx === nIdx;
                  return (
                    <button
                      key={note.id}
                      className={`note-item ${isNoteActive ? 'active' : ''}`}
                      style={{ paddingRight: (depth + 1) * 16 }}
                      onClick={() => onSelectNote(currentPath, nIdx)}
                      draggable
                      onDragStart={e => { e.dataTransfer.setData('text/plain', ''); onDragStartNote(currentPath, nIdx); }}
                    >
                      <span className="note-item-title">{note.title}</span>
                      <span className="note-item-preview">{note.content.replace(/<[^>]*>/g, '').slice(0, 50) || 'ריק'}</span>
                    </button>
                  );
                })}
                {folder.notes.length === 0 && (!folder.children || folder.children.length === 0) && (
                  <div className="notes-empty">
                    <button className="btn-add-note-inline" onClick={() => onAddNote(currentPath)}>+ הוסף הערה</button>
                  </div>
                )}
                {folder.children && folder.children.length > 0 && (
                  <FolderTree
                    folders={folder.children} depth={depth + 1}
                    activePath={activePath} activeNoteIdx={activeNoteIdx}
                    expandedFolders={expandedFolders} editingFolderId={editingFolderId}
                    editFolderName={editFolderName} onToggle={onToggle}
                    onSelectFolder={onSelectFolder} onSelectNote={onSelectNote}
                    onAddNote={onAddNote} onAddSubfolder={onAddSubfolder}
                    onDeleteFolder={onDeleteFolder} onStartRename={onStartRename}
                    onRename={onRename} setEditFolderName={setEditFolderName}
                    onDragStartFolder={onDragStartFolder} onDragStartNote={onDragStartNote}
                    onDropOnFolder={onDropOnFolder} parentPath={currentPath}
                    totalFolders={totalFolders}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

// Count all folders recursively
function countFolders(folders: NoteFolder[]): number {
  let count = folders.length;
  for (const f of folders) { if (f.children) count += countFolders(f.children); }
  return count;
}

// ---- Main NotesPanel ----
export default function NotesPanel({ folders, onChange }: NotesPanelProps) {
  const [activePath, setActivePath] = useState<number[]>([0]);
  const [activeNoteIdx, setActiveNoteIdx] = useState<number | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    const collect = (fs: NoteFolder[]) => { for (const f of fs) { ids.add(f.id); if (f.children) collect(f.children); } };
    collect(folders);
    return ids;
  });
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderIcon, setNewFolderIcon] = useState('📁');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');

  // Drag state
  const dragRef = useRef<{ type: 'folder' | 'note'; folderPath: number[]; noteIdx?: number } | null>(null);

  const activeFolder = getFolderByPath(folders, activePath);
  const activeNote = activeFolder && activeNoteIdx !== null ? activeFolder.notes[activeNoteIdx] : null;

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleAddNote = useCallback((path: number[]) => {
    const newNote: Note = { id: `note_${Date.now()}`, title: 'הערה חדשה', content: '', createdAt: Date.now(), updatedAt: Date.now() };
    const updated = addNoteToFolder(folders, path, newNote);
    onChange(updated);
    setActivePath(path);
    const folder = getFolderByPath(updated, path);
    setActiveNoteIdx(folder ? folder.notes.length - 1 : null);
  }, [folders, onChange]);

  const handleAddSubfolder = useCallback((parentPath: number[]) => {
    const newFolder: NoteFolder = { id: `folder_${Date.now()}`, name: 'תיקייה חדשה', icon: '📁', notes: [], children: [] };
    const updated = addSubfolder(folders, parentPath, newFolder);
    onChange(updated);
    setExpandedFolders(prev => new Set([...prev, newFolder.id]));
  }, [folders, onChange]);

  const handleDeleteFolder = useCallback((path: number[]) => {
    if (countFolders(folders) <= 1) return;
    const { tree } = removeFolderFromTree(folders, path);
    onChange(tree);
    setActivePath([0]);
    setActiveNoteIdx(null);
  }, [folders, onChange]);

  const handleRename = useCallback((path: number[], name: string) => {
    const updated = updateFolderTree(folders, path, f => ({ ...f, name }));
    onChange(updated);
    setEditingFolderId(null);
  }, [folders, onChange]);

  const handleDeleteNote = useCallback(() => {
    if (activeNoteIdx === null) return;
    const { tree } = removeNoteFromTree(folders, activePath, activeNoteIdx);
    onChange(tree);
    setActiveNoteIdx(null);
  }, [folders, activePath, activeNoteIdx, onChange]);

  const updateNoteTitle = useCallback((title: string) => {
    if (activeNoteIdx === null) return;
    const updated = updateFolderTree(folders, activePath, f => ({
      ...f, notes: f.notes.map((n, i) => i === activeNoteIdx ? { ...n, title, updatedAt: Date.now() } : n),
    }));
    onChange(updated);
  }, [folders, activePath, activeNoteIdx, onChange]);

  const updateNoteContent = useCallback((content: string) => {
    if (activeNoteIdx === null) return;
    const updated = updateFolderTree(folders, activePath, f => ({
      ...f, notes: f.notes.map((n, i) => i === activeNoteIdx ? { ...n, content, updatedAt: Date.now() } : n),
    }));
    onChange(updated);
  }, [folders, activePath, activeNoteIdx, onChange]);

  const addRootFolder = useCallback(() => {
    if (!newFolderName.trim()) return;
    const newFolder: NoteFolder = { id: `folder_${Date.now()}`, name: newFolderName.trim(), icon: newFolderIcon, notes: [], children: [] };
    onChange([...folders, newFolder]);
    setExpandedFolders(prev => new Set([...prev, newFolder.id]));
    setShowNewFolder(false);
    setNewFolderName('');
    setNewFolderIcon('📁');
  }, [folders, newFolderName, newFolderIcon, onChange]);

  // Drag & drop handlers
  const onDragStartFolder = (path: number[]) => { dragRef.current = { type: 'folder', folderPath: path }; };
  const onDragStartNote = (folderPath: number[], noteIdx: number) => { dragRef.current = { type: 'note', folderPath, noteIdx }; };

  const onDropOnFolder = useCallback((targetPath: number[]) => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;

    if (drag.type === 'note' && drag.noteIdx !== undefined) {
      // Move note to target folder
      if (drag.folderPath.join(',') === targetPath.join(',')) return;
      const { tree: afterRemove, removed } = removeNoteFromTree(folders, drag.folderPath, drag.noteIdx);
      const final = addNoteToFolder(afterRemove, targetPath, removed);
      onChange(final);
      setActivePath(targetPath);
      const targetFolder = getFolderByPath(final, targetPath);
      setActiveNoteIdx(targetFolder ? targetFolder.notes.length - 1 : null);
    } else if (drag.type === 'folder') {
      // Move folder into target as subfolder
      if (drag.folderPath.join(',') === targetPath.join(',')) return;
      // Don't allow moving into own children
      if (targetPath.join(',').startsWith(drag.folderPath.join(','))) return;
      const { tree: afterRemove, removed } = removeFolderFromTree(folders, drag.folderPath);
      // Recalculate target path after removal
      const targetId = getFolderByPath(folders, targetPath)?.id;
      if (!targetId) return;
      const newTargetPath = findFolderPath(afterRemove, targetId);
      if (!newTargetPath) return;
      const final = addSubfolder(afterRemove, newTargetPath, removed);
      onChange(final);
    }
  }, [folders, onChange]);

  const totalFolders = countFolders(folders);

  return (
    <div className="notes-panel">
      <div className="notes-sidebar">
        <div className="notes-sidebar-header">
          <span>📂 תיקיות</span>
          <button className="btn-add-folder" onClick={() => setShowNewFolder(true)} title="תיקייה חדשה">+</button>
        </div>

        <div className="notes-folder-list">
          <FolderTree
            folders={folders} depth={0}
            activePath={activePath} activeNoteIdx={activeNoteIdx}
            expandedFolders={expandedFolders} editingFolderId={editingFolderId}
            editFolderName={editFolderName} onToggle={toggleFolder}
            onSelectFolder={path => { setActivePath(path); setActiveNoteIdx(null); }}
            onSelectNote={(path, idx) => { setActivePath(path); setActiveNoteIdx(idx); }}
            onAddNote={handleAddNote} onAddSubfolder={handleAddSubfolder}
            onDeleteFolder={handleDeleteFolder}
            onStartRename={(id, name) => { setEditingFolderId(id); setEditFolderName(name); }}
            onRename={handleRename} setEditFolderName={setEditFolderName}
            onDragStartFolder={onDragStartFolder} onDragStartNote={onDragStartNote}
            onDropOnFolder={onDropOnFolder} totalFolders={totalFolders}
          />
        </div>

        {showNewFolder && (
          <div className="new-folder-form">
            <div className="new-folder-icons">
              {FOLDER_ICONS.map(icon => (
                <button key={icon} className={`icon-pick ${newFolderIcon === icon ? 'active' : ''}`} onClick={() => setNewFolderIcon(icon)}>{icon}</button>
              ))}
            </div>
            <input className="new-folder-input" value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
              placeholder="שם התיקייה" onKeyDown={e => { if (e.key === 'Enter') addRootFolder(); }} autoFocus />
            <div className="new-folder-actions">
              <button className="btn-create-folder" onClick={addRootFolder}>יצירה</button>
              <button className="btn-cancel-folder" onClick={() => { setShowNewFolder(false); setNewFolderName(''); }}>ביטול</button>
            </div>
          </div>
        )}
      </div>

      <div className="notes-editor">
        {activeNote ? (
          <>
            <div className="notes-editor-header">
              <input className="note-title-input" value={activeNote.title} onChange={e => updateNoteTitle(e.target.value)} placeholder="כותרת ההערה" />
              <div className="notes-editor-meta">
                <span className="note-folder-badge">{activeFolder?.icon} {activeFolder?.name}</span>
                <button className="btn-delete-note" onClick={handleDeleteNote}>🗑️ מחק הערה</button>
              </div>
            </div>
            <NoteEditor content={activeNote.content} onChange={updateNoteContent} />
          </>
        ) : (
          <div className="notes-empty-state">
            <div className="notes-empty-icon">📝</div>
            <h3>הערות הסופר</h3>
            <p>בחר הערה מהרשימה או צור הערה חדשה</p>
            <p className="notes-hint">גרור הערות ותיקיות כדי לארגן. ההערות לא ייכללו בייצוא ה-PDF</p>
            {activeFolder && (
              <button className="btn-add-note-empty" onClick={() => handleAddNote(activePath)}>
                + הערה חדשה ב{activeFolder.name}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
