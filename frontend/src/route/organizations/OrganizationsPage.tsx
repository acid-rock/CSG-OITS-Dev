import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { OutletContext } from '../../root-layout/Root-layout';
import type { Organization } from '../../config/organizationsConfig';
import OrganizationCard from '../../components/organization-card/OrganizationCard';
import OrganizationModal from '../../components/organization-card/OrganizationModal';
import SpecialUnitCard from '../../components/organization-card/SpecialUnitCard';
import './organizations.css';


const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);

/* ============================================================
   HERO
   ============================================================ */

interface HeroCounts {
  academic: number;
  nonAcademic: number;
  spu: number;
  rotc: number;
}

function OrgHero({ counts }: { counts: HeroCounts }) {
  const total = counts.academic + counts.nonAcademic + counts.spu + counts.rotc;
  return (
    <section className="po-hero">
      <div className="po-hero-bg" />
      <div className="po-hero-inner">
        <span className="po-eyebrow">Student Organizations</span>
        <h1>
          {total > 0 ? `${total} recognized` : 'Recognized'} orgs,{' '}
          <em>one</em> CvSU—Imus.
        </h1>
        <p>
          Browse every recognized student organization at Cavite State University —
          Imus Campus. Find your community in academics, the arts, athletics, faith,
          leadership, and more.
        </p>
        <div className="po-hero-stats">
          <div className="po-hero-stat">
            <span className="po-hero-stat-num">{counts.academic}</span>
            <span className="po-hero-stat-lbl">Academic</span>
          </div>
          <div className="po-hero-stat">
            <span className="po-hero-stat-num">{counts.nonAcademic}</span>
            <span className="po-hero-stat-lbl">Non-academic</span>
          </div>
          <div className="po-hero-stat">
            <span className="po-hero-stat-num">{counts.spu}</span>
            <span className="po-hero-stat-lbl">Publication</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   TOOLBAR
   ============================================================ */

type FilterValue = 'all' | 'academic' | 'non-academic' | 'spu' | 'rotc';

interface ToolbarProps {
  query: string;
  onQuery: (q: string) => void;
  filter: FilterValue;
  onFilter: (f: FilterValue) => void;
  counts: { all: number; academic: number; nonAcademic: number; spu: number; rotc: number };
}

function OrgToolbar({ query, onQuery, filter, onFilter, counts }: ToolbarProps) {
  return (
    <div className="po-toolbar">
      <div className="po-toolbar-inner">
        <div className="po-search">
          <SearchIcon width="15" height="15" />
          <input
            value={query}
            onChange={e => onQuery(e.target.value)}
            placeholder="Search organizations by name or keyword…"
          />
        </div>
        <div className="po-filters">
          <button
            className={`po-filter${filter === 'all' ? ' is-active' : ''}`}
            onClick={() => onFilter('all')}
          >
            All<span className="po-filter-count">{counts.all}</span>
          </button>
          <button
            className={`po-filter${filter === 'academic' ? ' is-active' : ''}`}
            onClick={() => onFilter('academic')}
          >
            Academic<span className="po-filter-count">{counts.academic}</span>
          </button>
          <button
            className={`po-filter${filter === 'non-academic' ? ' is-active' : ''}`}
            onClick={() => onFilter('non-academic')}
          >
            Non-academic<span className="po-filter-count">{counts.nonAcademic}</span>
          </button>
          <button
            className={`po-filter${filter === 'spu' ? ' is-active' : ''}`}
            onClick={() => onFilter('spu')}
          >
            Publication<span className="po-filter-count">{counts.spu}</span>
          </button>
          {counts.rotc > 0 && (
            <button
              className={`po-filter${filter === 'rotc' ? ' is-active' : ''}`}
              onClick={() => onFilter('rotc')}
            >
              ROTC<span className="po-filter-count">{counts.rotc}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ORG SECTION  (academic / non-academic grid)
   Uses the shared OrganizationCard component — same as homepage
   ============================================================ */

interface OrgSectionProps {
  kicker: string;
  title: string;
  sub?: string;
  items: Organization[];
  alt?: boolean;
  onSelect: (org: Organization) => void;
  subOrgMap: Map<string, Organization[]>;
}

function OrgSection({ kicker, title, sub, items, alt, onSelect, subOrgMap }: OrgSectionProps) {
  if (items.length === 0) return null;
  return (
    <section className={alt ? 'po-section po-section--alt' : 'po-section'}>
      <div className="po-section-head">
        <span className="po-eyebrow po-eyebrow--small">{kicker}</span>
        <h2>{title}</h2>
        {sub && <p>{sub}</p>}
      </div>
      <div className="po-grid">
        {items.map(o => (
          <OrganizationCard
            key={o.id}
            organization={o}
            subOrgsCount={subOrgMap.get(o.id)?.length ?? 0}
            onClick={() => onSelect(o)}
          />
        ))}
      </div>
    </section>
  );
}

/* SpecialUnitCard is imported from shared component */

/* ============================================================
   PAGE  (root export — Root-layout provides Nav + Footer)
   ============================================================ */

export default function OrganizationsPage() {
  const { organizations } = useOutletContext<OutletContext>();
  const [query, setQuery]   = useState('');
  const [filter, setFilter] = useState<FilterValue>('all');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  // Build parent_id → children[] map; sub-orgs don't appear in grids directly
  const subOrgMap = new Map<string, Organization[]>();
  for (const org of organizations) {
    if (org.parent_id) {
      const siblings = subOrgMap.get(org.parent_id) ?? [];
      siblings.push(org);
      subOrgMap.set(org.parent_id, siblings);
    }
  }

  // Only top-level orgs count toward official totals and appear in grids
  const topLevel = organizations.filter(o => !o.parent_id);

  /* Stable counts — top-level only, so sub-orgs don't inflate the numbers */
  const counts = {
    all:         topLevel.length,
    academic:    topLevel.filter(o => o.org_type === 'academic').length,
    nonAcademic: topLevel.filter(o => o.org_type === 'non-academic').length,
    spu:         topLevel.filter(o => o.org_type === 'spu').length,
    rotc:        topLevel.filter(o => o.org_type === 'rotc').length,
  };

  /* Apply search + type filter — top-level only */
  const q = query.trim().toLowerCase();
  const filtered = topLevel.filter(o => {
    const matchesType  = filter === 'all' || o.org_type === filter;
    const matchesQuery = !q
      || o.name.toLowerCase().includes(q)
      || (o.description ?? '').toLowerCase().includes(q);
    return matchesType && matchesQuery;
  });

  const academic    = filtered.filter(o => o.org_type === 'academic');
  const nonAcademic = filtered.filter(o => o.org_type === 'non-academic');
  const specialUnits = filtered.filter(o => o.org_type === 'spu' || o.org_type === 'rotc');

  return (
    <div className="po-root">
      <OrgHero counts={{ academic: counts.academic, nonAcademic: counts.nonAcademic, spu: counts.spu, rotc: counts.rotc }} />
      <OrgToolbar
        query={query}
        onQuery={setQuery}
        filter={filter}
        onFilter={setFilter}
        counts={counts}
      />

      <main className="po-main">
        {filtered.length === 0 ? (
          <p className="po-state-msg">No organizations found.</p>
        ) : (
          <>
            <OrgSection
              kicker="Academic"
              title="Academic Organizations"
              sub="Course-specific organizations that build community within each program — from BSCS to Communication, Hospitality to Psychology."
              items={academic}
              onSelect={setSelectedOrg}
              subOrgMap={subOrgMap}
            />
            <OrgSection
              kicker="Non-Academic"
              title="Non-Academic Organizations"
              sub="Cross-program orgs across the arts, athletics, faith, leadership, and service."
              items={nonAcademic}
              alt
              onSelect={setSelectedOrg}
              subOrgMap={subOrgMap}
            />

            {/* Publication & ROTC — side-by-side in one row */}
            {specialUnits.length > 0 && (
              <section className="po-section po-section--special">
                <div className="po-section-head">
                  <span className="po-eyebrow po-eyebrow--small">Special Units</span>
                  <h2>Publication &amp; ROTC</h2>
                  <p>The voice of the studentry and the corps of cadets — two pillars of campus life.</p>
                </div>
                <div className="su-grid">
                  {specialUnits.map(o => (
                    <SpecialUnitCard
                      key={o.id}
                      org={o}
                      onClick={() => setSelectedOrg(o)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {selectedOrg && (
        <OrganizationModal
          organization={selectedOrg}
          isOpen={true}
          onClose={() => setSelectedOrg(null)}
          subOrgs={subOrgMap.get(selectedOrg.id) ?? []}
        />
      )}
    </div>
  );
}
