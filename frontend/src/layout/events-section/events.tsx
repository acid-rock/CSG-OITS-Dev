import { useState } from "react";
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

  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 0));

  const handleCardClick = (event: any) => {
    setSelectedEvent(event);
    setOpen(true);
  };

  const featured = currentPageEvents[0] ?? null;
  const sidebar  = currentPageEvents.slice(1);

  return (
    <>
      <div className="event-container">
        <div className="event-layout">

          {/* Section header */}
          <div className="event-texts">
            <h2 className="ev-heading">
              Upcoming <em className="italic-accent">events</em>
            </h2>
            <p className="ev-sub">Explore official events from the student government.</p>
          </div>

          {/* Two-column layout: featured + sidebar */}
          <div className="ev-two-col">

            {/* FEATURED card */}
            {featured && (
              <div
                className="ev-featured card"
                onClick={() => handleCardClick(featured)}
              >
                {/* Image — Fix 2: always render image area with placeholder */}
                <div className="ev-feat-img">
                  {featured.images?.[0] ? (
                    <img
                      src={featured.images[0]}
                      alt={featured.name}
                      className="ev-feat-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="ev-feat-placeholder" />
                  )}
                  <span className="tag tag-featured ev-feat-badge">Featured</span>
                  {/* Fix 3B applied here: NO date overlay badge */}
                </div>
                {/* Card body */}
                <div className="ev-feat-body">
                  <p className="ev-feat-date">&bull;&nbsp;{featured.date}</p>
                  <h3 className="ev-feat-title">{featured.name}</h3>
                  <p className="ev-feat-desc">{featured.description}</p>
                </div>
              </div>
            )}

            {/* SIDEBAR list — with thumbnail image */}
            {sidebar.length > 0 && (
              <div className="ev-sidebar">
                {sidebar.map((event) => (
                  <div
                    key={event.id}
                    className="ev-side-card card"
                    onClick={() => handleCardClick(event)}
                  >
                    {/* Thumbnail */}
                    <div className="ev-side-img">
                      {event.images?.[0] ? (
                        <img
                          src={event.images[0]}
                          alt={event.name}
                          className="ev-side-thumb"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <img src="/CSG_logo.svg" alt="CSG" className="ev-side-logo" />
                      )}
                    </div>
                    {/* Text */}
                    <div className="ev-side-text">
                      <p className="ev-side-date">&bull;&nbsp;{event.date}</p>
                      <h3 className="ev-side-title">{event.name}</h3>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fix 5: ALL pagination in ONE flex container */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--space-4)",
            marginTop: "var(--space-8)",
          }}>
            <button
              className="event-button"
              type="button"
              onClick={prevPage}
              disabled={currentPage === 0}
              aria-label="Previous page"
            >
              <ChevronLeft size={20} />
            </button>

            <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
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
