import '../_shared/admin-list.css';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { FaGithub, FaEnvelope, FaFacebook, FaInstagram } from 'react-icons/fa';
import Sidebar from '../_shared/Sidebar';
import { PageHead } from '../_shared/chrome';

const API_URL = import.meta.env.VITE_API_URL as string;

const contributors = [
  {
    name: 'Ivan P. Duran',
    role: 'Committee Chair — Web Development',
    term: '2025-2026',
    description: 'Oversees the technical direction and development of the CSG-OITS platform.',
    initials: 'ID',
    github:    'https://github.com/sleepdeprive-gray',
    facebook:  'https://www.facebook.com/infectious.ivan',
    email:     'ayban.duran@gmail.com',
    instagram: 'https://www.instagram.com/not.aybann',
  },
  {
    name: 'John Harold R. Magma',
    role: 'GAD Representative / Project Coordinator',
    term: '2025-2026',
    description: 'Coordinates overall project delivery and serves as the primary liaison between the CSG and the development team.',
    initials: 'JM',
    github:    'https://github.com/Hexizen',
    facebook:  'https://www.facebook.com/jhnhrldmgm',
    email:     'johnharold8888@gmail.com',
    instagram: 'https://www.instagram.com/jhnhrldmgm',
  },
  {
    name: 'Lorenz E. Tuboro',
    role: 'Back-End Developer',
    term: '2025-2026',
    description: 'Designs and maintains the Express API, Supabase integration, and server-side authentication.',
    initials: 'LT',
    github:    'https://github.com/tubolorenz',
    facebook:  'https://www.facebook.com/lorenztuboro',
    email:     'theoneandonlyrenz@gmail.com',
    instagram: 'https://www.instagram.com/lorenztuboro',
  },
  {
    name: 'Ralph Kenneth B. Perez',
    role: 'UI/UX Designer',
    term: '2025-2026',
    description: 'Leads the visual design, layout systems, and user experience of the public and admin interfaces.',
    initials: 'RP',
    github:    'https://github.com/ralphperez',
    facebook:  'https://www.facebook.com/ralphperez',
    email:     'ralphperez@example.com',
    instagram: 'https://www.instagram.com/ralphperez',
  },
  {
    name: 'Jerald D. Estrella',
    role: 'Front-End Developer',
    term: '2025-2026',
    description: 'Implements React components and integrates frontend views with backend API endpoints.',
    initials: 'JE',
    github:    'https://github.com/jerald-estrella',
    facebook:  'https://www.facebook.com/jerald.estrella',
    email:     'jerald.estrella@example.com',
    instagram: 'https://www.instagram.com/jerald.estrella',
  },
  {
    name: 'Taisei Domingo',
    role: 'Front-End Developer',
    term: '2025-2026',
    description: 'Builds and maintains interactive UI components and responsive layouts across the system.',
    initials: 'TD',
    github:    'https://github.com/taisei-domingo',
    facebook:  'https://www.facebook.com/taisei.domingo',
    email:     'taisei.domingo@example.com',
    instagram: 'https://www.instagram.com/taisei.domingo',
  },
  {
    name: 'Gerald D. Alansalon',
    role: 'Documentation Officer',
    term: '2025-2026',
    description: 'Manages technical documentation, system changelogs, and development records for the project.',
    initials: 'GA',
    github:    'https://github.com/gerald-alansalon',
    facebook:  'https://www.facebook.com/gerald.alansalon',
    email:     'gerald.alansalon@example.com',
    instagram: 'https://www.instagram.com/gerald.alansalon',
  },
] as const;

type Contributor = (typeof contributors)[number];
interface OfficerMatch { avatar: string | null; year_serving: string | null; }

function ContributorCard({ c, avatar }: { c: Contributor; avatar: string | null }) {
  const iconStyle: React.CSSProperties = {
    color: 'var(--color-text-muted)', display: 'flex', transition: 'color 160ms',
  };

  return (
    <div style={{
      background: '#fff',
      borderRadius: 14,
      padding: '24px 20px',
      textAlign: 'center',
      boxShadow: '0 1px 3px rgba(15,23,41,0.06), 0 0 0 1px rgba(15,23,41,0.04)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: 250,          /* fixed width — prevents cards from stretching on the short last row */
      flexShrink: 0,
    }}>
      {/* Avatar */}
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        overflow: 'hidden', flexShrink: 0,
        background: 'var(--color-surface-deep, #eef1fb)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 0 3px #fff, 0 0 0 5px var(--color-primary-light, #c8d2ef)',
        marginBottom: 12,
      }}>
        {avatar
          ? <img src={avatar} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--color-primary, #4f6fd1)' }}>{c.initials}</span>
        }
      </div>

      {/* Name */}
      <p style={{ fontWeight: 700, margin: '0 0 2px', fontSize: '0.9rem', color: 'var(--color-text-primary, #0f1729)', letterSpacing: '-0.01em' }}>
        {c.name}
      </p>

      {/* Role */}
      <p style={{ fontSize: '0.78rem', color: 'var(--color-primary, #4f6fd1)', fontWeight: 600, margin: '0 0 2px' }}>
        {c.role}
      </p>

      {/* Term */}
      <p style={{ fontSize: '0.73rem', color: 'var(--color-text-muted, #6b7280)', margin: '0 0 10px' }}>
        {c.term}
      </p>

      {/* Description */}
      <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary, #374151)', lineHeight: 1.55, margin: '0 0 14px', flexGrow: 1 }}>
        {c.description}
      </p>

      {/* Divider */}
      <div style={{ width: '100%', height: 1, background: 'var(--color-border-soft, #eef0f5)', margin: '0 0 12px' }} />

      {/* Social links */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'center' }}>
        <a href={c.github}    target="_blank" rel="noopener noreferrer" style={iconStyle}
          onMouseEnter={e => (e.currentTarget.style.color = '#1a1a1a')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
        ><FaGithub size={15} /></a>
        <a href={c.facebook}  target="_blank" rel="noopener noreferrer" style={iconStyle}
          onMouseEnter={e => (e.currentTarget.style.color = '#1877f2')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
        ><FaFacebook size={15} /></a>
        <a href={`https://mail.google.com/mail/?view=cm&to=${c.email}`} target="_blank" rel="noopener noreferrer" style={iconStyle}
          onMouseEnter={e => (e.currentTarget.style.color = '#4f6fd1')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
        ><FaEnvelope size={15} /></a>
        <a href={c.instagram} target="_blank" rel="noopener noreferrer" style={iconStyle}
          onMouseEnter={e => (e.currentTarget.style.color = '#e1306c')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
        ><FaInstagram size={15} /></a>
      </div>
    </div>
  );
}

const Contributor = () => {
  const [officerMap, setOfficerMap] = useState<Record<string, OfficerMatch>>({});

  useEffect(() => {
    axios.get(`${API_URL}/officers`, { withCredentials: true })
      .then(({ data }) => {
        const map: Record<string, OfficerMatch> = {};
        for (const o of data) {
          map[o.full_name] = { avatar: o.avatar ?? null, year_serving: o.year_serving ?? null };
        }
        setOfficerMap(map);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="ad-shell">
      <Sidebar active="contributors" />
      <main className="ad-main">
        <PageHead
          title="Contributors"
          subtitle="The team behind the CSG Online Information Transparency System."
        />

        {/* Fixed card width + justify-content:center → 4 per row, last row of 3 auto-centers */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1.25rem',
          justifyContent: 'center',
        }}>
          {contributors.map(c => (
            <ContributorCard
              key={c.name}
              c={c}
              avatar={officerMap[c.name]?.avatar ?? null}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Contributor;
