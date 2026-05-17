import { useEffect } from 'react';
import { useLockBodyScroll } from '../../../../hooks/useLockBodyScroll';
import './PublicPreviewModal.css';

type PreviewType = 'announcement' | 'document' | 'event';

interface PublicPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: PreviewType;
  item: Record<string, unknown>;
}

/* ── Helpers ── */
function formatDate(value: unknown): string {
  if (!value) return '—';
  const s = String(value);
  const d = new Date(s);
  if (isNaN(d.getTime())) return s; // already formatted (e.g. "May 8, 2026")
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function readTime(text: unknown): number {
  const words = String(text ?? '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function formatDocType(raw: unknown): string {
  return String(raw ?? 'document')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function fileNameFromPath(path: unknown): string {
  return String(path ?? '').split('/').pop()?.replace(/\.pdf$/i, '') ?? String(path ?? '');
}

/* ── Announcement preview ── */
function AnnouncementPreview({ item }: { item: Record<string, unknown> }) {
  const category = String(item.category ?? 'CSG Updates');
  const title    = String(item.title   ?? '');
  const content  = String(item.content ?? '');
  const imgUrl   = item.imgUrl ? String(item.imgUrl) : null;
  const isPinned = !!item.is_pinned;

  return (
    <div className='ppm-ann-wrapper'>
      {isPinned && (
        <div className='ppm-pinned-strip'>
          <span className='ppm-pinned-badge'>📌 Pinned</span>
          <span className='ppm-pinned-title'>{title}</span>
        </div>
      )}
      <div className='ppm-ann-card'>
        <div className='ppm-ann-img-wrap'>
          {imgUrl ? (
            <img src={imgUrl} alt={title} className='ppm-ann-img'
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className='ppm-ann-img-placeholder'>No image</div>
          )}
          <span className='ppm-ann-tag'>{category}</span>
        </div>
        <div className='ppm-ann-body'>
          <p className='ppm-ann-meta'>
            {formatDate(item.date)} · {readTime(content)} min read
          </p>
          <h3 className='ppm-ann-title'>{title || <em>No title</em>}</h3>
          <p className='ppm-ann-content'>{content || <em>No content</em>}</p>
          <span className='ppm-ann-link'>Continue reading →</span>
        </div>
      </div>
    </div>
  );
}

/* ── Document preview ── */
function DocumentPreview({ item }: { item: Record<string, unknown> }) {
  const name        = String(item.name        ?? '');
  const description = String(item.description ?? '');
  const category    = item.category ? String(item.category) : null;
  const thumbnail   = item.thumbnail ? String(item.thumbnail) : null;
  const term        = item.term ? String(item.term) : null;

  const displayName = fileNameFromPath(name);
  const typeLabel   = category ? formatDocType(category) : 'Document';

  return (
    <div className='ppm-doc-wrapper'>
      <div className='ppm-doc-card'>
        <div className='ppm-doc-thumb'>
          {thumbnail ? (
            <img src={thumbnail} alt={displayName} className='ppm-doc-thumb-img' />
          ) : (
            <img src='/CSG_logo.svg' alt='Document' className='ppm-doc-logo' />
          )}
          <span className='ppm-doc-type-tag'>{typeLabel}</span>
        </div>
        <div className='ppm-doc-body'>
          <p className='ppm-doc-category'>{typeLabel}</p>
          <h3 className='ppm-doc-name'>{displayName || name || <em>Unnamed document</em>}</h3>
          {description && <p className='ppm-doc-desc'>{description}</p>}
          <div className='ppm-doc-meta'>
            {term && <span className='ppm-doc-term'>{term}</span>}
            <span className='ppm-doc-date'>{formatDate(item.createdAt)}</span>
          </div>
        </div>
        <div className='ppm-doc-action'>
          <button disabled className='ppm-doc-btn'>View →</button>
        </div>
      </div>
      <p className='ppm-doc-note'>
        The actual document opens in a PDF viewer on the public website.
      </p>
    </div>
  );
}

/* ── Event preview ── */
function EventPreview({ item }: { item: Record<string, unknown> }) {
  const name        = String(item.name        ?? '');
  const description = String(item.description ?? '');
  const date        = item.date ? String(item.date) : null;
  const images      = Array.isArray(item.images) ? (item.images as string[]) : [];
  const firstImage  = images[0] ?? null;

  return (
    <div className='ppm-ev-card'>
      <div className='ppm-ev-img-wrap'>
        {firstImage ? (
          <img src={firstImage} alt={name} className='ppm-ev-img'
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/CSG_logo.svg';
              (e.currentTarget as HTMLImageElement).style.objectFit = 'contain';
              (e.currentTarget as HTMLImageElement).style.opacity = '0.3';
            }}
          />
        ) : (
          <div className='ppm-ev-img-placeholder'>No photo</div>
        )}
      </div>
      <div className='ppm-ev-body'>
        {date && <p className='ppm-ev-date'>• {date}</p>}
        <h3 className='ppm-ev-title'>{name || <em>No title</em>}</h3>
        <p className='ppm-ev-desc'>{description || <em>No description</em>}</p>
      </div>
    </div>
  );
}

/* ── Modal ── */
export default function PublicPreviewModal({ isOpen, onClose, type, item }: PublicPreviewModalProps) {
  useLockBodyScroll(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const typeLabel = type === 'announcement' ? 'Announcement'
    : type === 'document' ? 'Document' : 'Event';

  return (
    <div className='ppm-overlay' onClick={onClose}>
      <div className='ppm-modal' onClick={e => e.stopPropagation()}>

        <div className='ppm-header'>
          <div>
            <p className='ppm-label'>PUBLIC PREVIEW</p>
            <p className='ppm-subtitle'>
              This is how students see this {typeLabel.toLowerCase()} on the website
            </p>
          </div>
          <button className='ppm-close' onClick={onClose} aria-label='Close preview'>✕</button>
        </div>

        <div className='ppm-divider' />

        <div className='ppm-content'>
          {type === 'announcement' && <AnnouncementPreview item={item} />}
          {type === 'document'     && <DocumentPreview     item={item} />}
          {type === 'event'        && <EventPreview        item={item} />}
        </div>

        <div className='ppm-divider' />

        <div className='ppm-footer'>
          <button className='ppm-close-btn' onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
