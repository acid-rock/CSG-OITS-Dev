import DocumentCard from "../../components/document-card/Document-card";
import Typography from "../../components/typography/Typography";
import "./document.css";
import Button from "../../components/button/Button";
import { Link, useOutletContext } from "react-router-dom";
import { useState } from "react";
import type {
  OutletContext,
  Document,
} from "../../root-layout/Root-layout.tsx";
import DocumentModal from "../../components/document-modal/DocumentModal.tsx";
import wave from "../../assets/1.svg";

export default function Document() {
  const { documents } = useOutletContext<OutletContext>();
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleView = (doc: Document) => {
    setSelectedDoc(doc);
    setIsModalOpen(true);
  };

  return (
    <div className="document-container">
      <div className="document-wave">
        <img className="wave" src={wave} alt="Wave" />
      </div>
      <div className="document-layout">
        <div className="document-texts">
          <Typography size="text-md" color="text-white">
            Comprehensive Document Library
          </Typography>
          <Typography size="text-sm" color="text-ghost">
            This is where the documents
          </Typography>
        </div>

        <div className="document-grid">
          {documents.slice(0, 4).map((docu) => (
            <DocumentCard
              key={docu.id}
              id={docu.id}
              title={docu.description}
              variant="default"
              onSelect={() => {}} // no preview panel on this page
              onView={() => handleView(docu)}
            />
          ))}
        </div>

        <div className="view-btn">
          <Button variant="primary">
            <Link
              to="/bulletin"
              style={{ textDecoration: "none", color: "white" }}
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
