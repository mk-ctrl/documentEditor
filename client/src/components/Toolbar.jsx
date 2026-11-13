import { useEditorState } from '@tiptap/react';

const Icon = {
  bullet: (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="4" cy="5" r="1.6" />
      <circle cx="4" cy="10" r="1.6" />
      <circle cx="4" cy="15" r="1.6" />
      <path d="M8 5h9M8 10h9M8 15h9" strokeWidth="1.8" stroke="currentColor" />
    </svg>
  ),
  ordered: (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <text x="1" y="7.5" fontSize="6.5" fontWeight="700">1</text>
      <text x="1" y="12.5" fontSize="6.5" fontWeight="700">2</text>
      <text x="1" y="17.5" fontSize="6.5" fontWeight="700">3</text>
      <path d="M8 5h9M8 10h9M8 15h9" strokeWidth="1.8" stroke="currentColor" />
    </svg>
  ),
  undo: (
    <svg viewBox="0 0 20 20" aria-hidden="true" style={{ fill: "none" }} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M7 5L3 9l4 4" />
      <path d="M3.5 9H12a5 5 0 0 1 0 10h-2" />
    </svg>
  ),
  redo: (
    <svg viewBox="0 0 20 20" aria-hidden="true" style={{ fill: "none" }} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M13 5l4 4-4 4" />
      <path d="M16.5 9H8a5 5 0 0 0 0 10h2" />
    </svg>
  ),
};

function Btn({ active, disabled, onClick, label, shortcut, children, className = '' }) {
  return (
    <button
      type="button"
      className={`tb-btn ${active ? 'is-active' : ''} ${className}`}
      onMouseDown={(e) => e.preventDefault() /* keep the editor's selection */}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active ?? undefined}
      aria-label={label}
      title={shortcut ? `${label} (${shortcut})` : label}
    >
      {children}
    </button>
  );
}

export default function Toolbar({ editor }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      h1: e.isActive('heading', { level: 1 }),
      h2: e.isActive('heading', { level: 2 }),
      paragraph: e.isActive('paragraph'),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const run = () => editor.chain().focus();

  return (
    <div className="toolbar" role="toolbar" aria-label="Formatting">
      <Btn label="Bold" shortcut="Ctrl+B" active={s.bold} onClick={() => run().toggleBold().run()}>
        <b>B</b>
      </Btn>
      <Btn label="Italic" shortcut="Ctrl+I" active={s.italic} onClick={() => run().toggleItalic().run()}>
        <i className="serif-i">I</i>
      </Btn>
      <Btn label="Underline" shortcut="Ctrl+U" active={s.underline} onClick={() => run().toggleUnderline().run()}>
        <u>U</u>
      </Btn>
      <span className="tb-sep" />
      <Btn label="Heading 1" active={s.h1} onClick={() => run().toggleHeading({ level: 1 }).run()} className="tb-text">
        H1
      </Btn>
      <Btn label="Heading 2" active={s.h2} onClick={() => run().toggleHeading({ level: 2 }).run()} className="tb-text">
        H2
      </Btn>
      <Btn label="Body text" active={s.paragraph && !s.bullet && !s.ordered} onClick={() => run().setParagraph().run()} className="tb-text">
        Text
      </Btn>
      <span className="tb-sep" />
      <Btn label="Bulleted list" active={s.bullet} onClick={() => run().toggleBulletList().run()}>
        {Icon.bullet}
      </Btn>
      <Btn label="Numbered list" active={s.ordered} onClick={() => run().toggleOrderedList().run()}>
        {Icon.ordered}
      </Btn>
      <span className="tb-sep" />
      <Btn label="Undo" shortcut="Ctrl+Z" disabled={!s.canUndo} onClick={() => run().undo().run()}>
        {Icon.undo}
      </Btn>
      <Btn label="Redo" shortcut="Ctrl+Shift+Z" disabled={!s.canRedo} onClick={() => run().redo().run()}>
        {Icon.redo}
      </Btn>
    </div>
  );
}
