import './committees.css';
import { useOutletContext } from 'react-router-dom';
import type { OutletContext } from '../../root-layout/Root-layout';
import type { Committee } from '../../config/committeeConfig';

const Arrow = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

function Avatar({ initials, size = 36 }: { initials: string; size?: number }) {
  return (
    <span
      className="cc-avatar"
      style={{ width: size, height: size, fontSize: size * 0.34 }}
    >
      {initials}
    </span>
  );
}

function Photo({ src, initials }: { src: string | null; initials: string }) {
  if (!src) {
    return (
      <div className="cc-photo cc-photo--ph" role="img" aria-label="Committee placeholder">
        <span className="cc-photo-mark">{initials}</span>
      </div>
    );
  }
  return (
    <div
      className="cc-photo"
      style={{ backgroundImage: `url(${src})` }}
      role="img"
      aria-label="Committee cover photo"
    />
  );
}

export default function CommitteesPage() {
  const { committees, officers } = useOutletContext<OutletContext>();

  const activeCommittees = committees.filter(
    (c: Committee) => c.status === 'active' && !c.deleted_at,
  );

  return (
    <div className="cc-section">
      <header className="cc-section-head">
        <span className="cc-kicker">COMMITTEES</span>
        <h2>
          Ten committees, <em>one</em> CSG.
        </h2>
        <p>Each committee runs the day-to-day work behind a slice of student life.</p>
      </header>

      <div className="cc-grid cc-grid--banner">
        {activeCommittees.map((c: Committee) => {
          const memberCount = officers.filter((o) => o.committee === c.id).length;
          const chairInitials = c.chair_name
            ? c.chair_name
                .split(' ')
                .filter(Boolean)
                .map((w) => w[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
            : '??';

          return (
            <article key={c.id} className="cc-card cc-card--banner" tabIndex={0}>
              <Photo src={c.cover_image_url} initials={chairInitials} />
              <div className="cc-card-body">
                <h3 className="cc-card-title">{c.name}</h3>
                <div className="cc-chair">
                  <Avatar initials={chairInitials} size={28} />
                  <div className="cc-chair-text">
                    <span className="cc-chair-label">Chaired by</span>
                    <span className="cc-chair-name">{c.chair_name ?? 'Unassigned'}</span>
                  </div>
                </div>
                <div className="cc-card-foot">
                  <span className="cc-count">
                    {memberCount} <span>members</span>
                  </span>
                  <a href="#" className="cc-link" onClick={(e) => e.preventDefault()}>
                    View members <Arrow />
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
