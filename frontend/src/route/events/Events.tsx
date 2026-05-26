import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import Modal from "../../components/modal/Modal";
import type { OutletContext } from "../../root-layout/Root-layout";
import SearchFilterBar from "../../components/search-filter-bar/SearchFilterBar";
import "./events.css";

export default function EventsPage() {
  /* ══════════════════════════════════════════════════════
     LOCKED DATA BINDINGS — do not modify
     ══════════════════════════════════════════════════════ */
  const { events } = useOutletContext<OutletContext>();

  const [open, setOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [termFilter, setTermFilter] = useState("");

  const termOptions = [
    ...new Set(events.map((e) => (e as any).term_year).filter(Boolean)),
  ]
    .sort()
    .reverse() as string[];

  // scroll lock owned by <Modal>

  /* Search + term filtered list — all results shown, no pagination */
  const filtered = events.filter((e) => {
    const matchesSearch =
      !searchQuery.trim() ||
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.description ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTerm = !termFilter || (e as any).term_year === termFilter;
    return matchesSearch && matchesTerm;
  });

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
          <span className="section-label ep-kicker">
            What&rsquo;s happening
          </span>
          <h1 className="ep-heading">
            Latest <em className="italic-accent">events</em>
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
        <div
          style={{
            maxWidth: 600,
            margin: "0 auto",
            width: "100%",
            padding: "0 var(--section-padding-x)",
          }}
        >
          <SearchFilterBar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            termValue={termFilter}
            onTermChange={setTermFilter}
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
          <p className="ep-empty">
            {searchQuery ? "No events match your search." : "No events yet."}
          </p>
        ) : (
          /* 3-column card grid — all filtered results, no pagination */
          <div className="ep-card-grid">
            {filtered.map((event) => (
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
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display =
                          "none";
                      }}
                    />
                  ) : (
                    <img
                      src="/CSG_logo.svg"
                      alt="CSG"
                      className="ep-grid-logo"
                    />
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
