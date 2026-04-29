import { useEffect, useState } from "react";
import Typography from "../../components/typography/Typography";
import AnnouncementCard from "../../components/announcement-card/Announcement-card";
import "./announcement.css";
import Modal from "../../components/modal/Modal";
import Button from "../../components/button/Button";
import { Link, useOutletContext } from "react-router-dom";
import type {
  Announcement,
  OutletContext,
} from "../../root-layout/Root-layout";
import { DateTime } from "luxon";

export default function Announcement() {
  const { bulletin } = useOutletContext<OutletContext>();
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);
  const [open, setOpen] = useState(false);

  const formatDate = (date: string) => {
    return DateTime.fromISO(date).toLocaleString();
  };

  const handleCardClick = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setOpen(true);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        if (prev + 1 >= bulletin.length) {
          return 0;
        }
        return prev + 1;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const scroll = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const currentAnnouncement = bulletin[currentSlide];
  return (
    <section className="announcement-container">
      <div className="announcement-layout">
        <div className="announcement-texts">
          <Typography size="text-lg" color="text-dark">
            Announcements
          </Typography>
          <Typography size="text-sm" color="text-dark">
            Explore official records from student government proceedings
          </Typography>
        </div>

        {/* Slideshow */}
        <div className="announcement-content">
          {currentAnnouncement && (
            <AnnouncementCard
              title={currentAnnouncement.title}
              description={currentAnnouncement.content}
              date={formatDate(currentAnnouncement.date) || "Not Available"}
              image={currentAnnouncement.imgUrl}
              variant="default"
              onClick={() => handleCardClick(currentAnnouncement)}
            />
          )}
        </div>

        <div className="view-btn">
          <Button variant="primary">
            <Link
              to="/announcement"
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
        ></Modal>
      )}
    </section>
  );
}
