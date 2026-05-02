import { useEffect, useState } from "react";
import DocumentCard from "../../components/document-card/Document-card";
import "./bulletinDocument.css";
import Typography from "../../components/typography/Typography";
import DocumentModal from "../../components/document-modal/DocumentModal.tsx";
import fetchDocuments from "../../config/documentsConfig.ts";
import type { Document } from "../../root-layout/Root-layout.tsx";

export default function BulletinDocument() {
<<<<<<< HEAD
  const { documents } = useOutletContext<OutletContext>();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTerm, setSelectedTerm] = useState("all");
=======
>>>>>>> 8b22842f790adc5614b6daf60635130b967e3062
  const [searchQuery, setSearchQuery] = useState("");
  const [documents, setDocuments] = useState<Document[]>();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDocument, setSelectedDocument] = useState<Document>();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetchDocuments();

      if (!res) {
        console.log("failed to fetch documents");
        return;
      }

      setDocuments(res);
    };

    fetchData();
  }, []);

  const uniqueCategories = Array.from(
    new Set(documents?.map((doc: Document) => doc.category)),
  );

  const categories = [
    { id: "all", label: "All Documents" },
    ...uniqueCategories.map((cat) => ({ id: cat, label: cat })),
  ];

<<<<<<< HEAD
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
=======
  const filteredDocuments = documents?.filter((doc) => {
    const matchCategory =
      selectedCategory === "all" || selectedCategory === doc.category;
    const matchSearch = doc.description
      ?.toLocaleLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchSearch && matchCategory;
  });
>>>>>>> 8b22842f790adc5614b6daf60635130b967e3062

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

      {/* Search Bar */}
      <div className="bulletin-document-search-wrapper">
        <input
          className="bulletin-document-search-input"
          type="text"
          placeholder="Search documents…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="bulletin-document-layout-wrapper">
        <div className="bulletin-document-layout">
          {/* Sidebar Navigation */}
          <aside className="bulletin-document-navigation">
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
<<<<<<< HEAD
            {filteredDocuments.length === 0 ? (
              <p
                style={{
                  textAlign: "center",
                  color: "#6b7280",
                  padding: "2rem 0",
                  fontSize: "0.95rem",
                }}
              >
                No documents found.
              </p>
            ) : (
              <div className="bulletin-document-grid">
                {filteredDocuments.map((doc) => (
                  <div key={doc.id} style={{ position: "relative" }}>
                    {doc.term && (
                      <span style={{
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
                      }}>
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
=======
            <div className="bulletin-document-grid">
              {filteredDocuments?.length === 0 ? (
                <div className="bulletin-document-empty">
                  <p className="bulletin-document-empty-title">
                    No documents found
                  </p>
                  <p className="bulletin-document-empty-sub">
                    Try a different search term or category.
                  </p>
                </div>
              ) : (
                filteredDocuments?.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    id={doc.id}
                    title={doc.description}
                    description={doc.description}
                    date={doc.date}
                    term={"" /* Add term */}
                    onSelect={() => handleSelect(doc)}
                    onView={() => handleView(doc)}
                  />
                ))
              )}
            </div>
>>>>>>> 8b22842f790adc5614b6daf60635130b967e3062
          </main>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && selectedDocument && (
        <DocumentModal
          selected={{
            title: selectedDocument.name,
            date: selectedDocument?.date ?? "",
            memoSrc: selectedDocument?.url ?? "",
          }}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </section>
  );
}
