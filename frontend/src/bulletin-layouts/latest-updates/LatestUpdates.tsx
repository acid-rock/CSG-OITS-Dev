// LatestUpdates.tsx
import "./latestupdates.css";
import Typography from "../../components/typography/Typography";
import DocumentModal from "../../components/document-modal/DocumentModal";
import { useState } from "react";
import type { OutletContext, Document } from "../../root-layout/Root-layout";
import { useOutletContext } from "react-router-dom";

const LatestUpdates = () => {
  const { documents } = useOutletContext<OutletContext>();
  const [open, setOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document>(
    documents[0],
  );

  const latest = [...documents]
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, 3);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleOpenModal = (doc: Document) => {
    setOpen((prev) => !prev);
    setSelectedDocument(doc);
  };

  return (
    <div className="latest-container">
      <div className="latest-layout">
        <div className="latest-content">
          <div className="content-text">
            <Typography color="text-dark" size="text-xl">
              Latest Updates
            </Typography>
            <Typography
              color="text-dark"
              size="text-s"
              style={{ fontWeight: "normal" }}
            >
              Stay informed with the most recent documents and announcements
              from the Central Student Government of CvSU-Imus Campus.
            </Typography>
          </div>
          <div className="content-cards-container">
            {latest.map((doc) => (
              <div key={doc.id} className="content-cards">
                {/* Left: Title and Category */}
                <div className="card-left">
                  <h3 className="card-title">{doc.description}</h3>
                  <div className="card-category">
                    <a href="/bulletin">{doc.category}</a>
                  </div>
                </div>

                {/* Center: Date */}
                <div className="card-center">
                  <span className="card-date">
                    {doc.date ? formatDate(doc.date) : "N/A"}
                  </span>
                </div>

                {/* Right: View Button */}
                <div className="card-right">
                  <button
                    className="card-view-btn"
                    onClick={() => handleOpenModal(doc)}
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {open && (
        <DocumentModal
          selected={{
            title: selectedDocument.name,
            date: selectedDocument.date ?? "",
            memoSrc: selectedDocument.url ?? "",
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
};

export default LatestUpdates;
