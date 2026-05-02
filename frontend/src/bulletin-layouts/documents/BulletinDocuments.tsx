import { useState } from "react";
import DocumentCard from "../../components/document-card/Document-card";
import "./bulletinDocument.css";
import Typography from "../../components/typography/Typography";
import DocumentModal from "../../components/document-modal/DocumentModal.tsx";
import type {
  Document,
  OutletContext,
} from "../../root-layout/Root-layout.tsx";
import { useOutletContext } from "react-router-dom";

export default function BulletinDocument() {
  const { documents } = useOutletContext<OutletContext>();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTerm, setSelectedTerm] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  // selectedDocument remains null until the user explicitly clicks "View" on a document

  // Derive unique categories directly from the documents array
  const uniqueCategories = Array.from(
    new Set(documents.map((doc) => doc.category)),
  );

  const categories = [
    { id: "all", label: "All Documents" },
    ...uniqueCategories.map((cat) => ({ id: cat, label: cat })),
  ];

  // Derive unique terms for the term filter
  const uniqueTerms = Array.from(
    new Set(documents.map((doc) => doc.term).filter(Boolean) as string[]),
  ).sort();

  // Apply category + term + search filters — all must match
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

  const handleSelect = (doc: Document) => {
    setSelectedDocument(doc);
  };

  const handleView = (doc: Document) => {
    setSelectedDocument(doc);
    setIsModalOpen(true);
  };

  return (
    <section id="documents" className="bulletin-document-container">
      <div className="bulletin-document-header">
        <Typography size="text-md" color="text-dark">
          Documents
        </Typography>
        <Typography size="text-sm" color="text-ghost">
          Access official records, resolutions, and proceedings of the Central
          Student Government.
        </Typography>
      </div>

      <div className="bulletin-document-layout-wrapper">
        <div className="bulletin-document-layout">
          {/* Sidebar Navigation */}
          <aside className="bulletin-document-navigation">
            {/* Search bar */}
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "0.45rem 0.75rem",
                marginBottom: "0.75rem",
                fontSize: "0.875rem",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                boxSizing: "border-box",
                outline: "none",
              }}
            />

            <Typography size="text-sm" color="text-dark">
              Categories
            </Typography>
            <nav className="bulletin-nav-menu">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={`bulletin-nav-item ${
                    selectedCategory === category.id ? "active" : ""
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.label}
                </button>
              ))}
            </nav>

            {uniqueTerms.length > 0 && (
              <>
                <Typography size="text-sm" color="text-dark" style={{ marginTop: "1rem" }}>
                  Term
                </Typography>
                <nav className="bulletin-nav-menu">
                  <button
                    type="button"
                    className={`bulletin-nav-item ${selectedTerm === "all" ? "active" : ""}`}
                    onClick={() => setSelectedTerm("all")}
                  >
                    All Terms
                  </button>
                  {uniqueTerms.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`bulletin-nav-item ${selectedTerm === t ? "active" : ""}`}
                      onClick={() => setSelectedTerm(t)}
                    >
                      {t}
                    </button>
                  ))}
                </nav>
              </>
            )}
          </aside>

          {/* Document Grid */}
          <main className="bulletin-document-content">
            {filteredDocuments.length === 0 ? (
              <div className="bulletin-document-empty">
                <p className="bulletin-document-empty-title">
                  No documents found
                </p>
                <p className="bulletin-document-empty-sub">
                  Try a different search term or category.
                </p>
              </div>
            ) : (
              <div className="bulletin-document-grid">
                {filteredDocuments.map((doc) => (
                  <div key={doc.id} style={{ position: "relative" }}>
                    {doc.term && (
                      <span
                        style={{
                          position: "absolute",
                          top: "0.4rem",
                          right: "0.4rem",
                          fontSize: "0.65rem",
                          background: "#eff6ff",
                          color: "#3b82f6",
                          border: "1px solid #bfdbfe",
                          borderRadius: "4px",
                          padding: "0.1rem 0.35rem",
                          zIndex: 1,
                        }}
                      >
                        {doc.term}
                      </span>
                    )}
                    <DocumentCard
                      id={doc.id}
                      title={doc.description}
                      description={doc.category}
                      date={doc.date}
                      onSelect={() => handleSelect(doc)}
                      onView={() => handleView(doc)}
                    />
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>

        {/* Document Preview Panel — only shown after user selects a document */}
        {selectedDocument && (
          <aside className="bulletin-preview-panel">
            <div className="bulletin-preview-content">
              <div className="bulletin-preview-body">
                {selectedDocument.date && (
                  <p className="bulletin-preview-date">
                    {selectedDocument.date}
                  </p>
                )}
                <h2 className="bulletin-preview-title">
                  {selectedDocument.description}
                </h2>
                <p className="bulletin-preview-description">
                  {selectedDocument.category}
                </p>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Modal for document preview */}
      {isModalOpen && (
        <DocumentModal
          selected={{
            title: selectedDocument?.name ?? "",
            date: selectedDocument?.date ?? "",
            memoSrc: selectedDocument?.url ?? "",
          }}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </section>
  );
}
