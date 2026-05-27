import { useState, useEffect } from "react";
import "./bulletinDocument.css";

const PAGE_SIZE = 12;

function getPageRange(current: number, total: number): (number | '...')[] {
  if (total <= 3) return Array.from({ length: total }, (_, i) => i + 1);
  const delta = 1;
  const core = new Set<number>([1, total]);
  for (let i = current - delta; i <= current + delta; i++) {
    if (i >= 1 && i <= total) core.add(i);
  }
  const sorted = [...core].sort((a, b) => a - b);
  const result: (number | '...')[] = [];
  let prev = 0;
  for (const n of sorted) {
    if (n - prev === 2) result.push(prev + 1);
    else if (n - prev > 2) result.push('...');
    result.push(n);
    prev = n;
  }
  return result;
}
import DocumentModal from "../../components/document-modal/DocumentModal.tsx";
import type {
  Document,
  OutletContext,
} from "../../root-layout/Root-layout.tsx";
import { useOutletContext } from "react-router-dom";

/* Fix 7: letter helper removed — CSG logo used instead */

/* ── Helper: map category to a tag colour class ── */
function getDocTagClass(doc: Document): string {
  const cat = (doc.category || "").toLowerCase();
  if (cat.includes("event") || cat.includes("bulletin")) return "tag-event";
  if (cat.includes("memo") || cat.includes("update")) return "tag-update";
  return "tag-notice";
}

export default function BulletinDocument() {
  /* ══════════════════════════════════════════════════
     LOCKED DATA BINDINGS — do not modify
     ══════════════════════════════════════════════════ */
  const { documents } = useOutletContext<OutletContext>();

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTerm, setSelectedTerm] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);

  /* Derived category list — locked logic */
  const uniqueCategories = Array.from(
    new Set(documents.map((doc) => doc.category)),
  );
  const categories = [
    { id: "all", label: "All Documents" },
    ...uniqueCategories.map((cat) => ({ id: cat, label: cat })),
  ];

  /* Derived term list — locked logic */
  const uniqueTerms = Array.from(
    new Set(documents.map((doc) => doc.term).filter(Boolean) as string[]),
  ).sort();

  /* Filtered documents — locked logic */
  const filteredDocuments = documents
    .filter((doc) =>
      selectedCategory === "all" ? true : doc.category === selectedCategory,
    )
    .filter((doc) =>
      selectedTerm === "all" ? true : doc.term === selectedTerm,
    )
    .filter((doc) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        doc.name.toLowerCase().includes(q) ||
        doc.description.toLowerCase().includes(q)
      );
    });

  /* Locked handlers */
  const handleSelect = (doc: Document) => {
    setSelectedDocument(doc);
  };

  const handleView = (doc: Document) => {
    setSelectedDocument(doc);
    setIsModalOpen(true);
  };

  // Reset to page 1 and close side panel whenever filters change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setPage(1); setSelectedDocument(null); }, [selectedCategory, selectedTerm, searchQuery]);

  const totalPages      = Math.max(1, Math.ceil(filteredDocuments.length / PAGE_SIZE));
  const paginatedDocuments = filteredDocuments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ── Category count helper (new — no binding change) ── */
  const catCount = (catId: string) =>
    catId === "all"
      ? documents.length
      : documents.filter((d) => d.category === catId).length;

  return (
    <section id="documents" className="bd-page">
      {/* ════════════════════════════════════════
          PAGE HEADER (centered, white bg)
          ════════════════════════════════════════ */}
      <header className="bd-header">
        <span className="section-label bd-kicker">Public Archive</span>
        <h1 className="bd-heading">
          <em className="italic-accent">Documents</em> &amp; filings
        </h1>
        <p className="bd-subheading">
          Resolutions, memoranda, and reports filed by the CSG and its
          committees.
        </p>
      </header>

      {/* ════════════════════════════════════════
          TWO-COLUMN LAYOUT
          ════════════════════════════════════════ */}
      <div className="bd-layout">
        {/* ── LEFT SIDEBAR ── */}
        <aside className="bd-sidebar">
          {/* Search — preserves searchQuery state */}
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bd-search"
          />

          {/* Categories — preserves selectedCategory + setSelectedCategory */}
          <span className="section-label bd-cat-label">Categories</span>
          <ul className="bd-cat-list">
            {categories.map((cat) => (
              <li key={cat.id}>
                <button
                  type="button"
                  className={`bd-cat-item${selectedCategory === cat.id ? " bd-cat-active" : ""}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <span className="bd-cat-name">{cat.label}</span>
                  <span className="bd-cat-count">{catCount(cat.id)}</span>
                </button>
              </li>
            ))}
          </ul>

          {/* Terms — preserves selectedTerm + setSelectedTerm */}
          {uniqueTerms.length > 0 && (
            <>
              <span className="section-label bd-cat-label">Term</span>
              <ul className="bd-cat-list">
                <li>
                  <button
                    type="button"
                    className={`bd-cat-item${selectedTerm === "all" ? " bd-cat-active" : ""}`}
                    onClick={() => setSelectedTerm("all")}
                  >
                    <span className="bd-cat-name">All Terms</span>
                  </button>
                </li>
                {uniqueTerms.map((t) => (
                  <li key={t}>
                    <button
                      type="button"
                      className={`bd-cat-item${selectedTerm === t ? " bd-cat-active" : ""}`}
                      onClick={() => setSelectedTerm(t)}
                    >
                      <span className="bd-cat-name">{t}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </aside>

        {/* ── RIGHT DOCUMENT GRID ── */}
        <main className="bd-grid-area">
          {filteredDocuments.length === 0 ? (
            <div className="bd-empty">
              <p className="bd-empty-title">No documents found</p>
              <p className="bd-empty-sub">
                Try a different search term or category.
              </p>
            </div>
          ) : (
            <>
            <div className="bd-grid">
              {paginatedDocuments.map((doc) => {
                const tagClass = getDocTagClass(doc);
                return (
                  <div
                    key={doc.id}
                    className="bd-doc-card card"
                    onClick={() => handleSelect(doc)} /* locked: handleSelect */
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "160px",
                        background: "var(--color-primary-light)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <span className={`tag ${tagClass} bd-doc-type-tag`}>
                        {doc.category ?? "Document"}
                      </span>
                      {doc.thumbnail ? (
                        <img
                          src={doc.thumbnail}
                          alt={doc.description}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            objectPosition: "top",
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            (
                              e.currentTarget
                                .nextElementSibling as HTMLElement | null
                            )?.style?.setProperty("display", "flex");
                          }}
                        />
                      ) : null}
                      <img
                        src="/CSG_logo.svg"
                        alt="CSG"
                        style={{
                          width: "72px",
                          height: "72px",
                          objectFit: "contain",
                          opacity: 0.7,
                          display: doc.thumbnail ? "none" : "block",
                          position: "absolute",
                        }}
                      />
                    </div>

                    {/* Card body */}
                    <div className="bd-doc-body">
                      <span className="bd-doc-cat">{doc.category}</span>

                      {/* Title — locked: file_path / description binding */}
                      <h3 className="bd-doc-title">{doc.description}</h3>

                      {/* Meta row — locked: created_at / term binding */}
                      <div className="bd-doc-meta">
                        <span>{doc.date}</span>
                        {doc.term && <span>{doc.term}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="bd-pagination">
                <button
                  className="bd-page-btn"
                  onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={page === 1}
                >
                  ← Prev
                </button>

                <div className="bd-page-pills">
                  {getPageRange(page, totalPages).map((n, i) =>
                    n === '...'
                      ? <span key={`ellipsis-${i}`} className="bd-page-ellipsis">…</span>
                      : <button
                          key={n}
                          className={`bd-page-pill${n === page ? ' bd-page-pill-active' : ''}`}
                          onClick={() => { setPage(n); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        >
                          {n}
                        </button>
                  )}
                </div>

                <button
                  className="bd-page-btn"
                  onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={page === totalPages}
                >
                  Next →
                </button>
              </div>
            )}
            </>
          )}
        </main>
      </div>

      {/* ════════════════════════════════════════
          SLIDE-IN DETAIL PANEL
          All selectedDocument.* bindings locked
          ════════════════════════════════════════ */}
      {selectedDocument && (
        <>
          <div
            onClick={() => setSelectedDocument(null)}
            className="bd-panel-backdrop"
          />
          <div className="bd-panel">
            <button
              onClick={() => setSelectedDocument(null)}
              className="bd-panel-close"
              aria-label="Close"
            >
              ✕
            </button>

            <span className="bd-panel-cat">
              {selectedDocument.category ?? "Document"}
            </span>

            <h2 className="bd-panel-title">
              {selectedDocument.name
                ?.split("/")
                .pop()
                ?.replace(/\.pdf$/i, "") ??
                selectedDocument.description ??
                "Document"}
            </h2>

            {selectedDocument.description && (
              <p className="bd-panel-desc">{selectedDocument.description}</p>
            )}

            {selectedDocument.date && (
              <p className="bd-panel-date">{selectedDocument.date}</p>
            )}

            {/* Document thumbnail preview */}
            {selectedDocument.thumbnail && (
              <img
                src={selectedDocument.thumbnail}
                alt={selectedDocument.description}
                className="bd-panel-preview"
              />
            )}

            <button
              type="button"
              className="btn btn-primary bd-panel-view-btn"
              onClick={() => handleView(selectedDocument)}
            >
              View Document
            </button>
          </div>
        </>
      )}

      {isModalOpen && selectedDocument && (
        <DocumentModal
          selected={{
            title: selectedDocument.name ?? "",
            date: selectedDocument.date ?? "",
            memoSrc: selectedDocument.url ?? "",
          }}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </section>
  );
}
