import { useEffect, useMemo, useState } from "react";
import "./document.css";
import FilterSelect from "../../components/filter/Filter";
import Form from "../../components/form/Form";
import DeleteModal from "../../components/modals/deleteModal/DeleteModal";
import Actionbar from "../../components/action-bar/Actionbar";
import { type Document } from "../../../root-layout/Root-layout.tsx";
import fetchDocuments from "../../../config/documentsConfig.ts";
import { DateTime } from "luxon";

const filterOptions = ["All", "Today", "This Week", "This Month"];
const sortOptions = [
  "Name (A-Z)",
  "Name (Z-A)",
  "Date (Newest)",
  "Date (Oldest)",
];

const Documents = () => {
  const [spinning, setSpinning] = useState(false);
  const [active, setActive] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>("All");
  const [sort, setSort] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [data, setData] = useState<Document[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchDocuments();
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
    const filteredData = data.filter((doc) => {
      let docDate;
      switch (filter) {
        case "All":
          return true;
        case "Today":
          docDate = DateTime.fromISO(doc.date);
          return docDate.hasSame(now, "day");

        case "This Week":
          const lastWeek = now.minus({ days: 7 });
          docDate = DateTime.fromISO(doc.date);
          return docDate >= lastWeek && docDate <= now;

        case "This Month":
          const lastMonth = now.minus({ months: 1 });
          docDate = DateTime.fromISO(doc.date);
          return docDate >= lastMonth && docDate <= now;

        default:
          return false;
      }
    });

    const sortedData = [...filteredData].sort((a: Document, b: Document) => {
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

  console.log(data);

  return (
    <div className="docs-container">
      <div className="docs-header">
        <span>Documents</span>
      </div>

      <div className="docs-toolbar">
        <span className="docs-file-count">{modifiedData.length} Files</span>
        <div className="docs-toolbar-actions">
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
            className="docs-action-btn docs-refresh-btn"
            title="Refresh"
            onClick={handleRefresh}
          >
            <img
              src="/refresh.png"
              alt="refresh"
              className={spinning ? "docs-spin refresh-img" : "refresh-img"}
            />
          </button>
          <button
            className="docs-add-btn"
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
          source="document"
        />
      )}

      <div className="docs-file-table">
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
            <tr className="docs-table-header-light">
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
              <th>Image</th>
              <th>File Name</th>
              <th>Category</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {modifiedData.map((file, idx) => (
              <tr
                key={idx}
                className={`docs-table-row ${active.includes(file.description) ? "docs-active" : ""}`}
              >
                <td>
                  <input
                    className="checkbox"
                    type="checkbox"
                    title={`Select ${file.description}`}
                    checked={active.includes(file.description)}
                    onChange={() => handleActive(file.description)}
                  />
                </td>
                <td>{file.url}</td>
                <td>{file.description}</td>
                <td>{file.category}</td>
                <td>{DateTime.fromISO(file.date).toFormat("MMM d, yyyy")}</td>
                <td className="docs-file-btn">
                  <div className="docs-file-btn-inner">
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
                        setEditTitle(file.description);
                        setEditDescription(file.category);
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

      {open && (
        <div className="docs-form-position">
          <Form
            forType="document"
            id={id}
            initialTitle={editTitle}
            initialDescription={editDescription}
            setOpen={setOpen}
          />
        </div>
      )}

      {isModalOpen && (
        <div className="docs-modal-position">
          <DeleteModal
            isOpen={isModalOpen}
            source="document"
            id={id}
            onClose={() => setIsModalOpen(false)}
            onConfirm={() => setActive((prev) => prev.filter((a) => a !== id))}
          />
        </div>
      )}
    </div>
  );
};

export default Documents;
