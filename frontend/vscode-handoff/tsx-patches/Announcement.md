# Announcement Section — JSX additions

Add a pinned strip above the grid and ensure announcement cards expose the `.announcement-tag` + variant classes.

## In `layout/announcement-section/Announcement.tsx`

```tsx
import "./announcement.css";
import AnnouncementCard from "../../components/announcement-card/Announcement-card";
import { announcementConfig } from "../../config/bulletinConfig"; // adjust to your config

export default function Announcement() {
  const pinned = announcementConfig.find(a => a.pinned);
  const list = announcementConfig.filter(a => !a.pinned);

  return (
    <section className="announcement-section" id="announcements">
      <div className="section-head">
        <div className="kicker">From the council</div>
        <h2>Latest <em>announcements</em></h2>
        <p>Notices, advisories, and updates from your CSG officers.</p>
      </div>

      {pinned && (
        <button
          type="button"
          className="pinned-strip"
          onClick={() => {/* open modal or navigate */}}
        >
          <span className="pinned-badge">📌 Pinned</span>
          <span className="pinned-title">{pinned.title}</span>
          <span className="pinned-date">{pinned.date}</span>
          <span className="pinned-arrow">→</span>
        </button>
      )}

      <div className="announcement-grid">
        {list.map(a => (
          <AnnouncementCard key={a.id} {...a} />
        ))}
      </div>
    </section>
  );
}
```

## In `components/announcement-card/Announcement-card.tsx`

Add a tag variant prop so the card can render `.tag-event` / `.tag-update` / default:

```tsx
type Tag = "notice" | "event" | "update";

export default function AnnouncementCard({ title, desc, date, tag = "notice", onClick }: Props) {
  const tagClass = tag === "event" ? "tag-event" : tag === "update" ? "tag-update" : "";
  const tagLabel = tag.charAt(0).toUpperCase() + tag.slice(1);

  return (
    <article className="announcement-card" onClick={onClick}>
      <div className="announcement-meta">
        <span className={`announcement-tag ${tagClass}`}>{tagLabel}</span>
        <span className="announcement-date">{date}</span>
      </div>
      <h3 className="announcement-title">{title}</h3>
      <p className="announcement-desc">{desc}</p>
      <span className="announcement-link">Read more <span className="arr">→</span></span>
    </article>
  );
}
```

The animated top accent bar comes for free from the CSS — no JSX work needed.
