import { useEffect, useState } from "react";
import DocumentCard from "../../components/document-card/Document-card";
import "./bulletinDocument.css";
import Typography from "../../components/typography/Typography";
import DocumentModal from "../../components/document-modal/DocumentModal.tsx";
import fetchDocuments from "../../config/documentsConfig.ts";
import type { Document } from "../../root-layout/Root-layout.tsx";

export default function BulletinDocument() {
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

  const filteredDocuments = documents?.filter((doc) => {
    const matchCategory =
      selectedCategory === "all" || selectedCategory === doc.category;
    const matchSearch = doc.description
      ?.toLocaleLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchSearch && matchCategory;
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
          </aside>

          {/* Document Grid */}
          <main className="bulletin-document-content">
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
