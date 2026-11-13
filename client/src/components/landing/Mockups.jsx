import Avatar from '../Avatar.jsx';

/*
  Paper mockups that illustrate each feature panel. Everything here is decorative
  (aria-hidden, pointer-events: none in CSS): grey bars stand in for text, and small looping
  CSS animations hint at what the feature does. All motion is switched off under
  prefers-reduced-motion in landing.css, leaving each mockup in a sensible resting state.
*/

/** Grey "text lines" of the given widths (percent). */
export function Lines({ widths }) {
  return widths.map((w, i) => <i key={i} className="lp-line" style={{ '--w': `${w}%` }} />);
}

/** 1 — Write & format: a sheet with a floating toolbar and a line that turns bold + highlighted. */
export function WriteMockup() {
  return (
    <div className="lp-mock lp-mock-write" aria-hidden="true">
      <div className="lp-toolbar">
        <span className="lp-tool lp-tool-b">B</span>
        <span className="lp-tool">
          <em>I</em>
        </span>
        <span className="lp-tool">
          <u>U</u>
        </span>
        <span className="lp-tool-sep" />
        <span className="lp-tool lp-tool-h">H1</span>
        <span className="lp-tool">H2</span>
        <span className="lp-tool-sep" />
        <span className="lp-tool lp-tool-list">
          <i />
          <i />
          <i />
        </span>
      </div>

      <div className="paper lp-sheet">
        <p className="lp-eyebrow">Draft · Team offsite</p>
        <p className="lp-title">Launch notes</p>
        <Lines widths={[94, 86, 90]} />
        <p className="lp-hl">
          <span>Ship the editor on Friday.</span>
          <b className="lp-caret" />
        </p>
        <Lines widths={[80, 92, 58]} />
        <ul className="lp-bullets">
          <li>
            <i className="lp-line" style={{ '--w': '62%' }} />
          </li>
          <li>
            <i className="lp-line" style={{ '--w': '48%' }} />
          </li>
        </ul>
      </div>

      {/* torn-paper snippet overlapping the sheet, like a clipped quote */}
      <div className="paper lp-snippet">
        <p className="lp-snippet-text">“Less chrome, more page.”</p>
        <Lines widths={[90, 70]} />
      </div>
    </div>
  );
}

const PEOPLE = {
  alice: { name: 'Alice Park', email: 'alice@example.com' },
  bob: { name: 'Bob Rivera', email: 'bob@example.com' },
  carol: { name: 'Carol Singh', email: 'carol@example.com' },
};

function PersonRow({ who, role, className = '' }) {
  const p = PEOPLE[who];
  return (
    <div className={`lp-person ${className}`}>
      <Avatar name={p.name} email={p.email} size={30} />
      <span className="lp-person-name">
        {p.name}
        <small>{p.email}</small>
      </span>
      <span className={`chip chip-${role}`}>{role}</span>
    </div>
  );
}

/** 2 — Share with intent: a share sheet where a new collaborator gets added. */
export function ShareMockup() {
  return (
    <div className="lp-mock lp-mock-share" aria-hidden="true">
      <div className="paper lp-sheet lp-sheet-back">
        <p className="lp-eyebrow">Shared with you</p>
        <p className="lp-title">Roadmap</p>
        <Lines widths={[88, 76, 92, 64]} />
      </div>

      <div className="paper lp-sheet lp-share-sheet">
        <p className="lp-eyebrow">Share “Launch notes”</p>
        <div className="lp-add">
          <span className="lp-add-plus">+</span>
          <span className="lp-add-typing">carol@example.com</span>
          <span className="lp-add-btn">Add</span>
        </div>
        <PersonRow who="alice" role="owner" />
        <PersonRow who="bob" role="viewer" />
        <PersonRow who="carol" role="editor" className="lp-person-new" />
      </div>

      <div className="lp-float-chip">
        <Avatar name={PEOPLE.bob.name} email={PEOPLE.bob.email} size={22} />
        Bob can view
      </div>
    </div>
  );
}

/** 3 — Bring your files: file tags drop into a sheet's drop zone. */
export function FilesMockup() {
  return (
    <div className="lp-mock lp-mock-files" aria-hidden="true">
      <div className="paper lp-sheet">
        <p className="lp-eyebrow">New document</p>
        <p className="lp-title">Import a file</p>
        <div className="lp-drop">
          <div className="lp-tags">
            <span className="lp-tag lp-tag-txt" style={{ '--i': 0 }}>
              notes<b>.txt</b>
            </span>
            <span className="lp-tag lp-tag-md" style={{ '--i': 1 }}>
              readme<b>.md</b>
            </span>
            <span className="lp-tag lp-tag-docx" style={{ '--i': 2 }}>
              brief<b>.docx</b>
            </span>
          </div>
          <p className="lp-drop-hint">Drop it here, we’ll keep the formatting.</p>
        </div>
        <Lines widths={[86, 72]} />
      </div>
      <span className="lp-stamp">
        up to
        <br />
        <b>2 MB</b>
      </span>
    </div>
  );
}

/** 4 — Your desk: three sheets side by side, like a desk of work in progress. */
export function DeskMockup() {
  const sheets = [
    { eyebrow: 'Owned by you', title: 'Launch notes', who: 'alice', role: 'owner', lines: [90, 82, 94, 60] },
    { eyebrow: 'Shared with you', title: 'Roadmap Q3', who: 'bob', role: 'editor', lines: [84, 92, 70, 88, 52] },
    { eyebrow: 'Shared with you', title: 'Interview kit', who: 'carol', role: 'viewer', lines: [92, 66, 80, 74] },
  ];
  return (
    <div className="lp-mock lp-mock-desk" aria-hidden="true">
      {sheets.map((s, i) => (
        <div key={s.title} className="paper lp-sheet lp-desk-sheet reveal-child" style={{ '--i': i + 2 }}>
          <p className="lp-eyebrow">{s.eyebrow}</p>
          <p className="lp-title">{s.title}</p>
          <Lines widths={s.lines} />
          <div className="lp-desk-foot">
            <Avatar name={PEOPLE[s.who].name} email={PEOPLE[s.who].email} size={22} />
            <span className={`chip chip-${s.role}`}>{s.role}</span>
          </div>
          {i === 1 && (
            <span className="lp-saved">
              <i /> Saved
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
