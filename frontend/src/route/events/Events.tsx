import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Modal from "../../components/modal/Modal";
import type { OutletContext } from "../../root-layout/Root-layout";
import "./events.css";

const EVENTS_PER_PAGE = 4; /* locked — same as homepage section */

export default function EventsPage() {

  /* ══════════════════════════════════════════════════════
     LOCKED DATA BINDINGS — do not modify
     ══════════════════════════════════════════════════════ */
  const { events } = useOutletContext<OutletContext>();

  const [currentPage,    setCurrentPage]    = useState<number>(0);
  const [open,           setOpen]           = useState(false);
  const [selectedEvent,  setSelectedEvent]  = useState<any>(null);

  const totalPages       = Math.ceil(events.length / EVENTS_PER_PAGE);
  const currentPageEvents = events.slice(
    currentPage * EVENTS_PER_PAGE,
    currentPage * EVENTS_PER_PAGE + EVENTS_PER_PAGE,
  );

  /* Locked pagination handlers */
  const nextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
  const prevPage = () =>
    setCurrentPage((prev) => Math.max(prev - 1, 0));

  /* Locked modal handler */
  const handleCardClick = (event: any) => {
    setSelectedEvent(event);
    setOpen(true);
  };

  /* ── Derived layout data ── */
  const featured      = currentPageEvents[0] ?? null;
  const sidebarEvents = currentPageEvents.slice(1);   /* remaining 3 */

  return (
    <>
      {/* ════════════════════════════════════════
          PAGE HEADER
          ════════════════════════════════════════ */}
      <div className="ep-header">
        <div className="ep-header-inner">
          <span className="section-label ep-kicker">What&rsquo;s happening</span>
          <h1 className="ep-heading">
            Upcoming{" "}
            <em className="italic-accent">events</em>
          </h1>
          <p className="ep-subheading">
            Activities, assemblies, and community drives this term.
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════
          MAIN CONTENT
          ════════════════════════════════════════ */}
      <div className="ep-content">

        {events.length === 0 ? (
          <p className="ep-empty">No events yet.</p>
        ) : (
          <>
            {/* ── Two-column layout ── */}
            <div className="ep-two-col">

              {/* FEATURED card (left, ~60%) */}
              {featured && (
                <div
                  className="ep-featured card"
                  onClick={() => handleCardClick(featured)}   /* locked handler */
                >
                  {/* Image area */}
                  <div className="ep-featured-img">
                    {featured.images?.[0] && (               /* locked: images[0] binding */
                      <img
                        src={featured.images[0]}
                        alt={featured.name}
                        className="ep-featured-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    {/* "FEATURED" tag overlay */}
                    <span className="tag tag-featured ep-feat-tag">Featured</span>
                    {/* Fix 3B: date overlay removed — date shown in card body only */}
                  </div>

                  {/* Card body */}
                  <div className="ep-featured-body">
                    <p className="ep-feat-date-line">
                      &bull;&nbsp;{featured.date}           {/* locked: date binding */}
                    </p>
                    <h2 className="ep-feat-title">
                      {featured.name}                       {/* locked: name binding */}
                    </h2>
                    <p className="ep-feat-desc">
                      {featured.description}                {/* locked: description binding */}
                    </p>
                  </div>
                </div>
              )}

              {/* SIDEBAR list (right, ~38%) — with thumbnail image */}
              {sidebarEvents.length > 0 && (
                <div className="ep-sidebar">
                  {sidebarEvents.map((event) => (
                    <div
                      key={event.id}
                      className="ep-sidebar-card card"
                      onClick={() => handleCardClick(event)}  /* locked handler */
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
                        <p className="ep-sidebar-date">
                          &bull;&nbsp;{event.date}         {/* locked: date binding */}
                        </p>
                        <h3 className="ep-sidebar-title">
                          {event.name}                    {/* locked: name binding */}
                        </h3>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Pagination ── */}
            <div className="ep-pagination">
              {/* Prev arrow — locked handler */}
              <button
                type="button"
                className="ep-arrow"
                onClick={prevPage}
                disabled={currentPage === 0}
                aria-label="Previous page"
              >
                <ChevronLeft size={20} />
              </button>

              {/* Dot indicators — locked: setCurrentPage handler */}
              <div className="ep-dots">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`ep-dot${i === currentPage ? " ep-dot-active" : ""}`}
                    onClick={() => setCurrentPage(i)}
                    aria-label={`Go to page ${i + 1}`}
                  />
                ))}
              </div>

              {/* Next arrow — locked handler */}
              <button
                type="button"
                className="ep-arrow"
                onClick={nextPage}
                disabled={currentPage >= totalPages - 1}
                aria-label="Next page"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* ════════════════════════════════════════
          MODAL — all bindings locked
          ════════════════════════════════════════ */}
      {open && selectedEvent && (
        <Modal
          type="event"
          isOpen={open}
          setOpen={setOpen}
          imageSrc={selectedEvent.images?.[0]}     /* locked: images[0] binding */
          imageAlt={selectedEvent.name}            /* locked: name binding */
          date={selectedEvent.date}               /* locked: date binding */
          title={selectedEvent.name}              /* locked: name binding */
          description={selectedEvent.description} /* locked: description binding */
          extraImage={selectedEvent.images}       /* locked: full images array */
        />
      )}
    </>
  );
}
