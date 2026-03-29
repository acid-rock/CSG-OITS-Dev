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
  const [id, setId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [open, setOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [active, setActive] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>("All");
  const [sort, setSort] = useState<string>("");
  const [data, setData] = useState<Event[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchEvents();
      setData(data);
    };

    fetchData();
  }, []);

  const handleActive = (fileName: string) => {
    setActive((prev) =>
      prev.includes(fileName)
        ? prev.filter((name) => name !== fileName)
        : [...prev, fileName],
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

  return (
    <div className="events-container">
      <div className="events-header">
        <span>Events</span>
      </div>

      <div className="events-toolbar">
        <span className="events-file-count">{data.length} Files</span>
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
              setEditDescription("");
              setOpen(true);
            }}
          >
            Add Document
          </button>
        </div>
      </div>

      {active.length >= 3 && (
        <Actionbar
          items={active.length}
          selectedIds={active}
          source="announcement"
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
                  title="Select All"
                  checked={active.length === modifiedData.length}
                  onChange={() => {
                    if (active.length === modifiedData.length) {
                      setActive([]);
                    } else {
                      setActive(modifiedData.map((file) => file.name));
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
            {modifiedData.map((file, idx) => (
              <tr
                key={idx}
                className={`events-table-row ${active.includes(file.name) ? "events-active" : ""}`}
              >
                <td>
                  <input
                    className="checkbox"
                    type="checkbox"
                    title={`Select ${file.name}`}
                    checked={active.includes(file.name)}
                    onChange={() => handleActive(file.name)}
                  />
                </td>
                <td>{file.name}</td>
                <td>{file.images.length}</td>
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
            source="announcement"
            id={id}
            onClose={() => setIsModalOpen(false)}
            onConfirm={() => setActive((prev) => prev.filter((a) => a !== id))}
          />
        </div>
      )}

      {open && (
        <div className="events-form-position">
          <Form
            forType="events"
            id={id}
            initialTitle={editTitle}
            initialDescription={editDescription}
            setOpen={setOpen}
          />
        </div>
      )}
    </div>
  );
};

export default Eventpanel;
