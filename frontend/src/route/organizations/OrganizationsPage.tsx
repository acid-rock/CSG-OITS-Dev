import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { OutletContext } from '../../root-layout/Root-layout';
import type { Organization } from '../../config/organizationsConfig';
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

const CalIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
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
}

function OrgHero({ counts }: { counts: HeroCounts }) {
  const total = counts.academic + counts.nonAcademic + counts.spu;
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

type FilterValue = 'all' | 'academic' | 'non-academic' | 'spu';

interface ToolbarProps {
  query: string;
  onQuery: (q: string) => void;
  filter: FilterValue;
  onFilter: (f: FilterValue) => void;
  counts: { all: number; academic: number; nonAcademic: number; spu: number };
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
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ORG CARD
   ============================================================ */

type Tone = 'primary' | 'warning' | 'success';

interface OrgCardProps {
  org: Organization;
  tone: Tone;
  tagLabel: string;
  onClick: () => void;
}

function OrgCard({ org, tone, tagLabel, onClick }: OrgCardProps) {
  const [a, b] = getPalette(org.name);
  const initials = getInitials(org.name);
  return (
    <article className="po-card" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className="po-card-top">
        <div
          className="po-card-logo"
          style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
        >
          {org.logo_url
            ? <img src={org.logo_url} alt={org.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span>{initials}</span>
          }
        </div>
        <span className={`po-tag tone-${tone}`}>{tagLabel}</span>
      </div>
      <h3 className="po-card-name">{org.name}</h3>
      <p className="po-card-desc">{org.description ?? ''}</p>
      <div className="po-card-foot">
        <span className="po-card-meta">
          <CalIcon width="11" height="11" />
          Est. {new Date(org.created_at).getFullYear()}
        </span>
        {org.facebook_link && (
          <a
            className="po-card-cta"
            href={org.facebook_link}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Visit ${org.name} on Facebook`}
          >
            <FbIcon width="14" height="14" />
            <span>Visit page</span>
            <ArrowIcon width="13" height="13" />
          </a>
        )}
      </div>
    </article>
  );
}

/* ============================================================
   FEATURED CARD  (publication — single wide card)
   ============================================================ */

function FeaturedFlare({ org, onClick }: { org: Organization; onClick: () => void }) {
  const [a, b] = getPalette(org.name);
  const initials = getInitials(org.name);
  return (
    <article className="po-featured" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div
        className="po-featured-art"
        style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
      >
        <div className="po-featured-logo">
          {org.logo_url
            ? <img src={org.logo_url} alt={org.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span>{initials}</span>
          }
        </div>
        <div className="po-featured-pattern" aria-hidden="true" />
      </div>
      <div className="po-featured-body">
        <span className="po-tag tone-success">Publication</span>
        <h3 className="po-featured-name">{org.name}</h3>
        <p className="po-featured-desc">{org.description ?? ''}</p>
        <div className="po-featured-foot">
          <span className="po-card-meta">
            <CalIcon width="11" height="11" />
            Established {new Date(org.created_at).getFullYear()}
          </span>
          {org.facebook_link && (
            <a
              className="po-card-cta po-card-cta--prim"
              href={org.facebook_link}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FbIcon width="14" height="14" />
              <span>Visit {org.name} on Facebook</span>
              <ArrowIcon width="13" height="13" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

/* ============================================================
   ORG SECTION  (groups academic / non-academic)
   ============================================================ */

interface OrgSectionProps {
  kicker: string;
  title: string;
  sub?: string;
  items: Organization[];
  tone: Tone;
  tagLabel: string;
  alt?: boolean;
  onSelect: (org: Organization) => void;
}

function OrgSection({ kicker, title, sub, items, tone, tagLabel, alt, onSelect }: OrgSectionProps) {
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
          <OrgCard key={o.id} org={o} tone={tone} tagLabel={tagLabel} onClick={() => onSelect(o)} />
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   PAGE  (root export — Root-layout provides Nav + Footer)
   ============================================================ */

export default function OrganizationsPage() {
  const { organizations } = useOutletContext<OutletContext>();
  const [query, setQuery]         = useState('');
  const [filter, setFilter]       = useState<FilterValue>('all');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  /* Stable counts based on full dataset (not filtered view) */
  const counts = {
    all:         organizations.length,
    academic:    organizations.filter(o => o.org_type === 'academic').length,
    nonAcademic: organizations.filter(o => o.org_type === 'non-academic').length,
    spu:         organizations.filter(o => o.org_type === 'spu').length,
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
  const spu         = filtered.filter(o => o.org_type === 'spu');

  return (
    <div className="po-root">
      <OrgHero counts={{ academic: counts.academic, nonAcademic: counts.nonAcademic, spu: counts.spu }} />
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
              tone="primary"
              tagLabel="Academic"
              onSelect={setSelectedOrg}
            />
            <OrgSection
              kicker="Non-Academic"
              title="Non-Academic Organizations"
              sub="Cross-program orgs across the arts, athletics, faith, leadership, and service."
              items={nonAcademic}
              tone="warning"
              tagLabel="Non-academic"
              alt
              onSelect={setSelectedOrg}
            />
            {spu.length > 0 && (
              <section className="po-section po-section--publication">
                <div className="po-section-head">
                  <span className="po-eyebrow po-eyebrow--small">Student Publication Unit</span>
                  <h2>The voice of the studentry.</h2>
                </div>
                {spu.map(o => <FeaturedFlare key={o.id} org={o} onClick={() => setSelectedOrg(o)} />)}
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
