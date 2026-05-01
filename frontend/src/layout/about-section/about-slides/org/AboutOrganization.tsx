import { useState, useEffect } from 'react';
import './AboutOrganization.css';
import Typography from '../../../../components/typography/Typography';

interface Organization {
  id: number;
  name: string;
  image: string;
  description: string;
  type: 'Academic' | 'Non-Academic';
}

const organizations: Organization[] = [
  {
    id: 1,
    name: 'Organization 1',
    image: 'https://cdn-icons-png.flaticon.com/512/3050/3050159.png',
    description:
      'Organization 1 is dedicated to fostering leadership and excellence among students through various programs and activities.',
    type: 'Academic',
  },
  {
    id: 2,
    name: 'Organization 2',
    image: 'https://cdn-icons-png.flaticon.com/512/3556/3556098.png',
    description:
      'Organization 2 focuses on community service and outreach, building meaningful connections across the campus.',
    type: 'Academic',
  },
  {
    id: 3,
    name: 'Organization 3',
    image: 'https://cdn-icons-png.flaticon.com/512/4436/4436481.png',
    description:
      'Organization 3 promotes cultural awareness and appreciation through events, performances, and advocacy.',
    type: 'Academic',
  },
  {
    id: 4,
    name: 'Organization 4',
    image: 'https://cdn-icons-png.flaticon.com/512/1087/1087815.png',
    description:
      'Organization 4 drives innovation and technology initiatives, empowering members with modern skills.',
    type: 'Academic',
  },
  {
    id: 5,
    name: 'Organization 5',
    image: 'https://cdn-icons-png.flaticon.com/512/3050/3050159.png',
    description:
      'Organization 5 is dedicated to fostering leadership and excellence among students through various programs and activities.',
    type: 'Academic',
  },
  {
    id: 6,
    name: 'Organization 6',
    image: 'https://cdn-icons-png.flaticon.com/512/3556/3556098.png',
    description:
      'Organization 6 focuses on community service and outreach, building meaningful connections across the campus.',
    type: 'Academic',
  },
  {
    id: 7,
    name: 'Organization 7',
    image: 'https://cdn-icons-png.flaticon.com/512/4436/4436481.png',
    description:
      'Organization 7 promotes cultural awareness and appreciation through events, performances, and advocacy.',
    type: 'Academic',
  },
  {
    id: 8,
    name: 'Organization 8',
    image: 'https://cdn-icons-png.flaticon.com/512/1087/1087815.png',
    description:
      'Organization 8 drives innovation and technology initiatives, empowering members with modern skills.',
    type: 'Academic',
  },
  {
    id: 9,
    name: 'Organization 9',
    image: 'https://cdn-icons-png.flaticon.com/512/3050/3050159.png',
    description:
      'Organization 9 is dedicated to fostering leadership and excellence among students.',
    type: 'Academic',
  },
  {
    id: 10,
    name: 'Organization 10',
    image: 'https://cdn-icons-png.flaticon.com/512/3556/3556098.png',
    description:
      'Organization 10 focuses on community service and outreach across the campus.',
    type: 'Academic',
  },
  {
    id: 11,
    name: 'Organization 11',
    image: 'https://cdn-icons-png.flaticon.com/512/4436/4436481.png',
    description:
      'Organization 11 promotes cultural awareness and appreciation through events and advocacy.',
    type: 'Non-Academic',
  },
  {
    id: 12,
    name: 'Organization 12',
    image: 'https://cdn-icons-png.flaticon.com/512/1087/1087815.png',
    description:
      'Organization 12 drives innovation and technology initiatives for members.',
    type: 'Non-Academic',
  },
  {
    id: 13,
    name: 'Organization 13',
    image: 'https://cdn-icons-png.flaticon.com/512/3050/3050159.png',
    description:
      'Organization 13 empowers students through leadership and service.',
    type: 'Non-Academic',
  },
  {
    id: 14,
    name: 'Organization 14',
    image: 'https://cdn-icons-png.flaticon.com/512/3556/3556098.png',
    description:
      'Organization 14 builds campus community through outreach programs.',
    type: 'Non-Academic',
  },
  {
    id: 15,
    name: 'Organization 15',
    image: 'https://cdn-icons-png.flaticon.com/512/4436/4436481.png',
    description:
      'Organization 15 fosters cultural pride and awareness on campus.',
    type: 'Non-Academic',
  },
  {
    id: 16,
    name: 'Organization 16',
    image: 'https://cdn-icons-png.flaticon.com/512/1087/1087815.png',
    description:
      'Organization 16 champions technology and modern skills development.',
    type: 'Non-Academic',
  },
];

const AboutOrganization = () => {
  const [selected, setSelected] = useState<Organization | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  const academicOrgs = organizations.filter((o) => o.type === 'Academic');
  const nonAcademicOrgs = organizations.filter(
    (o) => o.type === 'Non-Academic'
  );

  const handleSelect = (org: Organization) => {
    setSelected(org);
    setIsModalOpen(true);
    setTimeout(() => setAnimateIn(true), 10);
  };

  const handleClose = () => {
    setAnimateIn(false);
    setTimeout(() => {
      setIsModalOpen(false);
      setSelected(null);
    }, 300);
  };

  // Close on Escape key only
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const OrgCard = ({ org }: { org: Organization }) => (
    <div className='org-card' onClick={() => handleSelect(org)}>
      <div className='org-card-img-wrapper'>
        <img src={org.image} alt={org.name} draggable={false} />
      </div>
      <span className='org-card-name'>{org.name}</span>
    </div>
  );

  return (
    <div className='about-organization-container'>
      {/* Header */}
      <div className='about-texts'>
        <Typography size='text-lg' color='text-dark'>
          Organizations
        </Typography>
        <Typography size='text-sm' color='text-dark'>
          Get to know the CVSU-Imus organizations.
        </Typography>
      </div>

      {/* Main Panel */}
      <div className='organization-panel'>
        {/* Academic Section */}
        <div className='org-section'>
          <p className='org-section-label'>Academic Organizations</p>
          <div className='org-grid'>
            {academicOrgs.map((org) => (
              <OrgCard key={org.id} org={org} />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className='org-section-divider' />

        {/* Non-Academic Section */}
        <div className='org-section'>
          <p className='org-section-label'>Non-Academic Organizations</p>
          <div className='org-grid'>
            {nonAcademicOrgs.map((org) => (
              <OrgCard key={org.id} org={org} />
            ))}
          </div>
        </div>
      </div>

      {/* Modal — floats over the panel, no overlay, scroll still works */}
      {isModalOpen && (
        <div className={`org-modal-overlay ${animateIn ? 'open' : ''}`}>
          <div className={`org-modal ${animateIn ? 'open' : ''}`}>
            <button className='org-modal-close' onClick={handleClose}>
              ✕
            </button>
            {selected && (
              <div className='org-modal-content'>
                <div className='org-modal-img-wrapper'>
                  <img src={selected.image} alt={selected.name} />
                </div>
                <div className='org-modal-info'>
                  <span className='org-modal-badge'>
                    {selected.type} Organization
                  </span>
                  <h2 className='org-modal-name'>{selected.name}</h2>
                  <p className='org-modal-description'>
                    {selected.description}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AboutOrganization;
