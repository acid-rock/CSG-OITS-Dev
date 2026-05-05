import { useEffect, useState } from "react";
import AnnouncementCard from "../../components/announcement-card/Announcement-card";
import "./announcement.css";
import Modal from "../../components/modal/Modal";
import Button from "../../components/button/Button";
import { Link, useOutletContext } from "react-router-dom";
import type {
  Announcement,
  OutletContext,
} from "../../root-layout/Root-layout";

export default function AnnouncementSection() {
  const { bulletin } = useOutletContext<OutletContext>();
  const [currentSlide, setCurrentSlide] = useState<number>(0);
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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        if (prev + 1 >= bulletin.length) return 0;
        return prev + 1;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const scroll = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pinned = bulletin.find((a) => a.is_pinned);
  const currentAnnouncement = bulletin[currentSlide];

  return (
    <section className="announcement-container" id="announcement">
      <div className="announcement-layout">
        {/* Section header */}
        <div className="section-head">
          <div className="kicker">From the council</div>
          <h2>Latest <em>announcements</em></h2>
          <p>Notices, advisories, and updates from your CSG officers.</p>
        </div>

        {/* Pinned strip */}
        {pinned && (
          <button
            type="button"
            className="pinned-strip"
            onClick={() => handleCardClick(pinned)}
          >
            <span className="pinned-badge">📌 Pinned</span>
            <span className="pinned-title">{pinned.title}</span>
            <span className="pinned-date">{formatDate(pinned.date)}</span>
            <span className="pinned-arrow">→</span>
          </button>
        )}

        {/* Slideshow card */}
        <div className="announcement-content">
          {currentAnnouncement && (
            <AnnouncementCard
              title={currentAnnouncement.title}
              description={currentAnnouncement.content}
              date={formatDate(currentAnnouncement.date) || "Not Available"}
              image={currentAnnouncement.imgUrl}
              variant="default"
              style={{ cursor: "pointer" }}
              onClick={() => handleCardClick(currentAnnouncement)}
            />
          )}
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
