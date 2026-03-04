import { useEffect, useState } from "react";
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
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (documents.length > 0 && !selectedDocument) {
      setSelectedDocument(documents[0]);
    }
  }, [documents]);

  // Derive unique categories directly from the documents array
  const uniqueCategories = Array.from(
    new Set(documents.map((doc) => doc.category)),
  );

  const categories = [
    { id: "all", label: "All Documents" },
    ...uniqueCategories.map((cat) => ({ id: cat, label: cat })),
  ];

  // Filter documents by selected category
  const filteredDocuments =
    selectedCategory === "all"
      ? documents
      : documents.filter((doc) => doc.category === selectedCategory);

  // Clicking a card updates the preview panel
  const handleSelect = (doc: Document) => {
    setSelectedDocument(doc);
  };

  // Clicking "View" opens the modal
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
          Explore official documents from student government
        </Typography>
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
              {filteredDocuments.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  id={doc.id}
                  title={doc.description}
                  description={doc.category}
                  date={doc.date}
                  onSelect={() => handleSelect(doc)}
                  onView={() => handleView(doc)}
                />
              ))}
            </div>
          </main>
        </div>

        {/* Always Visible Document Preview Panel */}
        <aside className="bulletin-preview-panel">
          <div className="bulletin-preview-content">
            <div className="bulletin-preview-body">
              {selectedDocument?.date && (
                <p className="bulletin-preview-date">
                  {selectedDocument?.date}
                </p>
              )}
              <h2 className="bulletin-preview-title">
                {selectedDocument?.description}
              </h2>
              <p className="bulletin-preview-description">
                {selectedDocument?.category}
              </p>
            </div>
          </div>
        </aside>
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
