import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { OutletContext } from '../../root-layout/Root-layout';
import type { Organization } from '../../config/organizationsConfig';
import OrganizationCard from '../../components/organization-card/OrganizationCard';
import OrganizationModal from '../../components/organization-card/OrganizationModal';
import './organizations.css';

/* ============================================================
   UTILS
   ============================================================ */

const PALETTES: [string, string][] = [
  ['#7c2d12', '#dc2626'],
  ['#1e293b', '#475569'],
  ['#0f766e', '#5eb5af'],
  ['#92400e', '#f59e0b'],
  ['#3b5fbc', '#8aaae0'],
  ['#7c2d12', '#ea580c'],
  ['#1e3a8a', '#3b5fbc'],
  ['#475569', '#94a3b8'],
  ['#15803d', '#22c55e'],
  ['#0f766e', '#22c55e'],
];

function getPalette(name: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffff;
  }
  return PALETTES[hash % PALETTES.length];
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  if (words.length === 2) return (words[0][0] + words[1][0]).toUpperCase();
  return (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
}

/* ============================================================
   ICONS
   ============================================================ */

const FbIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M22 12a10 10 0 1 0-11.56 9.88V14.9H7.9V12h2.54V9.8c0-2.51 1.49-3.9
      3.78-3.9 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44
      2.9h-2.34v6.98A10 10 0 0 0 22 12Z"/>
  </svg>
);

const ArrowIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 12h14M13 6l6 6-6 6"/>
  </svg>
);

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
}

function OrgSection({ kicker, title, sub, items, alt, onSelect }: OrgSectionProps) {
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
          <OrganizationCard key={o.id} organization={o} onClick={() => onSelect(o)} />
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   SPECIAL UNIT CARD
   Vertical card with coloured art panel — used for SPU & ROTC.
   Both render in a 2-column grid so they sit side-by-side.
   ============================================================ */

interface SpecialUnitCardProps {
  org: Organization;
  gradientFrom: string;
  gradientTo: string;
  tagLabel: string;
  tagClass: string;
  ctaClass: string;
  onClick: () => void;
}

function SpecialUnitCard({
  org, gradientFrom, gradientTo, tagLabel, tagClass, ctaClass, onClick,
}: SpecialUnitCardProps) {
  const initials = getInitials(org.name);
  return (
    <article className="po-unit-card" onClick={onClick}>
      {/* Coloured art panel */}
      <div
        className="po-unit-art"
        style={{ background: `linear-gradient(145deg, ${gradientFrom}, ${gradientTo})` }}
      >
        <div className="po-unit-pattern" aria-hidden="true" />
        <div className="po-unit-logo">
          {org.logo_url
            ? <img src={org.logo_url} alt={org.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span>{initials}</span>
          }
        </div>
      </div>

      {/* Body */}
      <div className="po-unit-body">
        <span className={`po-tag ${tagClass}`}>{tagLabel}</span>
        <h3 className="po-unit-name">{org.name}</h3>
        <p className="po-unit-desc">{org.description ?? ''}</p>
        {org.facebook_link && (
          <div className="po-unit-foot">
            <a
              className={`po-card-cta ${ctaClass}`}
              href={org.facebook_link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
            >
              <FbIcon width="14" height="14" />
              <span>Visit {org.name} on Facebook</span>
              <ArrowIcon width="13" height="13" />
            </a>
          </div>
        )}
      </div>
    </article>
  );
}

/* ============================================================
   PAGE  (root export — Root-layout provides Nav + Footer)
   ============================================================ */

export default function OrganizationsPage() {
  const { organizations } = useOutletContext<OutletContext>();
  const [query, setQuery]   = useState('');
  const [filter, setFilter] = useState<FilterValue>('all');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  /* Stable counts (full dataset) */
  const counts = {
    all:         organizations.length,
    academic:    organizations.filter(o => o.org_type === 'academic').length,
    nonAcademic: organizations.filter(o => o.org_type === 'non-academic').length,
    spu:         organizations.filter(o => o.org_type === 'spu').length,
    rotc:        organizations.filter(o => o.org_type === 'rotc').length,
  };

  /* Apply search + type filter */
  const q = query.trim().toLowerCase();
  const filtered = organizations.filter(o => {
    const matchesType  = filter === 'all' || o.org_type === filter;
    const matchesQuery = !q
      || o.name.toLowerCase().includes(q)
      || (o.description ?? '').toLowerCase().includes(q);
    return matchesType && matchesQuery;
  });

  const academic    = filtered.filter(o => o.org_type === 'academic');
  const nonAcademic = filtered.filter(o => o.org_type === 'non-academic');
  const specialUnits = filtered.filter(o => o.org_type === 'spu' || o.org_type === 'rotc');

  /* Per-unit visual config */
  function unitConfig(org: Organization): Pick<SpecialUnitCardProps, 'gradientFrom' | 'gradientTo' | 'tagLabel' | 'tagClass' | 'ctaClass'> {
    if (org.org_type === 'rotc') {
      return {
        gradientFrom: '#3d4a1e',
        gradientTo:   '#c8a23a',
        tagLabel:     'ROTC Unit',
        tagClass:     'tone-rotc',
        ctaClass:     'po-card-cta--rotc',
      };
    }
    /* SPU / publication — use deterministic gradient from name */
    const [a, b] = getPalette(org.name);
    return {
      gradientFrom: a,
      gradientTo:   b,
      tagLabel:     'Publication',
      tagClass:     'tone-success',
      ctaClass:     'po-card-cta--prim',
    };
  }

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
            />
            <OrgSection
              kicker="Non-Academic"
              title="Non-Academic Organizations"
              sub="Cross-program orgs across the arts, athletics, faith, leadership, and service."
              items={nonAcademic}
              alt
              onSelect={setSelectedOrg}
            />

            {/* Publication & ROTC — side-by-side in one row */}
            {specialUnits.length > 0 && (
              <section className="po-section po-section--special">
                <div className="po-section-head">
                  <span className="po-eyebrow po-eyebrow--small">Special Units</span>
                  <h2>Publication &amp; ROTC</h2>
                  <p>The voice of the studentry and the corps of cadets — two pillars of campus life.</p>
                </div>
                <div className="po-units-grid">
                  {specialUnits.map(o => {
                    const cfg = unitConfig(o);
                    return (
                      <SpecialUnitCard
                        key={o.id}
                        org={o}
                        onClick={() => setSelectedOrg(o)}
                        {...cfg}
                      />
                    );
                  })}
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
        />
      )}
    </div>
  );
}
