import { FaFacebook } from 'react-icons/fa';
import type { Organization } from '../../config/organizationsConfig';
import './OrganizationCard.css';

interface OrganizationCardProps {
  organization: Organization;
  onClick: () => void;
}

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function OrganizationCard({ organization, onClick }: OrganizationCardProps) {
  return (
    <div
      className="org-card card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div className="org-avatar">
        {organization.logo_url ? (
          <img
            src={organization.logo_url}
            alt={organization.name}
            className="org-avatar-img"
          />
        ) : (
          <span className="org-initials">{getInitials(organization.name)}</span>
        )}
      </div>

      <h3 className="org-name">{organization.name}</h3>

      {organization.description && (
        <p className="org-desc">{organization.description}</p>
      )}

      {organization.facebook_link && (
        <a
          href={organization.facebook_link}
          target="_blank"
          rel="noopener noreferrer"
          className="org-fb"
          onClick={(e) => e.stopPropagation()}
          aria-label={`${organization.name} on Facebook`}
        >
          <FaFacebook size={16} />
        </a>
      )}
    </div>
  );
}
