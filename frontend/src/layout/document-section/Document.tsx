import DocumentCard from "../../components/document-card/Document-card";
import Typography from "../../components/typography/Typography";
import "./document.css";
import Button from "../../components/button/Button";
import { Link, useOutletContext } from "react-router-dom";
import { useState } from "react";
import DocumentModal from "../../components/document-modal/DocumentModal.tsx";
import type { OutletContext } from "../../root-layout/Root-layout.tsx";
import type { Document } from "../../root-layout/Root-layout.tsx";

export default function Document() {
  const { documents } = useOutletContext<OutletContext>();
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleView = (doc: Document) => {
    setSelectedDoc(doc);
    setIsModalOpen(true);
  };

  const scroll = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="document-container">
      <div className="document-layout">
        <div className="document-texts">
          <Typography size="text-lg" color="text-dark">
            Comprehensive Document Library
          </Typography>
          <Typography size="text-sm" color="text-dark">
            Explore our comprehensive library of official documents, memos, and
            reports.
          </Typography>
        </div>

        <div className="document-grid">
          {documents.slice(0, 4).map((docu) => (
            <DocumentCard
              key={docu.id}
              id={docu.id}
              category={docu.category}
              title={docu.description}
              description={docu.description}
              term={"" /* TODO: Add term */}
              date={docu.date}
              variant="default"
              onSelect={() => {}}
              onView={() => handleView(docu)}
            />
          ))}
        </div>

        <div className="view-btn">
          <Button variant="primary">
            <Link
              to="/bulletin"
              style={{ textDecoration: "none", color: "white" }}
              onClick={scroll}
            >
              VIEW ALL
            </Link>
          </Button>
        </div>
      </div>

      {isModalOpen && selectedDoc && (
        <DocumentModal
          selected={{
            title: selectedDoc.name,
            date: selectedDoc.date ?? "",
            memoSrc: selectedDoc.url ?? "",
          }}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedDoc(null);
          }}
        />
      )}
    </div>
  );
}
