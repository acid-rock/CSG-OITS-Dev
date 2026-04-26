import { useEffect, useMemo, useState } from "react";
import "./Eventpanel.css";
import FilterSelect from "../../components/filter/Filter";
import Form from "../../components/form/Form";
import DeleteModal from "../../components/modals/deleteModal/DeleteModal";
import Actionbar from "../../components/action-bar/Actionbar";
import fetchEvents from "../../../config/eventConfig";
import { type Event } from "../../../root-layout/Root-layout.tsx";
import { DateTime } from "luxon";

const filterOptions = ["All", "Today", "This Week", "This Month"];
const sortOptions = [
  "Name (A-Z)",
  "Name (Z-A)",
  "Date (Newest)",
  "Date (Oldest)",
];

const Eventpanel = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [active, setActive] = useState<string[]>([]);
  const [id, setId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [images, setImages] = useState<string[]>();
  const [open, setOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [filter, setFilter] = useState<string>("All");
  const [sort, setSort] = useState<string>("");
  const [data, setData] = useState<Event[]>([]);
  const [editDate, setEditDate] = useState<string>("");
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [activeArchived, setActiveArchived] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchEvents();
      setData(data);
    };

    fetchData();
  }, []);

  const handleActive = (fileId: string) => {
    setActive((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId],
    );
  };

  const handleActiveArchived = (fileId: string) => {
    setActiveArchived((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId],
    );
  };

  const handleRefresh = () => {
    setSpinning(true);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  const modifiedData = useMemo(() => {
    const now = DateTime.local();
    const filteredData = data.filter((event) => {
      let eventDate;
      switch (filter) {
        case "All":
          return true;
        case "Today":
          eventDate = DateTime.fromISO(event.date);
          return eventDate.hasSame(now, "day");

        case "This Week":
          const lastWeek = now.minus({ days: 7 });
          eventDate = DateTime.fromISO(event.date);
          return eventDate >= lastWeek && eventDate <= now;

        case "This Month":
          const lastMonth = now.minus({ months: 1 });
          eventDate = DateTime.fromISO(event.date);
          return eventDate >= lastMonth && eventDate <= now;

        default:
          return false;
      }
    });

    const sortedData = [...filteredData].sort((a: Event, b: Event) => {
      switch (sort) {
        case "Name (A-Z)":
          return a.name.localeCompare(b.name);
        case "Name (Z-A)":
          return b.name.localeCompare(a.name);
        case "Date (Newest)":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "Date (Oldest)":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        default:
          return 0;
      }
    });

    return sortedData;
  }, [data, filter, sort]);

  const archivedData = data.filter((event) => event.is_archived);
  const sortedArchivedData = [...archivedData].sort((a: Event, b: Event) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <div className="events-container">
      <div className="events-header">
        <span>Events</span>
      </div>

      <div className="events-toolbar">
        <span className="events-file-count">{modifiedData.length} Files</span>
        <div className="events-toolbar-actions">
          <FilterSelect
            options={filterOptions}
            value={filter}
            onChange={setFilter}
            label="Filter"
          />
          <FilterSelect
            options={sortOptions}
            value={sort}
            onChange={setSort}
            label="Sort"
          />
          <button
            className="events-action-btn events-refresh-btn"
            title="Refresh"
            onClick={handleRefresh}
          >
            <img
              src="/refresh.png"
              alt="refresh"
              className={spinning ? "events-spin refresh-img" : "refresh-img"}
            />
          </button>
          <button
            className="events-add-btn"
            onClick={() => {
              setId(null);
              setEditTitle("");
              setEditDate("");
              setEditDescription("");
              setImages(undefined);
              setOpen(true);
            }}
          >
            Add Document
          </button>
        </div>
      </div>

      {active.length > 0 && (
        <Actionbar items={active.length} selectedIds={active} source="events" />
      )}

      <div className="events-file-table">
        <table>
          <colgroup>
            <col className="col-checkbox" />
            <col className="col-image" />
            <col className="col-filename" />
            <col className="col-description" />
            <col className="col-date" />
            <col className="col-actions" />
          </colgroup>
          <thead>
            <tr className="events-table-header-light">
              <th>
                <input
                  type="checkbox"
                  title="Select All"
                  checked={active.length === modifiedData.length}
                  onChange={() => {
                    if (active.length === modifiedData.length) {
                      setActive([]);
                    } else {
                      setActive(modifiedData.map((file) => file.id));
                    }
                  }}
                />
              </th>
              <th>Title</th>
              <th>Selected Images</th>
              <th>Description</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {modifiedData
              .filter((file) => !file.is_archived)
              .map((file, idx) => (
                <tr
                  key={idx}
                  className={`events-table-row ${active.includes(file.id) ? "events-active" : ""}`}
                >
                  <td>
                    <input
                      className="checkbox"
                      type="checkbox"
                      title={`Select ${file.name}`}
                      checked={active.includes(file.id)}
                      onChange={() => handleActive(file.id)}
                    />
                  </td>
                  <td>{file.name}</td>
                  <td>{file.images?.length}</td>
                  <td>{file.description}</td>
                  <td>{DateTime.fromISO(file.date).toFormat("MMM d, yyyy")}</td>
                  <td className="events-file-btn">
                    <div className="events-file-btn-inner">
                      <img
                        src="/bin.png"
                        alt="Delete"
                        onClick={() => {
                          setId(file.id);
                          setIsModalOpen(true);
                        }}
                      />
                      <img
                        src="/edit.png"
                        alt="Edit"
                        onClick={() => {
                          setId(file.id);
                          setEditTitle(file.name);
                          setEditDate(file.date);
                          if (file?.images) {
                            setImages(file.images);
                          }
                          setEditDescription(file.description);
                          setOpen(true);
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="events-modal-position">
          <DeleteModal
            isOpen={isModalOpen}
            source="events"
            id={id}
            onClose={() => setIsModalOpen(false)}
            onConfirm={() => {
              setActive((prev) => prev.filter((a) => a !== id));
              setActiveArchived((prev) => prev.filter((a) => a !== id));
            }}
          />
        </div>
      )}

      {open && (
        <div className="events-form-position">
          <Form
            forType="events"
            id={id}
            Images={images}
            initialTitle={editTitle}
            initialDescription={editDescription}
            eventDateHappened={editDate}
            setOpen={setOpen}
          />
        </div>
      )}

      <div className="events-header" style={{ marginTop: "40px" }}>
        <button
          onClick={() => setArchivedOpen(!archivedOpen)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "inherit",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: 0,
          }}
        >
          <span>{archivedOpen ? "▼" : "▶"}</span>
          <span>Archived Events ({sortedArchivedData.length})</span>
        </button>
      </div>

      {archivedOpen && (
        <>
          {activeArchived.length > 0 && (
            <Actionbar
              items={activeArchived.length}
              selectedIds={activeArchived}
              source="events"
              isArchived={true}
            />
          )}

          <div className="events-file-table">
            <table>
              <colgroup>
                <col className="col-checkbox" />
                <col className="col-image" />
                <col className="col-filename" />
                <col className="col-description" />
                <col className="col-date" />
                <col className="col-actions" />
              </colgroup>
              <thead>
                <tr className="events-table-header-light">
                  <th>
                    <input
                      type="checkbox"
                      title="Select All Archived"
                      checked={
                        activeArchived.length === sortedArchivedData.length &&
                        sortedArchivedData.length > 0
                      }
                      onChange={() => {
                        if (
                          activeArchived.length === sortedArchivedData.length
                        ) {
                          setActiveArchived([]);
                        } else {
                          setActiveArchived(
                            sortedArchivedData.map((file) => file.id),
                          );
                        }
                      }}
                      disabled={sortedArchivedData.length === 0}
                    />
                  </th>
                  <th>Title</th>
                  <th>Selected Images</th>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedArchivedData.length > 0 ? (
                  sortedArchivedData.map((file, idx) => (
                    <tr
                      key={idx}
                      className={`events-table-row ${activeArchived.includes(file.id) ? "events-active" : ""}`}
                    >
                      <td>
                        <input
                          className="checkbox"
                          type="checkbox"
                          title={`Select ${file.name}`}
                          checked={activeArchived.includes(file.id)}
                          onChange={() => handleActiveArchived(file.id)}
                        />
                      </td>
                      <td>{file.name}</td>
                      <td>{file.images?.length}</td>
                      <td>{file.description}</td>
                      <td>
                        {DateTime.fromISO(file.date).toFormat("MMM d, yyyy")}
                      </td>
                      <td className="events-file-btn">
                        <div className="events-file-btn-inner">
                          <img
                            src="/bin.png"
                            alt="Delete"
                            onClick={() => {
                              setId(file.id);
                              setIsModalOpen(true);
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      style={{ textAlign: "center", padding: "20px" }}
                    >
                      No archived events
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Eventpanel;
