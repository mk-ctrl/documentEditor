/**
 * Filter row: segmented All / Mine / Shared tabs (with live counts), a labelled title search,
 * and a sort select. Purely presentational; the dashboard owns the state.
 */
export default function DashToolbar({ tab, onTab, counts, query, onQuery, sort, onSort, searchRef }) {
  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'mine', label: 'Mine' },
    { id: 'shared', label: 'Shared with me' },
  ];

  return (
    <div className="dash-toolbar">
      <div className="dash-tabs" role="group" aria-label="Show documents">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className="dash-tab"
            aria-pressed={tab === t.id}
            onClick={() => onTab(t.id)}
          >
            {t.label}
            <span className="dash-tab-count">{counts[t.id]}</span>
          </button>
        ))}
      </div>

      <div className="dash-tools">
        <div className="dash-search" role="search">
          <label htmlFor="doc-search" className="dash-sr">
            Search document titles
          </label>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            ref={searchRef}
            id="doc-search"
            type="search"
            placeholder="Search titles"
            autoComplete="off"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && query) {
                e.preventDefault();
                onQuery('');
              }
            }}
          />
          <kbd className="dash-kbd" aria-hidden="true">
            /
          </kbd>
        </div>

        <label className="dash-sort">
          <span>Sort</span>
          <select className="select select-sm" value={sort} onChange={(e) => onSort(e.target.value)}>
            <option value="recent">Last edited</option>
            <option value="title">Title</option>
          </select>
        </label>
      </div>
    </div>
  );
}
