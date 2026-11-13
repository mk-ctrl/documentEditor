import { useEffect, useState } from 'react';
import { useEditorState } from '@tiptap/react';

// A heading counts as "current" once its top has scrolled above this line
// (sticky app header + editor bar + a little breathing room).
const ACTIVE_LINE_PX = 170;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Headings in document order: [{ level, text, pos }]. Recomputed from the editor state. */
function selectHeadings({ editor }) {
  if (!editor) return [];
  const out = [];
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      out.push({ level: node.attrs.level, text: node.textContent.trim(), pos });
      return false;
    }
    // text blocks can't contain headings, so don't walk into them
    return !node.isTextblock;
  });
  return out;
}

/**
 * Left-rail outline generated from the document's headings. Clicking an entry scrolls the
 * sheet to that heading; the entry for the section you're reading is highlighted.
 * Renders nothing when the document has no headings (CSS also hides the rail on small screens).
 */
export default function DocOutline({ editor }) {
  const headings = useEditorState({ editor, selector: selectHeadings });
  const [active, setActive] = useState(0);

  // Track which heading is currently at the top of the viewport (rAF-throttled scroll listener).
  useEffect(() => {
    if (!editor || headings.length === 0) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const els = editor.view.dom.querySelectorAll('h1, h2, h3');
      let current = 0;
      els.forEach((el, i) => {
        if (el.getBoundingClientRect().top < ACTIVE_LINE_PX) current = i;
      });
      // Headings near the end of a short document can never scroll up to the line,
      // so once the page is scrolled to the bottom the last heading is the current one.
      const atBottom =
        window.scrollY > 0 && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom && els.length > 0) current = els.length - 1;
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [editor, headings]);

  if (!editor || headings.length === 0) return null;

  function jumpTo(index, pos) {
    const el = editor.view.nodeDOM(pos);
    if (!(el instanceof HTMLElement)) return;
    el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    setActive(index);
  }

  return (
    <nav className="doc-outline rail-card" aria-label="Document outline">
      <p className="rail-eyebrow">Outline</p>
      <ol className="outline-list">
        {headings.map((h, i) => (
          // keyed by index: positions shift on every keystroke, and remounting would replay the entrance animation
          <li key={i} className={`outline-item lvl-${h.level}`} style={{ '--i': i }}>
            <button
              type="button"
              className={i === active ? 'is-active' : ''}
              aria-current={i === active ? 'location' : undefined}
              onClick={() => jumpTo(i, h.pos)}
              title={h.text || 'Untitled heading'}
            >
              {h.text || <span className="outline-empty">Untitled heading</span>}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
