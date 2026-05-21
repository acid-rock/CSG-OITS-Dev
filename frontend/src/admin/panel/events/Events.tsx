import { useState, useEffect, useCallback } from "react";
import "../_shared/admin-list.css";
import Sidebar from "../_shared/Sidebar";
import { PageHead, Tabs, Toolbar, BulkBar, TableFoot } from "../_shared/chrome";
import { Thumb, Tag, StatusPill } from "../_shared/atoms";
import { I } from "../_shared/icons";
import { timeAgo, fmtDate } from "../_shared/utils";
import Form from "../../components/form/Form";
import DeleteModal from "../../components/modals/deleteModal/DeleteModal";
import PublicPreviewModal from "../../components/modals/PublicPreviewModal/PublicPreviewModal";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL as string;

interface EventEntry {
  id: string;
  name: string;
  description: string;
  date: string;
  created_at: string;
  images: string[];
  archived_at?: string;
}

type Tab = "active" | "archived" | "bin";

type StatusTone = "primary" | "warning" | "danger" | "neutral" | "success";

function eventStatus(date: string): { label: string; tone: StatusTone } {
  if (!date) return { label: "Unknown", tone: "neutral" };
  const d = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (eventDay < today) return { label: "Past", tone: "neutral" };
  if (eventDay.getTime() === today.getTime()) return { label: "Ongoing", tone: "success" };
  return { label: "Upcoming", tone: "primary" };
}

const filterByDate = (date: string, filter: string): boolean => {
  if (!filter || filter === "All") return true;
  const fileDate = new Date(date);
  const now = new Date();
  if (filter === "Today") return fileDate.toDateString() === now.toDateString();
  if (filter === "This Week") {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return fileDate >= startOfWeek;
  }
  if (filter === "This Month") {
    return (
      fileDate.getMonth() === now.getMonth() &&
      fileDate.getFullYear() === now.getFullYear()
    );
  }
  return true;
};

const groupByTerm = (items: EventEntry[]): Record<string, EventEntry[]> => {
  const groups: Record<string, EventEntry[]> = {};
  items.forEach((item) => {
    const year = item.archived_at
      ? new Date(item.archived_at).getFullYear()
      : new Date().getFullYear();
    const term = `${year}-${year + 1}`;
    if (!groups[term]) groups[term] = [];
    groups[term].push(item);
  });
  return groups;
};

const Events = () => {
  const [tab, setTab] = useState<Tab>("active");
  const [data, setData] = useState<EventEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editImages, setEditImages] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [active, setActive] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [openTerms, setOpenTerms] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [previewItem, setPreviewItem] = useState<EventEntry | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    setActive([]);
    try {
      const endpoint =
        tab === "archived"
          ? `${API_URL}/events/archived`
          : tab === "bin"
            ? `${API_URL}/events/bin`
            : `${API_URL}/events`;
      const { data: responseData } = await axios.get(endpoint, {
        withCredentials: true,
      });
      setData(responseData);
    } catch (err: unknown) {
      setFetchError(
        err instanceof Error ? err.message : "Failed to load events.",
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

  const handleArchive = async (entryId: string) => {
    await axios.post(
      `${API_URL}/events/archive`,
      { ids: [entryId] },
      { withCredentials: true },
    );
    fetchData();
  };

  const handleSoftDelete = async (entryId: string) => {
    try {
      await axios.post(
        `${API_URL}/events/bin`,
        { ids: [entryId] },
        { withCredentials: true },
      );
      setData((prev) => prev.filter((item) => item.id !== entryId));
    } catch (err: unknown) {
      setFetchError(
        "Failed to move to bin: " +
          ((err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ??
            (err instanceof Error ? err.message : "Unknown")),
      );
    }
  };

  const handleRestore = async (entryId: string) => {
    await axios.post(
      `${API_URL}/events/restore`,
      { ids: [entryId] },
      { withCredentials: true },
    );
    setData((prev) => prev.filter((e) => e.id !== entryId));
    fetchData();
  };

  const handleRestoreFromBin = async (entryId: string) => {
    try {
      await axios.post(
        `${API_URL}/events/restore-from-bin`,
        { ids: [entryId] },
        { withCredentials: true },
      );
      setData((prev) => prev.filter((e) => e.id !== entryId));
    } catch {
      fetchData();
    }
  };

  const handlePermanentDelete = async (entryId: string) => {
    if (!window.confirm("Permanently delete this item? This cannot be undone."))
      return;
    try {
      await axios.delete(`${API_URL}/events/delete`, {
        data: { id: entryId },
        withCredentials: true,
      });
      setData((prev) => prev.filter((item) => item.id !== entryId));
    } catch (err: unknown) {
      setFetchError(
        "Delete failed: " +
          ((err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ??
            (err instanceof Error ? err.message : "Unknown")),
      );
    }
  };

  const handleBulkArchive = async () => {
    await axios.post(
      `${API_URL}/events/archive`,
      { ids: active },
      { withCredentials: true },
    );
    setActive([]);
    fetchData();
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${active.length} items?`)) return;
    for (const entryId of active) {
      await axios.delete(`${API_URL}/events/delete`, {
        data: { id: entryId },
        withCredentials: true,
      });
    }
    setActive([]);
    fetchData();
  };

  const toggleTerm = (term: string) =>
    setOpenTerms((prev) => ({ ...prev, [term]: !prev[term] }));

  const archivedGroups = tab === "archived" ? groupByTerm(data) : {};
  const sortedTerms = Object.keys(archivedGroups).sort((a, b) =>
    b.localeCompare(a),
  );
  const isTermOpen = (term: string) =>
    openTerms[term] !== undefined ? openTerms[term] : term === sortedTerms[0];

  const filteredActive = data
    .filter((entry) => filterByDate(entry.date, filter))
    .filter(
      (entry) =>
        !searchQuery ||
        entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.description ?? "").toLowerCase().includes(searchQuery.toLowerCase()),
    );

  const tabItems = [
    { label: "Active", active: tab === "active", count: tab === "active" ? data.length : undefined },
    { label: "Archived", active: tab === "archived" },
    { label: "Bin", active: tab === "bin" },
  ];

  return (
    <div className="ad-shell">
      <Sidebar active="events" />
      <main className="ad-main">
        <PageHead
          title="Events"
          subtitle="Schedule, feature, and manage CSG events. Featured events appear on the public Events page."
          actions={
            <>
              <button className="ad-btn-ghost" onClick={() => window.print()}>
                <I.print width="14" height="14" />
                Print
              </button>
              {tab === "active" && (
                <button
                  className="ad-btn-primary"
                  onClick={() => {
                    setId(null);
                    setEditTitle("");
                    setEditDescription("");
                    setEditDate("");
                    setOpen(true);
                  }}
                >
                  <I.plus width="14" height="14" />
                  New event
                </button>
              )}
            </>
          }
        />

        <Tabs
          items={tabItems}
          onTabChange={(label) => {
            if (label === "Active") setTab("active");
            else if (label === "Archived") setTab("archived");
            else if (label === "Bin") setTab("bin");
          }}
        />

        {fetchError && (
          <p style={{ padding: "0.5rem 1rem", color: "var(--color-danger)" }}>
            {fetchError}
          </p>
        )}

        <Toolbar
          placeholder="Search events by title, venue, or description…"
          search={searchQuery}
          onSearch={setSearchQuery}
          onRefresh={handleRefresh}
          showSort={false}
        >
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="ad-filter-select"
          >
            <option value="">All dates</option>
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
          </select>
        </Toolbar>

        {tab === "active" && active.length >= 1 && (
          <BulkBar
            count={active.length}
            actions={["Archive", "Delete"]}
            handlers={{
              Archive: handleBulkArchive,
              Delete: handleBulkDelete,
            }}
            onClear={() => setActive([])}
          />
        )}

        {loading ? (
          <p style={{ padding: "1rem" }}>Loading...</p>
        ) : (
          <>
            {/* ── Active tab ── */}
            {tab === "active" && (
              <section className="ad-card">
                <table className="ad-table">
                  <colgroup>
                    <col style={{ width: 44 }} />
                    <col style={{ width: 72 }} />
                    <col />
                    <col style={{ width: 140 }} />
                    <col style={{ width: 130 }} />
                    <col style={{ width: 140 }} />
                    <col style={{ width: 160 }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          title="Select All"
                          checked={filteredActive.length > 0 && active.length === filteredActive.length}
                          onChange={() =>
                            setActive(
                              active.length === filteredActive.length
                                ? []
                                : filteredActive.map((e) => e.id),
                            )
                          }
                        />
                      </th>
                      <th>Photo</th>
                      <th>Title &amp; venue</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th className="ad-th-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActive.map((entry) => {
                      const status = eventStatus(entry.date);
                      return (
                        <tr
                          key={entry.id}
                          className={active.includes(entry.id) ? "is-selected" : ""}
                        >
                          <td>
                            <input
                              type="checkbox"
                              title={`Select ${entry.name}`}
                              checked={active.includes(entry.id)}
                              onChange={() => handleActive(entry.id)}
                            />
                          </td>
                          <td>
                            <Thumb
                              src={entry.images?.[0] || null}
                              title={entry.name}
                              kind="image"
                            />
                          </td>
                          <td>
                            <div className="ad-title-stack">
                              <div className="ad-title-row">
                                <Tag label="Event" tone="warning" />
                                <span className="ad-title-link">{entry.name}</span>
                              </div>
                              <p className="ad-desc">{entry.description}</p>
                            </div>
                          </td>
                          <td>
                            <div className="ad-date">
                              <span className="ad-date-abs">{fmtDate(entry.date)}</span>
                            </div>
                          </td>
                          <td>
                            <StatusPill label={status.label} tone={status.tone} />
                          </td>
                          <td>
                            <div className="ad-date">
                              <span className="ad-date-abs">{fmtDate(entry.created_at)}</span>
                              <span className="ad-date-rel">{timeAgo(entry.created_at)}</span>
                            </div>
                          </td>
                          <td className="ad-actions">
                            <button
                              className="ad-icon-btn"
                              title="Preview"
                              onClick={() => setPreviewItem(entry)}
                            >
                              <I.eye width="14" height="14" />
                            </button>
                            <button
                              className="ad-icon-btn"
                              title="Edit"
                              onClick={() => {
                                setId(entry.id);
                                setEditTitle(entry.name);
                                setEditDescription(entry.description);
                                setEditDate(entry.date ?? "");
                                setEditImages(entry.images ?? []);
                                setOpen(true);
                              }}
                            >
                              <I.edit width="14" height="14" />
                            </button>
                            <button
                              className="ad-icon-btn"
                              title="Archive"
                              onClick={() => handleArchive(entry.id)}
                            >
                              <I.archive width="14" height="14" />
                            </button>
                            <button
                              className="ad-icon-btn ad-icon-btn--danger"
                              title="Move to bin"
                              onClick={() => handleSoftDelete(entry.id)}
                            >
                              <I.trash width="14" height="14" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredActive.length === 0 && (
                      <tr>
                        <td colSpan={7} className="ad-empty">No events found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <TableFoot shown={`1–${filteredActive.length}`} total={filteredActive.length} label="events" />
              </section>
            )}

            {/* ── Archived tab ── */}
            {tab === "archived" && (
              <>
                {sortedTerms.length === 0 && (
                  <p className="ad-empty-state">No archived events.</p>
                )}
                {sortedTerms.map((term) => (
                  <section key={term} className="ad-card" style={{ marginBottom: "1rem" }}>
                    <button
                      className="ad-term-toggle"
                      onClick={() => toggleTerm(term)}
                    >
                      <span>Term {term}</span>
                      <span className="ad-term-meta">
                        {archivedGroups[term].length} item
                        {archivedGroups[term].length !== 1 ? "s" : ""}
                        <I.chev
                          width="14"
                          height="14"
                          style={{
                            transform: isTermOpen(term) ? "rotate(180deg)" : "none",
                            transition: "transform 200ms",
                          }}
                        />
                      </span>
                    </button>
                    {isTermOpen(term) && (
                      <table className="ad-table">
                        <colgroup>
                          <col style={{ width: 44 }} />
                          <col style={{ width: 72 }} />
                          <col />
                          <col style={{ width: 140 }} />
                          <col style={{ width: 130 }} />
                          <col style={{ width: 160 }} />
                        </colgroup>
                        <thead>
                          <tr>
                            <th></th>
                            <th>Photo</th>
                            <th>Title</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th className="ad-th-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {archivedGroups[term].map((entry) => {
                            const status = eventStatus(entry.date);
                            return (
                              <tr
                                key={entry.id}
                                className={active.includes(entry.id) ? "is-selected" : ""}
                              >
                                <td>
                                  <input
                                    type="checkbox"
                                    title={`Select ${entry.name}`}
                                    checked={active.includes(entry.id)}
                                    onChange={() => handleActive(entry.id)}
                                  />
                                </td>
                                <td>
                                  <Thumb
                                    src={entry.images?.[0] || null}
                                    title={entry.name}
                                    kind="image"
                                  />
                                </td>
                                <td>
                                  <div className="ad-title-stack">
                                    <span className="ad-title-link">{entry.name}</span>
                                    <p className="ad-desc">{entry.description}</p>
                                  </div>
                                </td>
                                <td>
                                  <div className="ad-date">
                                    <span className="ad-date-abs">{fmtDate(entry.date)}</span>
                                  </div>
                                </td>
                                <td>
                                  <StatusPill label={status.label} tone={status.tone} />
                                </td>
                                <td className="ad-actions">
                                  <button
                                    className="ad-icon-btn is-on"
                                    title="Restore"
                                    onClick={() => handleRestore(entry.id)}
                                  >
                                    <I.restore width="14" height="14" />
                                  </button>
                                  <button
                                    className="ad-icon-btn ad-icon-btn--danger"
                                    title="Move to bin"
                                    onClick={() => handleSoftDelete(entry.id)}
                                  >
                                    <I.trash width="14" height="14" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </section>
                ))}
              </>
            )}

            {/* ── Bin tab ── */}
            {tab === "bin" && (
              <section className="ad-card">
                <table className="ad-table">
                  <colgroup>
                    <col style={{ width: 72 }} />
                    <col />
                    <col style={{ width: 140 }} />
                    <col style={{ width: 160 }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Photo</th>
                      <th>Name &amp; description</th>
                      <th>Date</th>
                      <th className="ad-th-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((entry) => (
                      <tr key={entry.id}>
                        <td>
                          <Thumb
                            src={entry.images?.[0] || null}
                            title={entry.name}
                            kind="image"
                          />
                        </td>
                        <td>
                          <div className="ad-title-stack">
                            <span className="ad-title-link">{entry.name}</span>
                            <p className="ad-desc">{entry.description}</p>
                          </div>
                        </td>
                        <td>
                          <div className="ad-date">
                            <span className="ad-date-abs">{fmtDate(entry.date)}</span>
                          </div>
                        </td>
                        <td className="ad-actions">
                          <button
                            className="ad-icon-btn is-on"
                            title="Restore"
                            onClick={() => handleRestoreFromBin(entry.id)}
                          >
                            <I.restore width="14" height="14" />
                          </button>
                          <button
                            className="ad-icon-btn ad-icon-btn--danger"
                            title="Permanently delete"
                            onClick={() => {
                              setId(entry.id);
                              setIsModalOpen(true);
                            }}
                          >
                            <I.trash width="14" height="14" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {data.length === 0 && (
                      <tr>
                        <td colSpan={4} className="ad-empty">No items in bin.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <TableFoot shown={`1–${data.length}`} total={data.length} label="items" />
              </section>
            )}
          </>
        )}

        {/* ── Modals ── */}
        {isModalOpen && (
          <div className="ad-modal-overlay">
            <DeleteModal
              isOpen={isModalOpen}
              source="event"
              id={id}
              onClose={() => setIsModalOpen(false)}
              onConfirm={() => {
                setActive((prev) => prev.filter((a) => a !== id));
                fetchData();
              }}
            />
          </div>
        )}

        {open && (
          <div className="ad-modal-overlay">
            <Form
              forType="event"
              id={id}
              initialTitle={editTitle}
              initialDescription={editDescription}
              initialDate={editDate}
              initialImages={editImages}
              setOpen={setOpen}
              onSuccess={fetchData}
            />
          </div>
        )}

        {previewItem && (
          <PublicPreviewModal
            isOpen={true}
            onClose={() => setPreviewItem(null)}
            type="event"
            item={previewItem as unknown as Record<string, unknown>}
          />
        )}
      </main>
    </div>
  );
};

export default Events;
