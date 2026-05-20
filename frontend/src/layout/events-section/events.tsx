import { useState } from "react";
import "./event.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Modal from "../../components/modal/Modal";
import { useOutletContext } from "react-router-dom";
import type { OutletContext } from "../../root-layout/Root-layout";
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";

const EVENTS_PER_PAGE = 2;

export default function Events() {
  const { events } = useOutletContext<OutletContext>();
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [open, setOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  useLockBodyScroll(open);

  const totalPages = Math.ceil(events.length / EVENTS_PER_PAGE);
  const currentPageEvents = events.slice(
    currentPage * EVENTS_PER_PAGE,
    currentPage * EVENTS_PER_PAGE + EVENTS_PER_PAGE,
  );

  const nextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 0));

  const handleCardClick = (event: any) => {
    setSelectedEvent(event);
    setOpen(true);
  };

  return (
    <>
      <div className="event-container">
        <div className="event-layout">
          {/* Section header */}
          <div className="event-texts">
            <h2 className="ev-heading">
              Latest <em className="italic-accent">events</em>
            </h2>
            <p className="ev-sub">
              Explore official events from the student government.
            </p>
          </div>

          {/* 2×2 card grid */}
          <div className="ev-grid">
            {currentPageEvents.map((event) => (
              <div
                key={event.id}
                className="ev-grid-card card"
                onClick={() => handleCardClick(event)}
              >
                {/* Cover image */}
                <div className="ev-grid-img">
                  {event.images?.[0] ? (
                    <img
                      key={event.id}
                      src={event.images[0]}
                      alt={event.name}
                      className="ev-grid-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          "/CSG_logo.svg";
                        (e.currentTarget as HTMLImageElement).style.objectFit =
                          "contain";
                        (e.currentTarget as HTMLImageElement).style.opacity =
                          "0.3";
                      }}
                    />
                  ) : (
                    <img
                      src="/CSG_logo.svg"
                      alt="CSG"
                      className="ev-grid-cover"
                      style={{ objectFit: "contain", opacity: 0.3 }}
                    />
                  )}
                </div>
                {/* Card body */}
                <div className="ev-grid-body">
                  <p className="ev-grid-date">&bull;&nbsp;{event.date}</p>
                  <h3 className="ev-grid-title">{event.name}</h3>
                  <p className="ev-grid-desc">{event.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "var(--space-4)",
              marginTop: "var(--space-8)",
            }}
          >
            <button
              className="event-button"
              type="button"
              onClick={prevPage}
              disabled={currentPage === 0}
              aria-label="Previous page"
            >
              <ChevronLeft size={20} />
            </button>

            <div
              style={{
                display: "flex",
                gap: "var(--space-2)",
                alignItems: "center",
              }}
            >
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

            <button
              className="event-button"
              type="button"
              onClick={nextPage}
              disabled={currentPage >= totalPages - 1}
              aria-label="Next page"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {open && selectedEvent && (
        <Modal
          type="event"
          isOpen={open}
          setOpen={setOpen}
          imageSrc={selectedEvent.images?.[0] ?? "/CSG_logo.svg"}
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
