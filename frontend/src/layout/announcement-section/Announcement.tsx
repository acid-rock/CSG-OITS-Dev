import { useState } from "react";
import "./announcement.css";
import Modal from "../../components/modal/Modal";
import Button from "../../components/button/Button";
import { Link, useOutletContext } from "react-router-dom";
import type {
  Announcement,
  OutletContext,
} from "../../root-layout/Root-layout";

function getTagClass(type?: string) {
  if (!type) return "tag-notice";
  const t = type.toLowerCase();
  if (t.includes("event")) return "tag-event";
  if (t.includes("update")) return "tag-update";
  return "tag-notice";
}
function getTagLabel(type?: string) {
  if (!type) return "Notice";
  const t = type.toLowerCase();
  if (t.includes("event")) return "Event";
  if (t.includes("update")) return "Update";
  return "Notice";
}

export default function AnnouncementSection() {
  const { bulletin } = useOutletContext<OutletContext>();
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);
  const [open, setOpen] = useState(false);

  const formatDate = (date: string): string => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleCardClick = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setOpen(true);
  };

  const scroll = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pinned = bulletin.find((a) => a.is_pinned);
  const cards = bulletin.filter((a) => !a.is_pinned).slice(0, 3);

  return (
    <section className="announcement-container" id="announcement">
      <div className="announcement-layout">
        {/* Section header */}
        <div className="section-head">
          <div className="kicker">From the council</div>
          <h2>
            Latest <em className="italic-accent">announcements</em>
          </h2>
          <p>Notices, advisories, and updates from your CSG officers.</p>
        </div>

        {/* Pinned announcement — compact strip tab */}
        {pinned && (
          <div
            className="ann-pinned-tab"
            onClick={() => handleCardClick(pinned)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleCardClick(pinned)}
          >
            <span className="pinned-badge">📌 Pinned</span>
            <span className="ann-pinned-tab-title">{pinned.title}</span>
            <span className="ann-pinned-tab-meta">{formatDate(pinned.date)}</span>
            <span className="ann-pinned-tab-cta">Read more →</span>
          </div>
        )}

        {/* 3-card grid — same visual style as dedicated /announcements page */}
        {cards.length > 0 && (
          <div className="ann-home-grid">
            {cards.map((ann) => (
              <div
                key={ann.id}
                className="ann-home-card card"
                onClick={() => handleCardClick(ann)}
              >
                {/* Image area */}
                <div className="ann-card-img-wrap">
                  {ann.imgUrl && (
                    <img
                      src={ann.imgUrl}
                      alt={ann.title}
                      className="ann-card-img"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display =
                          "none";
                      }}
                    />
                  )}
                  <span
                    className={`tag ${getTagClass((ann as any).type)} ann-card-tag`}
                  >
                    {getTagLabel((ann as any).type)}
                  </span>
                </div>

                {/* Card body */}
                <div className="ann-card-body">
                  <p className="ann-card-meta">{formatDate(ann.date)}</p>
                  <h3 className="ann-card-title">{ann.title}</h3>
                  <p className="ann-card-desc">{ann.content}</p>
                  <span className="ann-card-link">Read more →</span>
                </div>
              </div>
            ))}
          </div>
        )}

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

      {open && selectedAnnouncement && (
        <Modal
          isOpen={open}
          setOpen={setOpen}
          imageSrc={selectedAnnouncement.imgUrl}
          imageAlt={"Image goes here..."}
          date={formatDate(selectedAnnouncement.date) || "Not Available"}
          title={selectedAnnouncement.title}
          description={selectedAnnouncement.content}
        />
      )}
    </section>
  );
}
