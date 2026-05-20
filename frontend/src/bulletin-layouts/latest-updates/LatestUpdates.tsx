import "./latestupdates.css";
import Typography from "../../components/typography/Typography";
import { useOutletContext } from "react-router-dom";
import { useState } from "react";
import Modal from "../../components/modal/Modal";
import type {
  Announcement,
  OutletContext,
} from "../../root-layout/Root-layout";

const LatestUpdates = () => {
  const { bulletin } = useOutletContext<OutletContext>();
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);
  const [open, setOpen] = useState(false);

  if (!bulletin.length) {
    return null;
  }

  const latest = [...bulletin]
    .sort(
      (a, b) =>
        new Date(b.created_at ?? b.date).getTime() -
        new Date(a.created_at ?? a.date).getTime(),
    )
    .slice(0, 3);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleItemClick = (ann: Announcement) => {
    setSelectedAnnouncement(ann);
    setOpen(true);
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
            {latest.map((ann) => (
              <div
                key={ann.id}
                className="content-cards"
                style={{ cursor: "pointer" }}
                onClick={() => handleItemClick(ann)}
              >
                {/* Left: Title */}
                <div className="card-left">
                  <h3 className="card-title">{ann.title}</h3>
                </div>

                {/* Center: Date */}
                <div className="card-center">
                  <span className="card-date">
                    {ann.date ? formatDate(ann.date) : "N/A"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {open && selectedAnnouncement && (
        <Modal
          isOpen={open}
          setOpen={setOpen}
          imageSrc={selectedAnnouncement.imgUrl}
          imageAlt={selectedAnnouncement.title}
          date={formatDate(selectedAnnouncement.date) || "Not Available"}
          title={selectedAnnouncement.title}
          description={selectedAnnouncement.content}
        />
      )}
    </div>
  );
};

export default LatestUpdates;
