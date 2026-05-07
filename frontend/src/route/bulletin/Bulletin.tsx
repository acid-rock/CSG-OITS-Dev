import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import Modal from "../../components/modal/Modal";
import type { Announcement, OutletContext } from "../../root-layout/Root-layout";
import "./bulletin.css";

function getTagClass(type?: string): string {
  if (!type) return "tag-notice";
  const t = type.toLowerCase();
  if (t.includes("event"))  return "tag-event";
  if (t.includes("update")) return "tag-update";
  return "tag-notice";
}

function getTagLabel(type?: string): string {
  if (!type) return "Notice";
  const t = type.toLowerCase();
  if (t.includes("event"))  return "Event";
  if (t.includes("update")) return "Update";
  return "Notice";
}

const Bulletin = () => {
  /* ── Locked data bindings ── */
  const { bulletin } = useOutletContext<OutletContext>();
  const [selected, setSelected] = useState<Announcement | null>(null);
  const [open, setOpen]         = useState(false);

  /* Fix 6B: search only — no filter pills */
  const [query, setQuery] = useState("");

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  };

  const handleOpen = (ann: Announcement) => {
    setSelected(ann);
    setOpen(true);
  };

  const pinned = bulletin.find((a) => a.is_pinned);

  /* Fix 6B: filter by search only */
  const filtered = bulletin.filter((a) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      a.title?.toLowerCase().includes(q) ||
      a.content?.toLowerCase().includes(q)
    );
  });

  const remaining = filtered.filter((a) => !a.is_pinned);

  return (
    <>
      {/* PAGE HEADER */}
      <div className="bl-header">
        <div className="bl-header-inner">
          <span className="section-label bl-kicker">From the council</span>
          <h1 className="bl-heading">
            Stay <em className="italic-accent">informed</em>, stay{" "}
            <em className="italic-accent">involved</em>
          </h1>
          <p className="bl-subheading">
            Notices, advisories, and updates from your CSG officers.
          </p>
        </div>
      </div>

      {/* Fix 6B: search bar only — no filter pills */}
      <div className="bl-toolbar-wrap">
        <div className="bl-toolbar bl-toolbar-center">
          <div className="bl-search-wrap">
            <span className="bl-search-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </span>
            <input
              type="text"
              className="bl-search"
              placeholder="Search announcements..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="bl-content">

        {/* Pinned hero card */}
        {pinned && (
          <div className="bl-pinned card" onClick={() => handleOpen(pinned)}>
            {/* Image panel */}
            <div className="bl-pinned-img">
              {pinned.imgUrl && (
                <img
                  src={pinned.imgUrl}
                  alt={pinned.title}
                  className="bl-pinned-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
              <span className="bl-pinned-badge">📌 Pinned</span>
            </div>

            {/* Content panel — Fix 6A: author row removed */}
            <div className="bl-pinned-body">
              <span className={`tag ${getTagClass((pinned as any).type)} bl-pinned-tag`}>
                {getTagLabel((pinned as any).type)}
              </span>
              <p className="bl-pinned-meta">
                {formatDate(pinned.date)}&nbsp;&nbsp;·&nbsp;&nbsp;3 min read
              </p>
              <h2 className="bl-pinned-title">{pinned.title}</h2>
              <p className="bl-pinned-desc">{pinned.content}</p>
              {/* Fix 6A: "Continue reading" directly here, no author row */}
              <span className="bl-read-more" style={{ marginTop: "var(--space-4)", display: "block" }}>
                Continue reading →
              </span>
            </div>
          </div>
        )}

        {remaining.length === 0 && !pinned && (
          <p className="bl-empty">No announcements found.</p>
        )}

        {/* Three-column grid */}
        {remaining.length > 0 && (
          <div className="bl-grid">
            {remaining.map((ann) => (
              <div key={ann.id} className="bl-card card" onClick={() => handleOpen(ann)}>
                <div className="bl-card-img-wrap">
                  {ann.imgUrl && (
                    <img
                      src={ann.imgUrl}
                      alt={ann.title}
                      className="bl-card-img"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                  <span className={`tag ${getTagClass((ann as any).type)} bl-card-tag`}>
                    {getTagLabel((ann as any).type)}
                  </span>
                </div>
                <div className="bl-card-body">
                  <p className="bl-card-meta">{formatDate(ann.date)}&nbsp;&nbsp;·&nbsp;&nbsp;2 min read</p>
                  <h3 className="bl-card-title">{ann.title}</h3>
                  <p className="bl-card-desc">{ann.content}</p>
                  <span className="bl-card-link">Read more →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {open && selected && (
        <Modal
          isOpen={open}
          setOpen={setOpen}
          imageSrc={selected.imgUrl}
          imageAlt={selected.title}
          date={formatDate(selected.date)}
          title={selected.title}
          description={selected.content}
        />
      )}
    </>
  );
};

export default Bulletin;
