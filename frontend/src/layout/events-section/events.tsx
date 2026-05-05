import { useState } from "react";
import Card from "../../components/event-card/Card";
import Typography from "../../components/typography/Typography";
import "./event.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Modal from "../../components/modal/Modal";
import { useOutletContext } from "react-router-dom";
import type { OutletContext } from "../../root-layout/Root-layout";

const EVENTS_PER_PAGE = 4;

export default function Events() {
  const { events } = useOutletContext<OutletContext>();
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [open, setOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const totalPages = Math.ceil(events.length / EVENTS_PER_PAGE);
  const currentPageEvents = events.slice(
    currentPage * EVENTS_PER_PAGE,
    currentPage * EVENTS_PER_PAGE + EVENTS_PER_PAGE,
  );

  const nextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
  };

  const prevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 0));
  };

  const handleCardClick = (event: any) => {
    setSelectedEvent(event);
    setOpen(true);
  };

  return (
    <>
      <div className="event-container">
        <div className="event-layout">
          <div className="event-texts">
            <Typography size="text-lg" color="text-dark">
              Events
            </Typography>
            <Typography size="text-sm" color="text-ghost">
              Explore official events from students government
            </Typography>
          </div>

          {/* 4-cards-per-page flex row */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "1rem",
              alignItems: "stretch",
            }}
          >
            {currentPageEvents.map((event) => (
              <div
                key={event.id}
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                }}
                onClick={() => handleCardClick(event)}
              >
                <Card
                  title={event.name}
                  description={event.description}
                  image={event.images[0]}
                  date={event.date}
                  variant="default"
                  style={{ flex: 1 }}
                />
              </div>
            ))}
          </div>

          <div className="carousel-controls">
            <button
              className="event-button"
              type="button"
              onClick={prevPage}
              aria-label="Previous page"
              title="Previous page"
              disabled={currentPage === 0}
            >
              <ChevronLeft size={30} />
            </button>
            <button
              className="event-button"
              type="button"
              onClick={nextPage}
              aria-label="Next page"
              title="Next page"
              disabled={currentPage >= totalPages - 1}
            >
              <ChevronRight size={30} />
            </button>
          </div>

          <div className="dot-indicators">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Go to page ${index + 1}`}
                className={`dot ${index === currentPage ? "active" : ""}`}
                onClick={() => setCurrentPage(index)}
              />
            ))}
          </div>
        </div>
      </div>

      {open && selectedEvent && (
        <Modal
          type="event"
          isOpen={open}
          setOpen={setOpen}
          imageSrc={selectedEvent.images[0]}
          imageAlt={selectedEvent.name}
          date={selectedEvent.date}
          title={selectedEvent.name}
          description={selectedEvent.description}
          extraImage={selectedEvent.images}
        />
      )}
    </>
  );
}
