import { gradientFor } from './utils';

/* ── Thumb ─────────────────────────────────────────────────── */
interface ThumbProps {
  src?: string | null;
  title: string;
  size?: number;
  kind?: 'image' | 'doc' | 'object';
}

export function Thumb({ src, title, size = 56, kind = 'image' }: ThumbProps) {
  const fallback = (title || 'A').trim().charAt(0).toUpperCase();
  const cls = `ad-thumb ad-thumb--${kind}`;

  if (src) {
    return (
      <div className={cls} style={{ width: size, height: size }} aria-hidden="true">
        <img src={src} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
      </div>
    );
  }

  const [a, b] = gradientFor(title);
  return (
    <div
      className={cls}
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${a}, ${b})` }}
      aria-hidden="true"
    >
      <div className="ad-thumb-glyph">{fallback}</div>
    </div>
  );
}

/* ── Tag ────────────────────────────────────────────────────── */
type Tone = 'primary' | 'warning' | 'danger' | 'neutral' | 'success';

export function Tag({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  return <span className={`ad-tag tone-${tone}`}>{label}</span>;
}

/* ── StatusPill ─────────────────────────────────────────────── */
export function StatusPill({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  return (
    <span className={`ad-status tone-${tone}`}>
      <span className="ad-status-dot" />
      {label}
    </span>
  );
}

/* ── MiniAvatar ─────────────────────────────────────────────── */
export function MiniAvatar({ name }: { name: string }) {
  const initials = name
    .split(/[._\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase() || '??';

  const [a, b] = gradientFor(name);
  return (
    <span className="ad-mini-avatar" title={name}>
      <div className="ad-mini-avatar-photo" style={{ background: `linear-gradient(135deg, ${a}, ${b})` }} />
      <span style={{ position: 'relative', zIndex: 1 }}>{initials}</span>
    </span>
  );
}
