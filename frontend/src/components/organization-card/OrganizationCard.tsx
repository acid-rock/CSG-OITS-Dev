import { useState } from 'react';
import { FaFacebook } from 'react-icons/fa';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';
import type { Organization } from '../../root-layout/Root-layout';
import './OrganizationCard.css';

interface OrganizationCardProps {
  org: Organization;
}

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function OrganizationCard({ org }: OrganizationCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  useLockBodyScroll(modalOpen);

  const logoUrl = org.logo_path
    ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/organizations/${org.logo_path}`
    : null;

  return (
    <>
      <div className='org-card card' onClick={() => setModalOpen(true)}>
        <div className='org-avatar'>
          {logoUrl && !imgError ? (
            <img src={logoUrl} alt={org.name} className='org-avatar-img' onError={() => setImgError(true)} />
          ) : (
            <span className='org-initials'>{getInitials(org.name)}</span>
          )}
        </div>
        <h3 className='org-name'>{org.name}</h3>
        {org.description && (
          <p className='org-desc'>{org.description}</p>
        )}
        {org.facebook_link && (
          <a
            href={org.facebook_link}
            target='_blank'
            rel='noopener noreferrer'
            className='org-fb'
            onClick={(e) => e.stopPropagation()}
            aria-label={`${org.name} on Facebook`}
          >
            <FaFacebook size={16} />
          </a>
        )}
      </div>

      {modalOpen && (
        <div className='org-modal-overlay' onClick={() => setModalOpen(false)}>
          <div className='org-modal' onClick={(e) => e.stopPropagation()}>
            <button className='org-modal-close' onClick={() => setModalOpen(false)} aria-label='Close'>×</button>
            <div className='org-modal-avatar'>
              {logoUrl && !imgError ? (
                <img src={logoUrl} alt={org.name} className='org-modal-img' onError={() => setImgError(true)} />
              ) : (
                <span className='org-initials org-modal-initials'>{getInitials(org.name)}</span>
              )}
            </div>
            <h2 className='org-modal-name'>{org.name}</h2>
            {org.description && <p className='org-modal-desc'>{org.description}</p>}
            {org.facebook_link && (
              <a href={org.facebook_link} target='_blank' rel='noopener noreferrer' className='org-modal-fb-btn'>
                <FaFacebook size={16} style={{ marginRight: '0.4rem' }} />
                Visit Facebook Page
              </a>
            )}
          </div>
        </div>
      )}
    </>
  );
}
