import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import Modal from "../../components/modal/Modal";
import type {
  Announcement,
  OutletContext,
} from "../../root-layout/Root-layout";
import SearchFilterBar from "../../components/search-filter-bar/SearchFilterBar";
import "./bulletin.css";

const PAGE_SIZE = 9;

function getTagClass(type?: string): string {
  if (!type) return "tag-notice";
  const t = type.toLowerCase();
  if (t.includes("event")) return "tag-event";
  if (t.includes("update")) return "tag-update";
  return "tag-notice";
}

function getTagLabel(type?: string): string {
  if (!type) return "Notice";
  const t = type.toLowerCase();
  if (t.includes("event")) return "Event";
  if (t.includes("update")) return "Update";
  return "Notice";
}

const Bulletin = () => {
  /* ── Locked data bindings ── */
  const { bulletin } = useOutletContext<OutletContext>();
  const [selected, setSelected] = useState<Announcement | null>(null);
  const [open, setOpen] = useState(false);
  // scroll lock is owned by <Modal> — no duplicate call here

  const [query, setQuery] = useState("");
  const [activeTerm, setActiveTerm] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [page, setPage] = useState(1);

  const CATEGORIES = [
    "All",
    "CSG Updates",
    "Class Advisories",
    "Examinations",
    "University Events",
    "Official CVSU",
  ];

  // Derive distinct term_year values from bulletin data
  const termOptions = [
    ...new Set(bulletin.map((a) => (a as any).term_year).filter(Boolean)),
  ]
    .sort()
    .reverse() as string[];

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleOpen = (ann: Announcement) => {
    setSelected(ann);
    setOpen(true);
  };

  const pinned = bulletin.find((a) => a.is_pinned);

  /* Filter by search + category + term (AND logic) */
  const filtered = bulletin.filter((a) => {
    const matchesSearch =
      !query ||
      a.title?.toLowerCase().includes(query.toLowerCase()) ||
      a.content?.toLowerCase().includes(query.toLowerCase());
    const matchesCategory =
      activeCategory === "All" ||
      (a.category ?? "CSG Updates") === activeCategory;
    const matchesTerm = !activeTerm || (a as any).term_year === activeTerm;
    return matchesSearch && matchesCategory && matchesTerm;
  });

  const remaining = filtered.filter((a) => !a.is_pinned);

  // Reset to page 1 whenever filters change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setPage(1); }, [query, activeTerm, activeCategory]);

  const totalPages = Math.max(1, Math.ceil(remaining.length / PAGE_SIZE));
  const paginated  = remaining.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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

      {/* Search + term filter bar */}
      <div className="bl-toolbar-wrap">
        <div
          style={{
            maxWidth: 600,
            margin: "0 auto",
            width: "100%",
            padding: "0 var(--section-padding-x)",
          }}
        >
          <SearchFilterBar
            searchValue={query}
            onSearchChange={setQuery}
            termValue={activeTerm}
            onTermChange={setActiveTerm}
            termOptions={termOptions}
            searchPlaceholder="Search announcements..."
          />
        </div>
      </div>

      {/* Category filter chips */}
      <div className="bl-chips-wrap">
        <div className="bl-chips">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`bl-chip${activeCategory === cat ? " bl-chip-active" : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
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
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                  }}
                />
              )}
              <span className="bl-pinned-badge">📌 Pinned</span>
            </div>

            {/* Content panel — Fix 6A: author row removed */}
            <div className="bl-pinned-body">
              <span
                className={`tag ${getTagClass((pinned as any).type)} bl-pinned-tag`}
              >
                {getTagLabel((pinned as any).type)}
              </span>
              <p className="bl-pinned-meta">
                {formatDate(pinned.date)}&nbsp;&nbsp;·&nbsp;&nbsp;3 min read
              </p>
              <h2 className="bl-pinned-title">{pinned.title}</h2>
              <p className="bl-pinned-desc">{pinned.content}</p>
              {/* Fix 6A: "Continue reading" directly here, no author row */}
              <span
                className="bl-read-more"
                style={{ marginTop: "var(--space-4)", display: "block" }}
              >
                Continue reading →
              </span>
            </div>
          </div>
        )}

        {remaining.length === 0 && !pinned && (
          <p className="bl-empty">No announcements found.</p>
        )}

        {/* Three-column grid — paginated */}
        {remaining.length > 0 && (
          <div className="bl-grid">
            {paginated.map((ann) => (
              <div
                key={ann.id}
                className="bl-card card"
                onClick={() => handleOpen(ann)}
              >
                <div className="bl-card-img-wrap">
                  {ann.imgUrl && (
                    <img
                      src={ann.imgUrl}
                      alt={ann.title}
                      className="bl-card-img"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display =
                          "none";
                      }}
                    />
                  )}
                  <span
                    className={`tag ${getTagClass((ann as any).type)} bl-card-tag`}
                  >
                    {getTagLabel((ann as any).type)}
                  </span>
                </div>
                <div className="bl-card-body">
                  <p className="bl-card-meta">
                    {formatDate(ann.date)}&nbsp;&nbsp;·&nbsp;&nbsp;2 min read
                  </p>
                  <h3 className="bl-card-title">{ann.title}</h3>
                  <p className="bl-card-desc">{ann.content}</p>
                  <span className="bl-card-link">Read more →</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="bl-pagination">
            <button
              className="bl-page-btn"
              onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page === 1}
            >
              ← Prev
            </button>

            <div className="bl-page-pills">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  className={`bl-page-pill${n === page ? ' bl-page-pill-active' : ''}`}
                  onClick={() => { setPage(n); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                >
                  {n}
                </button>
              ))}
            </div>

            <button
              className="bl-page-btn"
              onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page === totalPages}
            >
              Next →
            </button>
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
