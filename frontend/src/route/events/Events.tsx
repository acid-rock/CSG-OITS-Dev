import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Modal from "../../components/modal/Modal";
import type { OutletContext } from "../../root-layout/Root-layout";
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";
import SearchFilterBar from "../../components/search-filter-bar/SearchFilterBar";
import "./events.css";

const EVENTS_PER_PAGE = 2;

export default function EventsPage() {

  /* ══════════════════════════════════════════════════════
     LOCKED DATA BINDINGS — do not modify
     ══════════════════════════════════════════════════════ */
  const { events } = useOutletContext<OutletContext>();

  const [currentPage,    setCurrentPage]    = useState<number>(0);
  const [open,           setOpen]           = useState(false);
  const [selectedEvent,  setSelectedEvent]  = useState<any>(null);
  const [searchQuery,    setSearchQuery]    = useState("");
  const [termFilter,     setTermFilter]     = useState("");

  const termOptions = [...new Set(events.map((e) => (e as any).term_year).filter(Boolean))].sort().reverse() as string[];

  useLockBodyScroll(open);

  /* Search + term filtered list */
  const filtered = events.filter((e) => {
    const matchesSearch = !searchQuery.trim() || (
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.description ?? "").toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesTerm = !termFilter || (e as any).term_year === termFilter;
    return matchesSearch && matchesTerm;
  });

  const totalPages       = Math.ceil(filtered.length / EVENTS_PER_PAGE);
  const currentPageEvents = filtered.slice(
    currentPage * EVENTS_PER_PAGE,
    currentPage * EVENTS_PER_PAGE + EVENTS_PER_PAGE,
  );

  /* Locked pagination handlers */
  const nextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
  const prevPage = () =>
    setCurrentPage((prev) => Math.max(prev - 1, 0));

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    setCurrentPage(0);
  };

  /* Locked modal handler */
  const handleCardClick = (event: any) => {
    setSelectedEvent(event);
    setOpen(true);
  };

  return (
    <>
      {/* ════════════════════════════════════════
          PAGE HEADER
          ════════════════════════════════════════ */}
      <div className="ep-header">
        <div className="ep-header-inner">
          <span className="section-label ep-kicker">What&rsquo;s happening</span>
          <h1 className="ep-heading">
            Latest{" "}
            <em className="italic-accent">events</em>
          </h1>
          <p className="ep-subheading">
            Activities, assemblies, and community drives this term.
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════
          SEARCH + TERM FILTER BAR
          ════════════════════════════════════════ */}
      <div className="bl-toolbar-wrap">
        <div style={{ maxWidth: 600, margin: "0 auto", width: "100%", padding: "0 var(--section-padding-x)" }}>
          <SearchFilterBar
            searchValue={searchQuery}
            onSearchChange={(v) => { handleSearchChange(v); }}
            termValue={termFilter}
            onTermChange={(v) => { setTermFilter(v); setCurrentPage(0); }}
            termOptions={termOptions}
            searchPlaceholder="Search events..."
          />
        </div>
      </div>

      {/* ════════════════════════════════════════
          MAIN CONTENT
          ════════════════════════════════════════ */}
      <div className="ep-content">

        {filtered.length === 0 ? (
          <p className="ep-empty">{searchQuery ? "No events match your search." : "No events yet."}</p>
        ) : (
          <>
            {/* ── 2-column card grid ── */}
            <div className="ep-card-grid">
              {currentPageEvents.map((event) => (
                <div
                  key={event.id}
                  className="ep-grid-card card"
                  onClick={() => handleCardClick(event)}
                >
                  {/* Full-cover image at top */}
                  <div className="ep-grid-img">
                    {event.images?.[0] ? (
                      <img
                        src={event.images[0]}
                        alt={event.name}
                        className="ep-grid-cover"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <img src="/CSG_logo.svg" alt="CSG" className="ep-grid-logo" />
                    )}
                  </div>
                  {/* Card body */}
                  <div className="ep-grid-body">
                    <p className="ep-sidebar-date">&bull;&nbsp;{event.date}</p>
                    <h3 className="ep-feat-title">{event.name}</h3>
                    <p className="ep-feat-desc">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="ep-pagination">
                <button
                  type="button"
                  className="ep-arrow"
                  onClick={prevPage}
                  disabled={currentPage === 0}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={20} />
                </button>

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
            )}
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
          imageSrc={selectedEvent.images?.[0]}
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
