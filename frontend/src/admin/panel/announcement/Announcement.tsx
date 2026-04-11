import { useEffect, useMemo, useState } from "react";
import "./announcement.css";
import FilterSelect from "../../components/filter/Filter";
import Form from "../../components/form/Form";
import DeleteModal from "../../components/modals/deleteModal/DeleteModal";
import Actionbar from "../../components/action-bar/Actionbar";
import { type Announcement } from "../../../root-layout/Root-layout.tsx";
import getAnnouncements from "../../../config/bulletinConfig.ts";
import { DateTime } from "luxon";

const filterOptions = ["All", "Today", "This Week", "This Month"];
const sortOptions = [
  "Name (A-Z)",
  "Name (Z-A)",
  "Date (Newest)",
  "Date (Oldest)",
];

const Announcement = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [open, setOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [active, setActive] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>("All");
  const [sort, setSort] = useState<string>("");
  const [data, setData] = useState<Announcement[]>([]);

  useEffect(() => {
    const fetchItems = async () => {
      const data = await getAnnouncements();
      setData(data);
    };

    fetchItems();
  }, []);

  const modifiedData = useMemo(() => {
    const now = DateTime.local();
    const filteredData = data.filter((announcement) => {
      let announcementDate;
      switch (filter) {
        case "All":
          return true;
        case "Today":
          announcementDate = DateTime.fromISO(announcement.date);
          return announcementDate.hasSame(now, "day");

        case "This Week":
          const lastWeek = now.minus({ days: 7 });
          announcementDate = DateTime.fromISO(announcement.date);
          return announcementDate >= lastWeek && announcementDate <= now;

        case "This Month":
          const lastMonth = now.minus({ months: 1 });
          announcementDate = DateTime.fromISO(announcement.date);
          return announcementDate >= lastMonth && announcementDate <= now;

        default:
          return false;
      }
    });

    const sortedData = [...filteredData].sort(
      (a: Announcement, b: Announcement) => {
        switch (sort) {
          case "Name (A-Z)":
            return a.title.localeCompare(b.title);
          case "Name (Z-A)":
            return b.title.localeCompare(a.title);
          case "Date (Newest)":
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          case "Date (Oldest)":
            return new Date(a.date).getTime() - new Date(b.date).getTime();
          default:
            return 0;
        }
      },
    );

    return sortedData;
  }, [data, filter, sort]);

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

  return (
    <div className="announce-container">
      <div className="announce-header">
        <span>Announcement</span>
      </div>

      <div className="announce-toolbar">
        <span className="announce-file-count">{modifiedData.length} Files</span>
        <div className="announce-toolbar-actions">
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
            className="announce-action-btn announce-refresh-btn"
            title="Refresh"
            onClick={handleRefresh}
          >
            <img
              src="/refresh.png"
              alt="refresh"
              className={spinning ? "announce-spin refresh-img" : "refresh-img"}
            />
          </button>
          <button
            className="announce-add-btn"
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

      <div className="announce-file-table">
        <table>
          <colgroup>
            <col className="col-checkbox" />
            <col className="col-filename" />
            <col className="col-description" />
            <col className="col-date" />
            <col className="col-actions" />
          </colgroup>
          <thead>
            <tr className="announce-table-header-light">
              <th>
                <input
                  type="checkbox"
                  title="Select All"
                  checked={active.length === data.length}
                  onChange={() => {
                    if (active.length === data.length) {
                      setActive([]);
                    } else {
                      setActive(data.map((file) => file.title));
                    }
                  }}
                />
              </th>
              <th>File Name</th>
              <th>Description</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {modifiedData.map((file, idx) => (
              <tr
                key={idx}
                className={`announce-table-row ${active.includes(file.title) ? "announce-active" : ""}`}
              >
                <td>
                  <input
                    className="checkbox"
                    type="checkbox"
                    title={`Select ${file.title}`}
                    checked={active.includes(file.title)}
                    onChange={() => handleActive(file.title)}
                  />
                </td>
                <td>{file.title}</td>
                <td>{file.content}</td>
                <td>{file.date.toLocaleString()}</td>
                <td className="announce-file-btn">
                  <div className="announce-file-btn-inner">
                    <img
                      src="/bin.png"
                      alt="Delete"
                      onClick={() => {
                        setId(file.title);
                        setIsModalOpen(true);
                      }}
                    />
                    <img
                      src="/edit.png"
                      alt="Edit"
                      onClick={() => {
                        setId(file.id);
                        setEditTitle(file.title);
                        setEditDescription(file.content);
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
        <div className="announce-modal-position">
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
        <div className="announce-form-position">
          <Form
            forType="announcement"
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

export default Announcement;
