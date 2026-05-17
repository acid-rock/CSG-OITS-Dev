import { useEffect } from 'react';
import { FaFacebook } from 'react-icons/fa';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';
import type { Organization } from '../../config/organizationsConfig';
import './OrganizationCard.css';

interface OrganizationModalProps {
  organization: Organization;
  isOpen: boolean;
  onClose: () => void;
}

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function OrganizationModal({ organization, isOpen, onClose }: OrganizationModalProps) {
  useLockBodyScroll(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="org-modal-overlay" onClick={onClose}>
      <div className="org-modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="org-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <div className="org-modal-avatar">
          {organization.logo_url ? (
            <img
              src={organization.logo_url}
              alt={organization.name}
              className="org-modal-img"
            />
          ) : (
            <span className="org-initials org-modal-initials">
              {getInitials(organization.name)}
            </span>
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
            <FaFacebook size={16} style={{ marginRight: '0.4rem' }} />
            Visit Facebook Page
          </a>
        )}
      </div>
    </div>
  );
}
