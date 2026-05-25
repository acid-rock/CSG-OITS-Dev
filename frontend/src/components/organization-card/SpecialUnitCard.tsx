import type { Organization } from '../../config/organizationsConfig';
import './special-unit-card.css';

/* ── helpers ── */
const PALETTES: [string, string][] = [
  ['#7c2d12', '#dc2626'], ['#1e293b', '#475569'], ['#0f766e', '#5eb5af'],
  ['#92400e', '#f59e0b'], ['#3b5fbc', '#8aaae0'], ['#7c2d12', '#ea580c'],
  ['#1e3a8a', '#3b5fbc'], ['#475569', '#94a3b8'], ['#15803d', '#22c55e'],
  ['#0f766e', '#22c55e'],
];

function getPalette(name: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffff;
  return PALETTES[hash % PALETTES.length];
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  if (words.length === 2) return (words[0][0] + words[1][0]).toUpperCase();
  return (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
}

/* ── icons ── */
const FbIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
    <path d="M22 12a10 10 0 1 0-11.56 9.88V14.9H7.9V12h2.54V9.8c0-2.51 1.49-3.9
      3.78-3.9 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44
      2.9h-2.34v6.98A10 10 0 0 0 22 12Z"/>
  </svg>
);

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6"/>
  </svg>
);

/* ── visual config by org_type ── */
interface UnitConfig {
  gradientFrom: string;
  gradientTo: string;
  tagLabel: string;
  tagClass: string;
  ctaClass: string;
}

export function getUnitConfig(org: Organization): UnitConfig {
  if (org.org_type === 'rotc') {
    return {
      gradientFrom: '#3d4a1e',
      gradientTo:   '#c8a23a',
      tagLabel:     'ROTC Unit',
      tagClass:     'su-tag su-tag--rotc',
      ctaClass:     'su-cta su-cta--rotc',
    };
  }
  /* spu / publication */
  const [a, b] = getPalette(org.name);
  return {
    gradientFrom: a,
    gradientTo:   b,
    tagLabel:     'Publication',
    tagClass:     'su-tag su-tag--pub',
    ctaClass:     'su-cta su-cta--pub',
  };
}

/* ── component ── */
interface Props {
  org: Organization;
  onClick: () => void;
}

export default function SpecialUnitCard({ org, onClick }: Props) {
  const cfg = getUnitConfig(org);
  const initials = getInitials(org.name);

  return (
    <article className="su-card" onClick={onClick}>
      {/* Coloured art panel */}
      <div
        className="su-art"
        style={{ background: `linear-gradient(145deg, ${cfg.gradientFrom}, ${cfg.gradientTo})` }}
      >
        <div className="su-pattern" aria-hidden="true" />
        <div className="su-logo">
          {org.logo_url
            ? <img src={org.logo_url} alt={org.name} />
            : <span>{initials}</span>
          }
        </div>
      </div>

      {/* Body */}
      <div className="su-body">
        <span className={cfg.tagClass}>{cfg.tagLabel}</span>
        <h3 className="su-name">{org.name}</h3>
        <p className="su-desc">{org.description ?? ''}</p>
        {org.facebook_link && (
          <div className="su-foot">
            <a
              className={cfg.ctaClass}
              href={org.facebook_link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
            >
              <FbIcon />
              <span>Visit {org.name} on Facebook</span>
              <ArrowIcon />
            </a>
          </div>
        )}
      </div>
    </article>
  );
}
