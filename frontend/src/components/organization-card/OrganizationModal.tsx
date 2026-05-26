import { useEffect } from 'react';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';
import type { Organization } from '../../config/organizationsConfig';
import './OrganizationCard.css';

interface OrganizationModalProps {
  organization: Organization;
  isOpen: boolean;
  onClose: () => void;
  /** Sub-organizations belonging to this org */
  subOrgs?: Organization[];
}

/* Deterministic gradient — kept in sync with OrganizationCard.tsx */
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

const FbIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M22 12a10 10 0 1 0-11.56 9.88V14.9H7.9V12h2.54V9.8c0-2.51 1.49-3.9
      3.78-3.9 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44
      2.9h-2.34v6.98A10 10 0 0 0 22 12Z"/>
  </svg>
);

/* Mini-card shown inside the parent org's modal */
function SubOrgMiniCard({ org }: { org: Organization }) {
  const [a, b] = getPalette(org.name);
  const initials = getInitials(org.name);
  return (
    <div className="org-suborg-mini">
      <div className="org-suborg-mini-logo"
        style={{ background: org.logo_url ? undefined : `linear-gradient(135deg, ${a}, ${b})` }}>
        {org.logo_url
          ? <img src={org.logo_url} alt={org.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span>{initials}</span>}
      </div>
      <div className="org-suborg-mini-info">
        <span className="org-suborg-mini-name">{org.name}</span>
        {org.facebook_link && (
          <a className="org-suborg-mini-link" href={org.facebook_link}
            target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}>
            <FbIcon /> Visit page
          </a>
        )}
      </div>
    </div>
  );
}

export default function OrganizationModal({ organization, isOpen, onClose, subOrgs = [] }: OrganizationModalProps) {
  useLockBodyScroll(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const [a, b] = getPalette(organization.name);
  const initials = getInitials(organization.name);

  return (
    <div className="org-modal-overlay" onClick={onClose}>
      <div className="org-modal" onClick={(e) => e.stopPropagation()}>
        <button className="org-modal-close" onClick={onClose} aria-label="Close">×</button>

        {/* Avatar — gradient background matches the card */}
        <div
          className="org-modal-avatar"
          style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
        >
          {organization.logo_url ? (
            <img src={organization.logo_url} alt={organization.name} className="org-modal-img" />
          ) : (
            <span className="org-initials">{initials}</span>
          )}
        </div>

        <h2 className="org-modal-name">{organization.name}</h2>

        {organization.description && (
          <p className="org-modal-desc">{organization.description}</p>
        )}

        {organization.facebook_link && (
          <a
            href={organization.facebook_link}
            target="_blank"
            rel="noopener noreferrer"
            className="org-modal-fb-btn"
          >
            <FbIcon />
            Visit Facebook Page
          </a>
        )}

        {/* Sub-organizations section */}
        {subOrgs.length > 0 && (
          <div className="org-modal-suborgs">
            <p className="org-modal-suborgs-label">
              Sub-organizations ({subOrgs.length})
            </p>
            <div className="org-modal-suborgs-list">
              {subOrgs.map(sub => (
                <SubOrgMiniCard key={sub.id} org={sub} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
