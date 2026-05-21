import type { Organization } from '../../config/organizationsConfig';
import './OrganizationCard.css';

interface OrganizationCardProps {
  organization: Organization;
  onClick: () => void;
}

/* Deterministic gradient from org name — same palette as /organizations page */
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

const TYPE_CONFIG: Record<string, { tone: string; label: string }> = {
  academic:     { tone: 'primary', label: 'Academic' },
  'non-academic':{ tone: 'warning', label: 'Non-academic' },
  spu:          { tone: 'success', label: 'Publication' },
};

const CalIcon = () => (
  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
  </svg>
);

const FbIcon = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
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

export default function OrganizationCard({ organization, onClick }: OrganizationCardProps) {
  const [a, b] = getPalette(organization.name);
  const initials = getInitials(organization.name);
  const typeConf = organization.org_type ? TYPE_CONFIG[organization.org_type] : null;
  const year = new Date(organization.created_at).getFullYear();

  return (
    <article
      className="org-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      {/* Top row: gradient logo + type tag */}
      <div className="org-card-top">
        <div
          className="org-card-logo"
          style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
        >
          {organization.logo_url
            ? <img src={organization.logo_url} alt={organization.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span>{initials}</span>
          }
        </div>
        {typeConf && (
          <span className={`org-tag tone-${typeConf.tone}`}>{typeConf.label}</span>
        )}
      </div>

      {/* Name */}
      <h3 className="org-card-name">{organization.name}</h3>

      {/* Description */}
      <p className="org-card-desc">{organization.description ?? ''}</p>

      {/* Footer: year + Facebook CTA */}
      <div className="org-card-foot">
        <span className="org-card-meta">
          <CalIcon />
          Est. {year}
        </span>
        {organization.facebook_link && (
          <a
            className="org-card-cta"
            href={organization.facebook_link}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Visit ${organization.name} on Facebook`}
            onClick={(e) => e.stopPropagation()}
          >
            <FbIcon />
            <span>Visit page</span>
            <ArrowIcon />
          </a>
        )}
      </div>
    </article>
  );
}
