import { useCallback, useEffect, useState } from "react";
import fetchBulletinData from "../../config/eventsConfig";
import Typography from "../../components/typography/Typography";
import AnnouncementCard from "../../components/announcement-card/Announcement-card";
import "./announcement.css";
import Modal from "../../components/modal/Modal";

type Announcement = {
  id: string;
  imgUrl: string;
  title: string;
  content: string;
  date: string;
};

export default function Announcement() {
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [bulletin, setBulletin] = useState<Announcement[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null); // Add state for selected event
  const [open, setOpen] = useState(false);

  const handleCardClick = (event: any) => {
    setSelectedEvent(event);
    setOpen(true);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchBulletinData();
        setBulletin(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();

    const interval = setInterval(() => {
      fetchData();
      setCurrentSlide((prev) => {
        if (bulletin.length === 0) return 0;
        return (prev + 1) % bulletin.length;
      });
    }, 5000); // Changes slide every 5 seconds

    return () => clearInterval(interval);
  }, [bulletin.length]);

  const currentEvent = bulletin[currentSlide];

  return (
    <section className="announcement-container">
      <div className="announcement-layout">
        <div className="announcement-texts">
          <Typography size="text-md" color="text-dark">
            CSG Bulletin
          </Typography>
          <Typography size="text-sm" color="text-ghost">
            Explore official records from student government proceedings
          </Typography>
        </div>

        {/* Slideshow */}
        <div className="announcement-content">
          {currentEvent && (
            <AnnouncementCard
              title={currentEvent.title}
              description={currentEvent.content}
              date={currentEvent.date}
              image={currentEvent.imgUrl}
              variant="default"
              onClick={() => handleCardClick(currentEvent)}
            />
          )}
        </div>
      </div>

      {open && selectedEvent && (
        <Modal
          isOpen={open}
          setOpen={setOpen}
          imageSrc={selectedEvent.imgUrl}
          imageAlt={selectedEvent.title}
          date={selectedEvent.date}
          title={selectedEvent.title}
          description={selectedEvent.content}
        ></Modal>
      )}
    </section>
  );
}
