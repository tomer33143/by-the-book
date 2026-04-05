import { useState, useCallback, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { Book, BookView } from '../types';
import { saveBook } from '../utils/storage';
import { exportBookToPdf } from '../utils/pdfExport';
import FontSizeExtension from './FontSizeExtension';
import CoverEditor, { BookCoverPreview } from './CoverEditor';
import NotesPanel from './NotesPanel';
import {
  WordCountBar, AutosaveIndicator, ZenModeToggle, WritingGoals,
  SCENE_BREAKS, CHAPTER_TEMPLATES, ShortcutsPanel, CommandPalette,
  FindReplace,
} from './WritingTools';

interface BookEditorProps {
  book: Book;
  onBack: () => void;
}

const FONTS_HE = [
  { name: 'David Libre', label: 'דוד' },
  { name: 'Frank Ruhl Libre', label: 'פרנק רוהל' },
  { name: 'Heebo', label: 'חיבו' },
  { name: 'Assistant', label: 'אסיסטנט' },
  { name: 'Rubik', label: 'רוביק' },
  { name: 'Secular One', label: 'סקולר' },
  { name: 'Noto Sans Hebrew', label: 'נוטו' },
  { name: 'Noto Serif Hebrew', label: 'נוטו סריף' },
  { name: 'Amatic SC', label: 'אמאטיק' },
  { name: 'Varela Round', label: 'ורלה' },
  { name: 'Alef', label: 'אלף' },
  { name: 'Suez One', label: 'סואץ' },
  { name: 'Karantina', label: 'קרנטינה' },
  { name: 'Miriam Libre', label: 'מרים' },
  { name: 'Open Sans Hebrew', label: 'אופן סנס' },
  { name: 'Bellefair', label: 'בלפייר' },
  { name: 'Tinos', label: 'טינוס' },
  { name: 'Arimo', label: 'ארימו' },
  { name: 'Cousine', label: 'קוזין' },
  { name: 'IBM Plex Sans Hebrew', label: 'IBM פלקס' },
];

const FONTS_EN = [
  { name: 'Merriweather', label: 'Merriweather' },
  { name: 'Playfair Display', label: 'Playfair' },
  { name: 'Lora', label: 'Lora' },
  { name: 'Georgia', label: 'Georgia' },
  { name: 'Times New Roman', label: 'Times New Roman' },
  { name: 'Arial', label: 'Arial' },
  { name: 'Roboto', label: 'Roboto' },
  { name: 'Open Sans', label: 'Open Sans' },
  { name: 'Montserrat', label: 'Montserrat' },
  { name: 'Poppins', label: 'Poppins' },
  { name: 'Raleway', label: 'Raleway' },
  { name: 'Nunito', label: 'Nunito' },
  { name: 'Crimson Text', label: 'Crimson Text' },
  { name: 'EB Garamond', label: 'Garamond' },
  { name: 'Libre Baskerville', label: 'Baskerville' },
  { name: 'Source Serif Pro', label: 'Source Serif' },
  { name: 'PT Serif', label: 'PT Serif' },
  { name: 'Cormorant Garamond', label: 'Cormorant' },
  { name: 'Spectral', label: 'Spectral' },
  { name: 'Bitter', label: 'Bitter' },
];

const FONT_SIZES = ['10', '11', '12', '13', '14', '16', '18', '20', '22', '24', '28', '32', '36', '40', '48', '56', '64', '72', '80', '96'];

const COLORS = [
  '#000000', '#1a1a2e', '#2c3e50', '#34495e', '#333333',
  '#555555', '#666666', '#7f8c8d', '#999999', '#bdc3c7',
  '#c0392b', '#e74c3c', '#ff6b6b', '#d35400', '#e67e22',
  '#f39c12', '#f1c40f', '#27ae60', '#2ecc71', '#1abc9c',
  '#16a085', '#2980b9', '#3498db', '#5dade2', '#2471a3',
  '#8e44ad', '#9b59b6', '#a569bd', '#6c5ce7', '#fd79a8',
  '#e84393', '#d63031', '#00b894', '#00cec9', '#636e72',
];

const HIGHLIGHT_COLORS = [
  '#ffeaa7', '#fdcb6e', '#fab1a0', '#ff7675', '#fd79a8',
  '#a29bfe', '#74b9ff', '#81ecec', '#55efc4', '#00b894',
  '#dfe6e9', '#ffefd5', '#e8daef', '#d5f5e3', '#fadbd8',
  '#d6eaf8', '#fcf3cf', '#f9e79f', '#abebc6', '#f5b7b1',
];

// Spread helpers
function getSpreadPages(spreadIdx: number, totalPages: number): [number | null, number | null] {
  if (spreadIdx === 0) return [0, null];
  const first = 2 * spreadIdx - 1;
  const second = 2 * spreadIdx;
  return [
    first < totalPages ? first : null,
    second < totalPages ? second : null,
  ];
}

function getSpreadForPage(pageIdx: number): number {
  if (pageIdx === 0) return 0;
  return Math.ceil(pageIdx / 2);
}

function getTotalSpreads(totalPages: number): number {
  if (totalPages <= 1) return 1;
  return 1 + Math.ceil((totalPages - 1) / 2);
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

export default function BookEditor({ book: initialBook, onBack }: BookEditorProps) {
  const [book, setBook] = useState<Book>(initialBook);
  const [bookView, setBookView] = useState<BookView>('cover');
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [currentSpreadIdx, setCurrentSpreadIdx] = useState(0);
  const [flipAnimation, setFlipAnimation] = useState('');
  const isMobile = useIsMobile();
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [pageManageMode, setPageManageMode] = useState(false);
  const [swapSource, setSwapSource] = useState<number | null>(null);
  // New feature states
  const [zenMode, setZenMode] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('btb_theme') === 'dark');
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showSceneBreaks, setShowSceneBreaks] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [bookmarks, setBookmarks] = useState<Set<number>>(() => new Set());
  const [showImageInput, setShowImageInput] = useState(false);
  const [editingChapter, setEditingChapter] = useState<number | null>(null);
  const [chapterInput, setChapterInput] = useState('');
  const autoAdvanceRef = useRef(false);

  // Close all dropdowns/panels at once - ensures only one is open at a time
  const closeAllPanels = useCallback(() => {
    setShowColorPicker(false);
    setShowHighlightPicker(false);
    setShowFontPicker(false);
    setShowSizePicker(false);
    setShowSceneBreaks(false);
    setShowTemplates(false);
    setShowImageInput(false);
    setShowFindReplace(false);
    setShowGoals(false);
    setShowShortcuts(false);
    setShowCommandPalette(false);
  }, []);

  const isRtl = book.language === 'he';
  const fonts = isRtl ? FONTS_HE : FONTS_EN;
  const currentPage = book.pages[currentPageIdx];
  const totalSpreads = getTotalSpreads(book.pages.length);
  const [spreadFirstPage, spreadSecondPage] = getSpreadPages(currentSpreadIdx, book.pages.length);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      TextStyle,
      Color,
      FontFamily,
      FontSizeExtension,
      Highlight.configure({ multicolor: true }),
      Image.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Subscript,
      Superscript,
      Placeholder.configure({ placeholder: isRtl ? 'התחל לכתוב...' : 'Start writing...' }),
      CharacterCount,
    ],
    content: currentPage?.content || '',
    editorProps: {
      attributes: {
        class: 'book-page-editor',
        dir: isRtl ? 'rtl' : 'ltr',
        style: `direction: ${isRtl ? 'rtl' : 'ltr'}; text-align: ${isRtl ? 'right' : 'left'};`,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setBook(prev => {
        const updated = { ...prev, pages: [...prev.pages] };
        updated.pages[currentPageIdx] = { ...updated.pages[currentPageIdx], content: html };
        return updated;
      });
    },
  });

  // Save current editor content to book state
  const saveEditorContent = useCallback(() => {
    if (editor) {
      const html = editor.getHTML();
      setBook(prev => {
        const updated = { ...prev, pages: [...prev.pages] };
        updated.pages[currentPageIdx] = { ...updated.pages[currentPageIdx], content: html };
        return updated;
      });
    }
  }, [editor, currentPageIdx]);

  // Switch to a specific page (also updates spread)
  const switchPage = useCallback((idx: number) => {
    if (editor && idx !== currentPageIdx) {
      saveEditorContent();
      setCurrentPageIdx(idx);
      setCurrentSpreadIdx(getSpreadForPage(idx));
    }
  }, [editor, currentPageIdx, saveEditorContent]);

  // Sync editor content when page changes
  useEffect(() => {
    if (editor && book.pages[currentPageIdx]) {
      const content = book.pages[currentPageIdx].content || '';
      if (editor.getHTML() !== content) {
        editor.commands.setContent(content);
      }
    }
  }, [currentPageIdx, editor]);

  // Auto-advance: detect overflow and move to next page
  useEffect(() => {
    if (!editor || autoAdvanceRef.current) return;
    const checkOverflow = () => {
      const editorEl = document.querySelector('.page-active .book-page-editor');
      if (!editorEl) return;
      if (editorEl.scrollHeight > editorEl.clientHeight + 10) {
        autoAdvanceRef.current = true;
        // Save current, then go to next page (create if needed)
        const nextIdx = currentPageIdx + 1;
        if (nextIdx >= book.pages.length) {
          // Create new page
          setBook(prev => {
            const updated = { ...prev, pages: [...prev.pages] };
            updated.pages.push({ id: `page_${Date.now()}`, content: '', pageNumber: updated.pages.length + 1 });
            return updated;
          });
        }
        setTimeout(() => {
          setCurrentPageIdx(nextIdx);
          setCurrentSpreadIdx(getSpreadForPage(nextIdx));
          autoAdvanceRef.current = false;
        }, 50);
      }
    };
    const timer = setTimeout(checkOverflow, 300);
    return () => clearTimeout(timer);
  }, [editor, book.pages, currentPageIdx]);

  // Activate a page within the current spread (click on a page)
  const activatePage = useCallback((pageIdx: number | null) => {
    if (pageIdx === null || pageIdx === currentPageIdx) return;
    saveEditorContent();
    setCurrentPageIdx(pageIdx);
  }, [currentPageIdx, saveEditorContent]);

  const addPage = useCallback(() => {
    const newIndex = book.pages.length;
    setBook(prev => {
      const updated = { ...prev, pages: [...prev.pages] };
      updated.pages.push({
        id: `page_${Date.now()}`,
        content: '',
        pageNumber: updated.pages.length + 1,
      });
      return updated;
    });
    setTimeout(() => {
      setCurrentPageIdx(newIndex);
      setCurrentSpreadIdx(getSpreadForPage(newIndex));
    }, 0);
  }, [book.pages.length]);

  const deletePage = useCallback(() => {
    if (book.pages.length <= 1) return;
    setBook(prev => {
      const updated = {
        ...prev,
        pages: prev.pages.filter((_, i) => i !== currentPageIdx).map((p, i) => ({ ...p, pageNumber: i + 1 })),
      };
      return updated;
    });
    const newPageIdx = Math.max(0, currentPageIdx - 1);
    setCurrentPageIdx(newPageIdx);
    setCurrentSpreadIdx(getSpreadForPage(newPageIdx));
  }, [currentPageIdx, book.pages.length]);

  // Swap two pages
  const swapPages = useCallback((idxA: number, idxB: number) => {
    if (idxA === idxB) return;
    saveEditorContent();
    setBook(prev => {
      const pages = [...prev.pages];
      [pages[idxA], pages[idxB]] = [pages[idxB], pages[idxA]];
      return { ...prev, pages: pages.map((p, i) => ({ ...p, pageNumber: i + 1 })) };
    });
    setCurrentPageIdx(idxB);
    setCurrentSpreadIdx(getSpreadForPage(idxB));
    setSwapSource(null);
  }, [saveEditorContent]);

  // Move page to a specific position
  const movePage = useCallback((fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return;
    saveEditorContent();
    setBook(prev => {
      const pages = [...prev.pages];
      const [moved] = pages.splice(fromIdx, 1);
      pages.splice(toIdx, 0, moved);
      return { ...prev, pages: pages.map((p, i) => ({ ...p, pageNumber: i + 1 })) };
    });
    setCurrentPageIdx(toIdx);
    setCurrentSpreadIdx(getSpreadForPage(toIdx));
  }, [saveEditorContent]);

  // Insert new page at a specific position (after the given index)
  const insertPageAfter = useCallback((afterIdx: number) => {
    saveEditorContent();
    const insertAt = afterIdx + 1;
    setBook(prev => {
      const pages = [...prev.pages];
      pages.splice(insertAt, 0, {
        id: `page_${Date.now()}`,
        content: '',
        pageNumber: 0,
      });
      return { ...prev, pages: pages.map((p, i) => ({ ...p, pageNumber: i + 1 })) };
    });
    setTimeout(() => {
      setCurrentPageIdx(insertAt);
      setCurrentSpreadIdx(getSpreadForPage(insertAt));
    }, 0);
  }, [saveEditorContent]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    if (editor) {
      const html = editor.getHTML();
      const updatedBook = { ...book, pages: [...book.pages] };
      updatedBook.pages[currentPageIdx] = { ...updatedBook.pages[currentPageIdx], content: html };
      await saveBook(updatedBook);
      setBook(updatedBook);
    } else {
      await saveBook(book);
    }
    setLastSaved(Date.now());
    setTimeout(() => setSaving(false), 800);
  }, [book, editor, currentPageIdx]);

  // Dark mode toggle
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('btb_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setShowCommandPalette(v => !v); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && bookView === 'pages') { e.preventDefault(); setShowFindReplace(v => !v); }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave(); }
      if (e.key === 'F11') { e.preventDefault(); setZenMode(v => !v); }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [bookView, handleSave]);

  // Compute total book content for word count
  const totalBookContent = book.pages.map(p => p.content).join(' ');
  const totalWords = totalBookContent.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length;

  // Toggle bookmark
  const toggleBookmark = useCallback((idx: number) => {
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  }, []);

  // Command palette action handler
  const handleCommandAction = useCallback((action: string) => {
    switch (action) {
      case 'save': handleSave(); break;
      case 'export': handleExport(); break;
      case 'zen': setZenMode(v => !v); break;
      case 'shortcuts': setShowShortcuts(true); break;
      case 'cover': setBookView('cover'); break;
      case 'notes': setBookView('notes'); break;
      case 'addpage': addPage(); break;
      case 'goals': setShowGoals(v => !v); break;
      case 'theme': setDarkMode(v => !v); break;
    }
  }, [handleSave, addPage]);

  const handleExport = useCallback(async () => {
    handleSave();
    setExporting(true);
    try {
      await exportBookToPdf(book);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  }, [book, handleSave]);

  useEffect(() => {
    const interval = setInterval(handleSave, 30000);
    return () => clearInterval(interval);
  }, [handleSave]);

  useEffect(() => {
    function handleClick() {
      setShowColorPicker(false);
      setShowHighlightPicker(false);
      setShowFontPicker(false);
      setShowSizePicker(false);
      setShowSceneBreaks(false);
      setShowTemplates(false);
      setShowImageInput(false);
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Spread navigation with flip animation
  const goToNextSpread = useCallback(() => {
    if (flipAnimation) return;

    if (isMobile) {
      // Mobile: single page navigation
      if (currentPageIdx >= book.pages.length - 1) return;
      saveEditorContent();
      setFlipAnimation('flip-forward');
      setTimeout(() => {
        const nextIdx = currentPageIdx + 1;
        setCurrentPageIdx(nextIdx);
        setCurrentSpreadIdx(getSpreadForPage(nextIdx));
        setFlipAnimation('');
      }, 700);
    } else {
      // Desktop: spread navigation
      if (currentSpreadIdx >= totalSpreads - 1) return;
      saveEditorContent();
      setFlipAnimation('flip-forward');
      setTimeout(() => {
        const nextSpread = currentSpreadIdx + 1;
        setCurrentSpreadIdx(nextSpread);
        const [firstPage] = getSpreadPages(nextSpread, book.pages.length);
        if (firstPage !== null) setCurrentPageIdx(firstPage);
        setFlipAnimation('');
      }, 700);
    }
  }, [currentSpreadIdx, currentPageIdx, totalSpreads, flipAnimation, saveEditorContent, book.pages.length, isMobile]);

  const goToPrevSpread = useCallback(() => {
    if (flipAnimation) return;

    if (isMobile) {
      // Mobile: single page navigation
      if (currentPageIdx <= 0) {
        setBookView('cover');
        return;
      }
      saveEditorContent();
      setFlipAnimation('flip-backward');
      setTimeout(() => {
        const prevIdx = currentPageIdx - 1;
        setCurrentPageIdx(prevIdx);
        setCurrentSpreadIdx(getSpreadForPage(prevIdx));
        setFlipAnimation('');
      }, 700);
    } else {
      // Desktop: spread navigation
      if (currentSpreadIdx <= 0) {
        setBookView('cover');
        return;
      }
      saveEditorContent();
      setFlipAnimation('flip-backward');
      setTimeout(() => {
        const prevSpread = currentSpreadIdx - 1;
        setCurrentSpreadIdx(prevSpread);
        const [firstPage] = getSpreadPages(prevSpread, book.pages.length);
        if (firstPage !== null) setCurrentPageIdx(firstPage);
        setFlipAnimation('');
      }, 700);
    }
  }, [currentSpreadIdx, currentPageIdx, flipAnimation, saveEditorContent, book.pages.length, isMobile]);

  if (!editor) return null;

  const currentFontFamily = editor.getAttributes('textStyle').fontFamily || (isRtl ? 'David Libre' : 'Merriweather');
  const currentFontSize = editor.getAttributes('textStyle').fontSize || '16px';

  // Build spread info text
  const spreadInfoText = (() => {
    if (isMobile) {
      return `עמוד ${currentPageIdx + 1} מתוך ${book.pages.length}`;
    }
    if (currentSpreadIdx === 0) {
      return `עמוד 1 מתוך ${book.pages.length}`;
    }
    const p1 = spreadFirstPage !== null ? book.pages[spreadFirstPage]?.pageNumber : null;
    const p2 = spreadSecondPage !== null ? book.pages[spreadSecondPage]?.pageNumber : null;
    if (p1 && p2) return `עמודים ${p1}-${p2} מתוך ${book.pages.length}`;
    if (p1) return `עמוד ${p1} מתוך ${book.pages.length}`;
    return '';
  })();

  // Render a page (either with editor or preview)
  const renderPageContent = (pageIdx: number | null, isActive: boolean) => {
    if (pageIdx === null) return null;
    const page = book.pages[pageIdx];
    if (!page) return null;

    return (
      <div className="page-inner">
        <div className="page-header">
          <span className="page-header-title">{page.chapter ? `${page.chapter} — ${book.title}` : book.title}</span>
        </div>
        {isActive ? (
          <EditorContent editor={editor} />
        ) : (
          <div
            className="page-content-preview book-page-editor"
            style={{ direction: isRtl ? 'rtl' : 'ltr', textAlign: isRtl ? 'right' : 'left' }}
            dangerouslySetInnerHTML={{ __html: page.content || '<p></p>' }}
          />
        )}
        <div className="page-footer">
          <span className="page-number">{page.pageNumber}</span>
        </div>
      </div>
    );
  };

  return (
    <div className={`editor-container ${isRtl ? 'rtl' : 'ltr'} ${zenMode ? 'zen-mode' : ''} ${darkMode ? 'dark-mode' : ''}`}>
      {/* Top bar */}
      {!zenMode && (
      <div className="editor-topbar">
        <div className="editor-topbar-section">
          <button className="btn-back" onClick={() => { handleSave(); onBack(); }}>
            {isRtl ? '→' : '←'} חזרה
          </button>
          <div className="editor-book-title">
            <span className="book-title-text">{book.title}</span>
            <span className="book-author-text">{book.author}</span>
          </div>
          <AutosaveIndicator saving={saving} lastSaved={lastSaved} />
        </div>

        <div className="editor-view-tabs">
          <button
            className={`view-tab ${bookView === 'cover' ? 'active' : ''}`}
            onClick={() => setBookView('cover')}
          >
            כריכה
          </button>
          <button
            className={`view-tab ${bookView === 'pages' ? 'active' : ''}`}
            onClick={() => setBookView('pages')}
          >
            עמודים
          </button>
          <button
            className={`view-tab ${bookView === 'notes' ? 'active' : ''}`}
            onClick={() => setBookView('notes')}
          >
            הערות
          </button>
        </div>

        <div className="editor-topbar-section">
          <button className="btn-icon-topbar" onClick={() => setDarkMode(v => !v)} title="מצב כהה/בהיר">
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button className="btn-icon-topbar" onClick={() => { closeAllPanels(); setShowShortcuts(true); }} title="קיצורי מקלדת">
            ⌨️
          </button>
          <button className="btn-icon-topbar" onClick={() => { closeAllPanels(); setShowCommandPalette(true); }} title="פלטת פקודות (Ctrl+K)">
            🔍
          </button>
          <button className="btn-save" onClick={handleSave} disabled={saving}>
            {saving ? '✓ נשמר' : '💾 שמירה'}
          </button>
          <button className="btn-export" onClick={handleExport} disabled={exporting}>
            {exporting ? '⏳ מייצא...' : '📄 ייצוא PDF'}
          </button>
        </div>
      </div>
      )}

      {/* COVER VIEW */}
      {bookView === 'cover' && (
        <div className="book-view-cover">
          <CoverEditor
            cover={book.cover}
            title={book.title}
            author={book.author}
            language={book.language}
            onChange={cover => setBook(prev => ({ ...prev, cover }))}
            onTitleChange={title => setBook(prev => ({ ...prev, title }))}
            onAuthorChange={author => setBook(prev => ({ ...prev, author }))}
          />
          <button className="btn-open-book" onClick={() => setBookView('pages')}>
            פתח את הספר ✦
          </button>
        </div>
      )}

      {/* PAGES VIEW */}
      {bookView === 'pages' && (
        <>
          {/* Toolbar - Row 1: Text formatting */}
          <div className="editor-toolbar">
            <div className="toolbar-row">
              <div className="toolbar-group" onClick={e => e.stopPropagation()}>
                <button className="toolbar-dropdown-btn font-picker-btn" onClick={() => { closeAllPanels(); setShowFontPicker(!showFontPicker); }} title="גופן">
                  <span style={{ fontFamily: currentFontFamily }}>{fonts.find(f => f.name === currentFontFamily)?.label || currentFontFamily}</span>
                  <span className="dropdown-arrow">▾</span>
                </button>
                {showFontPicker && (
                  <div className="toolbar-dropdown">{fonts.map(font => (
                    <button key={font.name} className={`dropdown-item ${currentFontFamily === font.name ? 'active' : ''}`} style={{ fontFamily: font.name }}
                      onClick={() => { editor.chain().focus().setFontFamily(font.name).run(); setShowFontPicker(false); }}>{font.label}</button>
                  ))}</div>
                )}
              </div>

              <div className="toolbar-group" onClick={e => e.stopPropagation()}>
                <button className="toolbar-dropdown-btn size-picker-btn" onClick={() => { closeAllPanels(); setShowSizePicker(!showSizePicker); }} title="גודל גופן">
                  <span>{parseInt(currentFontSize)}</span><span className="dropdown-arrow">▾</span>
                </button>
                {showSizePicker && (
                  <div className="toolbar-dropdown">{FONT_SIZES.map(size => (
                    <button key={size} className={`dropdown-item ${parseInt(currentFontSize) === parseInt(size) ? 'active' : ''}`}
                      onClick={() => { editor.chain().focus().setFontSize(`${size}px`).run(); setShowSizePicker(false); }}>{size}</button>
                  ))}</div>
                )}
              </div>

              <div className="toolbar-divider" />

              {/* Text style */}
              <button className={`toolbar-btn ${editor.isActive('bold') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleBold().run()} title="מודגש (Ctrl+B)"><strong>B</strong></button>
              <button className={`toolbar-btn ${editor.isActive('italic') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleItalic().run()} title="נטוי (Ctrl+I)"><em>I</em></button>
              <button className={`toolbar-btn ${editor.isActive('underline') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleUnderline().run()} title="קו תחתון (Ctrl+U)"><u>U</u></button>
              <button className={`toolbar-btn ${editor.isActive('strike') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleStrike().run()} title="קו חוצה"><s>S</s></button>
              <button className={`toolbar-btn ${editor.isActive('superscript') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleSuperscript().run()} title="כתב עילי">X²</button>
              <button className={`toolbar-btn ${editor.isActive('subscript') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleSubscript().run()} title="כתב תחתי">X₂</button>

              <div className="toolbar-divider" />

              {/* Color & highlight */}
              <div className="toolbar-group" onClick={e => e.stopPropagation()}>
                <button className="toolbar-btn color-btn" onClick={() => { closeAllPanels(); setShowColorPicker(!showColorPicker); }} title="צבע טקסט">
                  <span style={{ borderBottom: `3px solid ${editor.getAttributes('textStyle').color || '#1a1a2e'}` }}>A</span>
                </button>
                {showColorPicker && (
                  <div className="toolbar-dropdown color-grid">
                    {COLORS.map(color => (<button key={color} className="color-swatch" style={{ background: color }} onClick={() => { editor.chain().focus().setColor(color).run(); setShowColorPicker(false); }} />))}
                    <button className="color-swatch color-reset" onClick={() => { editor.chain().focus().unsetColor().run(); setShowColorPicker(false); }}>✕</button>
                  </div>
                )}
              </div>
              <div className="toolbar-group" onClick={e => e.stopPropagation()}>
                <button className={`toolbar-btn ${editor.isActive('highlight') ? 'active' : ''}`} onClick={() => { closeAllPanels(); setShowHighlightPicker(!showHighlightPicker); }} title="הדגשת רקע">
                  <span style={{ background: '#ffeaa7', padding: '0 4px', borderRadius: '2px' }}>H</span>
                </button>
                {showHighlightPicker && (
                  <div className="toolbar-dropdown color-grid">
                    {HIGHLIGHT_COLORS.map(color => (<button key={color} className="color-swatch" style={{ background: color }} onClick={() => { editor.chain().focus().toggleHighlight({ color }).run(); setShowHighlightPicker(false); }} />))}
                    <button className="color-swatch color-reset" onClick={() => { editor.chain().focus().unsetHighlight().run(); setShowHighlightPicker(false); }}>✕</button>
                  </div>
                )}
              </div>

              <div className="toolbar-divider" />

              {/* Headings */}
              <button className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="כותרת 1">H1</button>
              <button className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="כותרת 2">H2</button>
              <button className={`toolbar-btn ${editor.isActive('heading', { level: 3 }) ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="כותרת 3">H3</button>

              <div className="toolbar-divider" />

              {/* Undo / Redo */}
              <button className="toolbar-btn" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="ביטול (Ctrl+Z)">↩</button>
              <button className="toolbar-btn" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="חזרה (Ctrl+Y)">↪</button>
            </div>

            {/* Row 2: Paragraph, insert, tools */}
            <div className="toolbar-row">
              {/* Alignment */}
              <button className={`toolbar-btn ${editor.isActive({ textAlign: 'right' }) ? 'active' : ''}`} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="ימין">≡▐</button>
              <button className={`toolbar-btn ${editor.isActive({ textAlign: 'center' }) ? 'active' : ''}`} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="מרכז">≡</button>
              <button className={`toolbar-btn ${editor.isActive({ textAlign: 'left' }) ? 'active' : ''}`} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="שמאל">▐≡</button>
              <button className={`toolbar-btn ${editor.isActive({ textAlign: 'justify' }) ? 'active' : ''}`} onClick={() => editor.chain().focus().setTextAlign('justify').run()} title="מלא">☰</button>

              <div className="toolbar-divider" />

              {/* Lists & structure */}
              <button className={`toolbar-btn ${editor.isActive('bulletList') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleBulletList().run()} title="רשימה">•≡</button>
              <button className={`toolbar-btn ${editor.isActive('orderedList') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="ממוספר">1.</button>
              <button className={`toolbar-btn ${editor.isActive('blockquote') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="ציטוט">❝</button>
              <button className="toolbar-btn" onClick={() => editor.chain().focus().setHorizontalRule().run()} title="קו מפריד">─</button>
              <button className="toolbar-btn" onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="בלוק קוד">{'</>'}</button>
              <button className="toolbar-btn" onClick={() => editor.chain().focus().toggleCode().run()} title="קוד בשורה">{'{}'}</button>

              <div className="toolbar-divider" />

              {/* Indent */}
              <button className="toolbar-btn" onClick={() => editor.chain().focus().sinkListItem('listItem').run()} title="הגדל כניסה">→⫿</button>
              <button className="toolbar-btn" onClick={() => editor.chain().focus().liftListItem('listItem').run()} title="הקטן כניסה">⫿←</button>

              <div className="toolbar-divider" />

              {/* Insert - scene breaks, templates, image, table */}
              <div className="toolbar-group" onClick={e => e.stopPropagation()}>
                <button className="toolbar-btn" onClick={() => { closeAllPanels(); setShowSceneBreaks(!showSceneBreaks); }} title="מפריד סצנות">✦</button>
                {showSceneBreaks && (
                  <div className="toolbar-dropdown scene-breaks-dropdown">{SCENE_BREAKS.map(sb => (
                    <button key={sb.id} className="dropdown-item scene-break-item" onClick={() => { editor.chain().focus().insertContent(sb.html).run(); setShowSceneBreaks(false); }}>
                      <span dangerouslySetInnerHTML={{ __html: sb.html }} />
                    </button>
                  ))}</div>
                )}
              </div>
              <div className="toolbar-group" onClick={e => e.stopPropagation()}>
                <button className="toolbar-btn" onClick={() => { closeAllPanels(); setShowTemplates(!showTemplates); }} title="תבניות פרקים">📋</button>
                {showTemplates && (
                  <div className="toolbar-dropdown templates-dropdown">{CHAPTER_TEMPLATES.map(tpl => (
                    <button key={tpl.id} className="dropdown-item template-item" onClick={() => { editor.chain().focus().insertContent(tpl.html).run(); setShowTemplates(false); }}>
                      <span>{tpl.icon}</span> <strong>{tpl.name}</strong>
                    </button>
                  ))}</div>
                )}
              </div>
              <div className="toolbar-group" onClick={e => e.stopPropagation()}>
                <button className="toolbar-btn" onClick={() => { closeAllPanels(); setShowImageInput(!showImageInput); }} title="הוספת תמונה">🖼️</button>
                {showImageInput && (
                  <div className="toolbar-dropdown image-input-dropdown">
                    <label>URL של תמונה:</label>
                    <input type="url" placeholder="https://..." autoFocus onKeyDown={e => {
                      if (e.key === 'Enter') { const url = (e.target as HTMLInputElement).value; if (url) { editor.chain().focus().setImage({ src: url }).run(); } setShowImageInput(false); }
                    }} />
                  </div>
                )}
              </div>
              <button className="toolbar-btn" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="הוספת טבלה">⊞</button>

              <div className="toolbar-divider" />

              {/* Table actions (when inside table) */}
              {editor.isActive('table') && (
                <>
                  <button className="toolbar-btn" onClick={() => editor.chain().focus().addColumnAfter().run()} title="הוסף עמודה">+▐</button>
                  <button className="toolbar-btn" onClick={() => editor.chain().focus().deleteColumn().run()} title="מחק עמודה">-▐</button>
                  <button className="toolbar-btn" onClick={() => editor.chain().focus().addRowAfter().run()} title="הוסף שורה">+▬</button>
                  <button className="toolbar-btn" onClick={() => editor.chain().focus().deleteRow().run()} title="מחק שורה">-▬</button>
                  <button className="toolbar-btn" onClick={() => editor.chain().focus().deleteTable().run()} title="מחק טבלה">✕⊞</button>
                  <div className="toolbar-divider" />
                </>
              )}

              {/* Tools */}
              <button className="toolbar-btn toolbar-btn-label" onClick={() => { closeAllPanels(); setShowFindReplace(v => !v); }} title="חפש והחלף (Ctrl+F)">⇄Ab</button>
              <button className="toolbar-btn" onClick={() => editor.chain().focus().unsetAllMarks().run()} title="נקה עיצוב">T̸</button>
              <button className="toolbar-btn" onClick={() => editor.chain().focus().clearNodes().run()} title="נקה בלוקים">¶̸</button>
              <button className="toolbar-btn" onClick={() => setZenMode(true)} title="מצב מיקוד (F11)">🧘</button>
              <button className="toolbar-btn" onClick={() => { closeAllPanels(); setShowGoals(v => !v); }} title="יעדי כתיבה">🎯</button>
            </div>
          </div>

          {/* Find & Replace bar */}
          {showFindReplace && (
            <FindReplace show={true} editor={editor} onClose={() => setShowFindReplace(false)} />
          )}

          {/* Writing Goals panel */}
          {showGoals && (
            <WritingGoals currentWords={totalWords} />
          )}

          {/* Book page area */}
          <div className="editor-body">
            {/* Page navigation sidebar */}
            <div className={`page-sidebar ${isRtl ? 'sidebar-right' : 'sidebar-left'} ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
              <div className="sidebar-header">
                <span>עמודים</span>
                <div className="sidebar-header-actions">
                  <button
                    className={`btn-manage-pages ${pageManageMode ? 'active' : ''}`}
                    onClick={() => { setPageManageMode(!pageManageMode); setSwapSource(null); }}
                    title="סידור עמודים"
                  >
                    ⇅
                  </button>
                  <button className="btn-add-page" onClick={addPage} title="הוסף עמוד">+</button>
                </div>
              </div>
              {pageManageMode && swapSource !== null && (
                <div className="swap-hint">בחר עמוד יעד להחלפה עם עמוד {swapSource + 1}</div>
              )}
              <div className="page-list">
                {/* Cover thumb */}
                {!pageManageMode && (
                  <button
                    className="page-thumb cover-thumb"
                    onClick={() => setBookView('cover')}
                  >
                    <BookCoverPreview cover={book.cover} title={book.title} author={book.author} isRtl={isRtl} small />
                    <span className="page-thumb-label">כריכה</span>
                  </button>
                )}
                {book.pages.map((page, idx) => (
                  <div key={page.id} className="page-thumb-wrapper">
                    {/* Chapter label */}
                    {page.chapter && !pageManageMode && (
                      <div className="chapter-label" onClick={e => { e.stopPropagation(); setEditingChapter(idx); setChapterInput(page.chapter || ''); }}>
                        📖 {page.chapter}
                      </div>
                    )}
                    {editingChapter === idx && (
                      <div className="chapter-edit" onClick={e => e.stopPropagation()}>
                        <input
                          value={chapterInput}
                          onChange={e => setChapterInput(e.target.value)}
                          placeholder="שם פרק..."
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              setBook(prev => {
                                const pages = [...prev.pages];
                                pages[idx] = { ...pages[idx], chapter: chapterInput || undefined };
                                return { ...prev, pages };
                              });
                              setEditingChapter(null);
                            }
                            if (e.key === 'Escape') setEditingChapter(null);
                          }}
                          onBlur={() => {
                            setBook(prev => {
                              const pages = [...prev.pages];
                              pages[idx] = { ...pages[idx], chapter: chapterInput || undefined };
                              return { ...prev, pages };
                            });
                            setEditingChapter(null);
                          }}
                        />
                      </div>
                    )}
                    {pageManageMode ? (
                      <div className={`page-thumb manage-mode ${swapSource === idx ? 'swap-source' : ''} ${idx === currentPageIdx ? 'active' : ''}`}>
                        <span className="page-thumb-number">{page.pageNumber}</span>
                        <div className="page-manage-actions">
                          <button className="page-manage-btn" onClick={() => movePage(idx, Math.max(0, idx - 1))} disabled={idx === 0} title="הזז למעלה">▲</button>
                          <button className="page-manage-btn" onClick={() => movePage(idx, Math.min(book.pages.length - 1, idx + 1))} disabled={idx === book.pages.length - 1} title="הזז למטה">▼</button>
                          <button className={`page-manage-btn swap-btn ${swapSource === idx ? 'active' : ''}`}
                            onClick={() => { if (swapSource === null || swapSource === idx) { setSwapSource(swapSource === idx ? null : idx); } else { swapPages(swapSource, idx); } }}
                            title={swapSource !== null && swapSource !== idx ? `החלף עם עמוד ${swapSource + 1}` : 'בחר להחלפה'}>⇄</button>
                          <button className="page-manage-btn insert-btn" onClick={() => insertPageAfter(idx)} title="הוסף עמוד אחרי">+</button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className={`page-thumb ${idx === currentPageIdx ? 'active' : ''} ${bookmarks.has(idx) ? 'bookmarked' : ''}`}
                        onClick={() => switchPage(idx)}
                      >
                        <span className="page-thumb-number">{page.pageNumber}</span>
                        {bookmarks.has(idx) && <span className="bookmark-flag">🔖</span>}
                        <div className="page-thumb-preview" dangerouslySetInnerHTML={{ __html: page.content ? page.content.slice(0, 100) : '' }} />
                        <button
                          className="btn-bookmark"
                          onClick={e => { e.stopPropagation(); toggleBookmark(idx); }}
                          title={bookmarks.has(idx) ? 'הסר סימניה' : 'הוסף סימניה'}
                        >
                          {bookmarks.has(idx) ? '★' : '☆'}
                        </button>
                        <button
                          className="btn-chapter-set"
                          onClick={e => { e.stopPropagation(); setEditingChapter(idx); setChapterInput(page.chapter || ''); }}
                          title="הגדר פרק"
                        >
                          📖
                        </button>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {!pageManageMode && book.pages.length > 1 && (
                <button className="btn-delete-page" onClick={deletePage} title="מחק עמוד נוכחי">
                  🗑️ מחק עמוד
                </button>
              )}
            </div>

            {/* The book spread area */}
            <div className="editor-page-wrapper">
              {/* Spread navigation */}
              <div className="page-navigation">
                <button className="page-nav-btn" onClick={goToPrevSpread} disabled={isMobile ? currentPageIdx === 0 : (currentSpreadIdx === 0 && bookView === 'pages')}>
                  {isRtl ? '→' : '←'} {(isMobile ? currentPageIdx === 0 : currentSpreadIdx === 0) ? 'כריכה' : 'הקודם'}
                </button>
                <button className="page-nav-btn mobile-pages-toggle" onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}>
                  {mobileSidebarOpen ? '✕' : '☰'} עמודים
                </button>
                <span className="page-nav-info">{spreadInfoText}</span>
                <button className="page-nav-btn" onClick={goToNextSpread} disabled={isMobile ? currentPageIdx >= book.pages.length - 1 : currentSpreadIdx >= totalSpreads - 1}>
                  הבא {isRtl ? '←' : '→'}
                </button>
              </div>

              {/* The open book */}
              <div className="book-spread">
                {isMobile ? (
                  /* Mobile: single page view */
                  <div className={`book-open ${isRtl ? 'book-rtl' : 'book-ltr'} single-page ${flipAnimation}`}>
                    <div className="spread-page spread-page-first page-single page-active">
                      {renderPageContent(currentPageIdx, true)}
                    </div>
                  </div>
                ) : (
                  /* Desktop: spread view */
                  <div className={`book-open ${isRtl ? 'book-rtl' : 'book-ltr'} ${currentSpreadIdx === 0 ? 'single-page' : ''} ${flipAnimation}`}>

                    {/* First page of spread (right for RTL) */}
                    {spreadFirstPage !== null && (
                      <div
                        className={`spread-page spread-page-first ${currentPageIdx === spreadFirstPage ? 'page-active' : 'page-preview'} ${currentSpreadIdx === 0 ? 'page-single' : ''}`}
                        onClick={() => activatePage(spreadFirstPage)}
                      >
                        {renderPageContent(spreadFirstPage, currentPageIdx === spreadFirstPage)}
                      </div>
                    )}

                    {/* Center gutter / binding (only for two-page spreads) */}
                    {currentSpreadIdx > 0 && <div className="book-gutter" />}

                    {/* Second page of spread (left for RTL) */}
                    {currentSpreadIdx > 0 && (
                      <div
                        className={`spread-page spread-page-second ${spreadSecondPage !== null && currentPageIdx === spreadSecondPage ? 'page-active' : 'page-preview'} ${spreadSecondPage === null ? 'page-empty' : ''}`}
                        onClick={() => spreadSecondPage !== null && activatePage(spreadSecondPage)}
                      >
                        {spreadSecondPage !== null ? (
                          renderPageContent(spreadSecondPage, currentPageIdx === spreadSecondPage)
                        ) : (
                          <div className="page-inner empty-page-inner">
                            <button className="btn-add-page-spread" onClick={addPage}>
                              + הוסף עמוד
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="page-add-area">
                <button className="btn-add-page-bottom" onClick={addPage}>
                  + הוסף עמוד חדש
                </button>
              </div>

              {/* Word count bar */}
              <WordCountBar content={currentPage?.content || ''} totalBookContent={totalBookContent} />
            </div>
          </div>
        </>
      )}

      {/* Zen mode exit */}
      {zenMode && (
        <button className="zen-exit-btn" onClick={() => setZenMode(false)} title="יציאה ממצב מיקוד (F11)">
          ✕ יציאה ממצב מיקוד
        </button>
      )}

      {/* Shortcuts modal */}
      {showShortcuts && <ShortcutsPanel show={true} onClose={() => setShowShortcuts(false)} />}

      {/* Command palette */}
      {showCommandPalette && (
        <CommandPalette
          show={true}
          pages={book.pages}
          bookmarks={bookmarks}
          onGoToPage={(idx) => { switchPage(idx); setShowCommandPalette(false); }}
          onAction={(action) => { handleCommandAction(action); setShowCommandPalette(false); }}
          onClose={() => setShowCommandPalette(false)}
        />
      )}

      {/* NOTES VIEW */}
      {bookView === 'notes' && (
        <NotesPanel
          folders={book.noteFolders}
          onChange={noteFolders => setBook(prev => ({ ...prev, noteFolders }))}
        />
      )}
    </div>
  );
}
