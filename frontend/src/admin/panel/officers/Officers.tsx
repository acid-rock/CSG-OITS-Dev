import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import FilterSelect from "../../components/filter/Filter";
import DeleteModal from "../../components/modals/deleteModal/DeleteModal";
import OfficerForm from "./OfficerForm";
import { filterByDate } from "../../utils/filterByDate";
import { Archive, ArchiveRestore } from "lucide-react";
import Actionbar from "../../components/action-bar/Actionbar";

const API_URL = import.meta.env.VITE_API_URL as string;

interface Committee {
  id: number;
  name: string;
}

interface OfficerEntry {
  id: string;
  full_name: string;
  position: string | string[];
  type: string;
  avatar: string;
  socials?: string;
  year_serving?: string;
  student_number?: string;
  committee?: string | null;
  is_committee_official: boolean;
  created_at: string;
  archived_at?: string;
}

const filterOptions = ["All", "Today", "This Week", "This Month"];
const sortOptions = [
  "Name (A-Z)",
  "Name (Z-A)",
  "Date (Newest)",
  "Date (Oldest)",
];

type Tab = "active" | "archived";

function displayPosition(pos: string | string[]): string {
  return Array.isArray(pos) ? pos[0] : pos;
}

const groupByTerm = (items: OfficerEntry[]): Record<string, OfficerEntry[]> => {
  const groups: Record<string, OfficerEntry[]> = {};
  items.forEach((item) => {
    const term = item.year_serving ?? "Unknown Term";
    if (!groups[term]) groups[term] = [];
    groups[term].push(item);
  });
  return groups;
};

const OfficersPanel = () => {
  const [tab, setTab] = useState<Tab>("active");
  const [data, setData] = useState<OfficerEntry[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [active, setActive] = useState<string[]>([]);
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState("");
  const [spinning, setSpinning] = useState(false);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<OfficerEntry | undefined>(undefined);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openTerms, setOpenTerms] = useState<Record<string, boolean>>({});
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  console.log(data);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    setActive([]);
    try {
      const officersEndpoint =
        tab === "archived"
          ? `${API_URL}/officers/archived`
          : `${API_URL}/officers`;
      const [officersRes, committeesRes] = await Promise.all([
        axios.get<OfficerEntry[]>(officersEndpoint, { withCredentials: true }),
        axios.get<Committee[]>(`${API_URL}/committees`, {
          withCredentials: true,
        }),
      ]);
      setData(officersRes.data);
      setCommittees(committeesRes.data);
    } catch (err: unknown) {
      setFetchError(
        err instanceof Error ? err.message : "Failed to load officers.",
      );
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  useEffect(() => {
    setOpenTerms({});
  }, [tab]);

  const committeeName = (id?: string | null) =>
    committees.find((c) => c.id === id)?.name ?? "—";

  const handleActive = (entryId: string) =>
    setActive((prev) =>
      prev.includes(entryId)
        ? prev.filter((a) => a !== entryId)
        : [...prev, entryId],
    );

  const handleRefresh = () => {
    setSpinning(true);
    fetchData().finally(() => setTimeout(() => setSpinning(false), 600));
  };

  const handleArchive = async (officerId: string) => {
    try {
      setFetchError(null);
      await axios.post(
        `${API_URL}/officers/archive`,
        { ids: [officerId], term_year: "2025-2026" },
        { withCredentials: true },
      );
      setData((prev) => prev.filter((o) => o.id !== officerId));
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? (err instanceof Error ? err.message : "Unknown error");
      setFetchError(`Failed to archive officer: ${msg}`);
    }
  };

  const handleRestore = async (officerId: string) => {
    await axios.post(
      `${API_URL}/officers/restore`,
      { ids: [officerId] },
      { withCredentials: true },
    );
    fetchData();
  };

  const handleDelete = async (officerId: string, name: string) => {
    if (!window.confirm(`Permanently delete ${name}? This cannot be undone.`))
      return;
    try {
      await axios.delete(`${API_URL}/officers/delete`, {
        data: { ids: [officerId] },
        withCredentials: true,
      });
      setData((prev) => prev.filter((o) => o.id !== officerId));
      setActive((prev) => prev.filter((a) => a !== officerId));
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Delete failed.";
      setFetchError(msg);
    }
  };

  const tabStyle = (t: Tab) => ({
    padding: "0.35rem 1rem",
    border: "none",
    borderBottom: tab === t ? "2px solid #3b82f6" : "2px solid transparent",
    background: "none",
    cursor: "pointer",
    fontWeight: tab === t ? 600 : 400,
    color: tab === t ? "#3b82f6" : "#6b7280",
    fontSize: "0.9rem",
  });

  const toggleTerm = (term: string) =>
    setOpenTerms((prev) => ({ ...prev, [term]: !prev[term] }));

  const archivedGroups = tab === "archived" ? groupByTerm(data) : {};
  const sortedTerms = Object.keys(archivedGroups).sort((a, b) =>
    b.localeCompare(a),
  );
  const isOpen = (term: string) =>
    openTerms[term] !== undefined ? openTerms[term] : term === sortedTerms[0];

  if (loading) {
    return (
      <div className="announce-container">
        <div className="announce-header">
          <span>Officers</span>
        </div>
        <p style={{ padding: "1rem" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="announce-container">
      <div className="announce-header">
        <span>Officers</span>
      </div>

      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: "1px solid #e5e7eb",
          marginBottom: "0.5rem",
        }}
      >
        <button style={tabStyle("active")} onClick={() => setTab("active")}>
          Active
        </button>
        <button style={tabStyle("archived")} onClick={() => setTab("archived")}>
          Archived
        </button>
      </div>

      {fetchError && (
        <p style={{ padding: "0.5rem 1rem", color: "red" }}>{fetchError}</p>
      )}

      <div className="announce-toolbar">
        <span className="announce-file-count">{data.length} Officers</span>
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
          {tab === "active" && (
            <button
              className="announce-add-btn"
              onClick={() => {
                setEditId(null);
                setEditData(undefined);
                setOpen(true);
              }}
            >
              Add Officer
            </button>
          )}
        </div>
      </div>

      {tab === "active" && active.length >= 1 && (
        <Actionbar
          items={active.length}
          selectedIds={active}
          source="officer"
          onSuccess={fetchData}
        />
      )}

      <div className="announce-file-table">
        {tab === "active" ? (
          <table>
            <thead>
              <tr className="announce-table-header-light">
                <th>
                  <input
                    type="checkbox"
                    title="Select All"
                    checked={data.length > 0 && active.length === data.length}
                    onChange={() =>
                      setActive(
                        active.length === data.length
                          ? []
                          : data.map((e) => e.id),
                      )
                    }
                  />
                </th>
                <th>Full Name</th>
                <th>Position</th>
                <th>Type</th>
                <th>Committee</th>
                <th>Term (S.Y.)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data
                .filter((e) => filterByDate(e.created_at, filter))
                .sort((a, b) => {
                  if (sort === "Name (A-Z)")
                    return a.full_name.localeCompare(b.full_name);
                  if (sort === "Name (Z-A)")
                    return b.full_name.localeCompare(a.full_name);
                  if (sort === "Date (Newest)")
                    return (
                      new Date(b.created_at).getTime() -
                      new Date(a.created_at).getTime()
                    );
                  if (sort === "Date (Oldest)")
                    return (
                      new Date(a.created_at).getTime() -
                      new Date(b.created_at).getTime()
                    );
                  return 0;
                })
                .map((entry, idx) => (
                  <tr
                    key={idx}
                    className={`announce-table-row ${active.includes(entry.id) ? "announce-active" : ""}`}
                    onMouseEnter={() => setHoveredRowId(entry.id)}
                    onMouseLeave={() => setHoveredRowId(null)}
                  >
                    <td>
                      <input
                        className="checkbox"
                        type="checkbox"
                        checked={active.includes(entry.id)}
                        onChange={() => handleActive(entry.id)}
                        title={`Select ${entry.full_name}`}
                      />
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <img
                          src={entry.avatar || "/CSG_logo.svg"}
                          alt={entry.full_name}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                          onError={(e) => {
                            e.currentTarget.src = "/CSG_logo.svg";
                          }}
                        />
                        {entry.full_name}
                      </div>
                    </td>
                    <td>{displayPosition(entry.position)}</td>
                    <td style={{ textTransform: "capitalize" }}>
                      {entry.type}
                    </td>
                    <td>{committeeName(entry.committee)}</td>
                    <td>{entry.year_serving ?? "—"}</td>
                    <td className="announce-file-btn">
                      {hoveredRowId === entry.id && (
                        <div className="announce-file-btn-inner">
                          <button
                            title="Archive"
                            onClick={() => handleArchive(entry.id)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: "0.2rem",
                              color: "#9ca3af",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <Archive size={16} />
                          </button>
                          <img
                            src="/bin.png"
                            alt="Move to bin"
                            title="Move to bin"
                            style={{ cursor: "pointer" }}
                            onClick={async () => {
                              if (!window.confirm("Move this item to the bin?"))
                                return;
                              try {
                                await axios.post(
                                  `${API_URL}/officers/archive`,
                                  {
                                    ids: [entry.id],
                                    term_year:
                                      entry.year_serving ?? "2025-2026",
                                  },
                                  { withCredentials: true },
                                );
                                setData((prev) =>
                                  prev.filter((o) => o.id !== entry.id),
                                );
                              } catch (err: unknown) {
                                const msg =
                                  (
                                    err as {
                                      response?: {
                                        data?: { message?: string };
                                      };
                                    }
                                  )?.response?.data?.message ??
                                  "Failed to move to bin.";
                                setFetchError(msg);
                              }
                            }}
                          />
                          <img
                            src="/edit.png"
                            alt="Edit"
                            onClick={() => {
                              setEditId(entry.id);
                              setEditData(entry);
                              setOpen(true);
                            }}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        ) : (
          <>
            {sortedTerms.length === 0 && (
              <p
                style={{
                  padding: "1rem",
                  color: "#9ca3af",
                  fontSize: "0.875rem",
                }}
              >
                No archived officers.
              </p>
            )}
            {sortedTerms.map((term) => (
              <div
                key={term}
                style={{
                  marginBottom: "1rem",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <button
                  onClick={() => toggleTerm(term)}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.75rem 1rem",
                    background: "#f9fafb",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    color: "#374151",
                  }}
                >
                  <span>Term {term}</span>
                  <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                    {archivedGroups[term].length} item
                    {archivedGroups[term].length !== 1 ? "s" : ""}&nbsp;
                    {isOpen(term) ? "▲" : "▼"}
                  </span>
                </button>
                {isOpen(term) && (
                  <table style={{ width: "100%" }}>
                    <thead>
                      <tr className="announce-table-header-light">
                        <th></th>
                        <th>Full Name</th>
                        <th>Position</th>
                        <th>Type</th>
                        <th>Committee</th>
                        <th>Term (S.Y.)</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {archivedGroups[term].map((entry, idx) => (
                        <tr
                          key={idx}
                          className={`announce-table-row ${active.includes(entry.id) ? "announce-active" : ""}`}
                        >
                          <td>
                            <input
                              className="checkbox"
                              type="checkbox"
                              checked={active.includes(entry.id)}
                              onChange={() => handleActive(entry.id)}
                              title={`Select ${entry.full_name}`}
                            />
                          </td>
                          <td>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                              }}
                            >
                              <img
                                src={entry.avatar || "/CSG_logo.svg"}
                                alt={entry.full_name}
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: "50%",
                                  objectFit: "cover",
                                }}
                                onError={(e) => {
                                  e.currentTarget.src = "/CSG_logo.svg";
                                }}
                              />
                              {entry.full_name}
                            </div>
                          </td>
                          <td>{displayPosition(entry.position)}</td>
                          <td style={{ textTransform: "capitalize" }}>
                            {entry.type}
                          </td>
                          <td>{committeeName(entry.committee)}</td>
                          <td>{entry.year_serving ?? "—"}</td>
                          <td
                            style={{
                              verticalAlign: "middle",
                              padding: "0.5rem 1rem",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                gap: "0.5rem",
                                alignItems: "center",
                              }}
                            >
                              <button
                                onClick={() => handleRestore(entry.id)}
                                style={{
                                  color: "#16a34a",
                                  background: "none",
                                  border: "1px solid #16a34a",
                                  borderRadius: "4px",
                                  padding: "0.25rem 0.625rem",
                                  fontSize: "0.75rem",
                                  cursor: "pointer",
                                }}
                              >
                                Restore
                              </button>
                              <button
                                onClick={() =>
                                  handleDelete(entry.id, entry.full_name)
                                }
                                style={{
                                  color: "#dc2626",
                                  background: "none",
                                  border: "1px solid #dc2626",
                                  borderRadius: "4px",
                                  padding: "0.25rem 0.625rem",
                                  fontSize: "0.75rem",
                                  cursor: "pointer",
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {isModalOpen && (
        <div className="announce-modal-position">
          <DeleteModal
            isOpen={isModalOpen}
            source="officer"
            id={deleteId}
            title="Delete Officer"
            message="This will permanently remove the officer and their avatar from storage."
            onClose={() => setIsModalOpen(false)}
            onConfirm={() => {
              setActive((prev) => prev.filter((a) => a !== deleteId));
              fetchData();
            }}
          />
        </div>
      )}

      {open && (
        <div className="announce-form-position">
          <OfficerForm
            id={editId}
            initialData={editData}
            setOpen={setOpen}
            onSuccess={fetchData}
          />
        </div>
      )}
    </div>
  );
};

export default OfficersPanel;
