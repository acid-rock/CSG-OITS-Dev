import { useState, useEffect, useCallback } from "react";
import "../_shared/admin-list.css";
import Sidebar from "../_shared/Sidebar";
import { PageHead, Tabs, Toolbar, TableFoot } from "../_shared/chrome";
import { Thumb, Tag, MiniAvatar } from "../_shared/atoms";
import { I } from "../_shared/icons";
import { timeAgo, fmtDate, shortId, formatTypeLabel } from "../_shared/utils";
import Form from "../../components/form/Form";
import DeleteModal from "../../components/modals/deleteModal/DeleteModal";
import PublicPreviewModal from "../../components/modals/PublicPreviewModal/PublicPreviewModal";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL as string;

interface DocumentEntry {
  id: string;
  name: string;
  description: string;
  category: string;
  createdAt: string;
  url: string;
  thumbnail: string;
  owner_id?: string;
  term?: string;
  deleted_at?: string;
}

type Tab = "active" | "archived" | "bin";

const groupByTerm = (
  items: DocumentEntry[],
): Record<string, DocumentEntry[]> => {
  const groups: Record<string, DocumentEntry[]> = {};
  items.forEach((item) => {
    const year = item.deleted_at
      ? new Date(item.deleted_at).getFullYear()
      : new Date().getFullYear();
    const term = `${year}-${year + 1}`;
    if (!groups[term]) groups[term] = [];
    groups[term].push(item);
  });
  return groups;
};

const Documents = () => {
  const [tab, setTab] = useState<Tab>("active");
  const [data, setData] = useState<DocumentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [spinning, setSpinning] = useState(false);
  const [active, setActive] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editType, setEditType] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openTerms, setOpenTerms] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [previewItem, setPreviewItem] = useState<DocumentEntry | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    setActive([]);
    try {
      const endpoint =
        tab === "archived"
          ? `${API_URL}/documents/archived?t=${Date.now()}`
          : tab === "bin"
            ? `${API_URL}/documents/bin?t=${Date.now()}`
            : `${API_URL}/documents`;
      const { data: responseData } = await axios.get<DocumentEntry[]>(
        endpoint,
        { withCredentials: true },
      );
      setData(
        Array.isArray(responseData)
          ? responseData
          : ((responseData as Record<string, unknown>).data as DocumentEntry[] ?? []),
      );
    } catch (err: unknown) {
      setFetchError(
        err instanceof Error ? err.message : "Failed to load documents.",
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
        ? prev.filter((i) => i !== entryId)
        : [...prev, entryId],
    );

  const handleRefresh = () => {
    setSpinning(true);
    fetchData().finally(() => setTimeout(() => setSpinning(false), 600));
  };

  const handleArchive = async (entryId: string) => {
    await axios.post(
      `${API_URL}/documents/archive`,
      { ids: [entryId] },
      { withCredentials: true },
    );
    fetchData();
  };

  const handleSoftDelete = async (entryId: string) => {
    try {
      await axios.post(
        `${API_URL}/documents/bin`,
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
      `${API_URL}/documents/restore`,
      { ids: [entryId] },
      { withCredentials: true },
    );
    setData((prev) => prev.filter((d) => d.id !== entryId));
    fetchData();
  };

  const handlePermanentDelete = async (entryId: string) => {
    if (!window.confirm("Permanently delete this item? This cannot be undone."))
      return;
    try {
      await axios.delete(`${API_URL}/documents/delete`, {
        data: [{ id: entryId }],
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

  const toggleTerm = (term: string) =>
    setOpenTerms((prev) => ({ ...prev, [term]: !prev[term] }));

  const docTypes = [...new Set(data.map((d) => d.category).filter(Boolean))].sort();

  const archivedGroups = tab === "archived" ? groupByTerm(data) : {};
  const sortedTerms = Object.keys(archivedGroups).sort((a, b) =>
    b.localeCompare(a),
  );
  const isTermOpen = (term: string) =>
    openTerms[term] !== undefined ? openTerms[term] : term === sortedTerms[0];

  const filteredActive = data
    .filter(
      (entry) =>
        !filter ||
        filter === "All" ||
        formatTypeLabel(entry.category ?? "") === filter,
    )
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
      <Sidebar active="documents" />
      <main className="ad-main">
        <PageHead
          title="Documents"
          subtitle="Upload resolutions, memos, minutes, proposals, and excuse letters. Files appear on the public Documents page when active."
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
                    setSelectedName(null);
                    setEditTitle("");
                    setEditDescription("");
                    setEditType("");
                    setOpen(true);
                  }}
                >
                  <I.upload width="14" height="14" />
                  Upload document
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
          placeholder="Search documents by file name, description, or term…"
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
            <option value="">All types</option>
            {docTypes.map((t) => (
              <option key={t} value={formatTypeLabel(t)}>
                {formatTypeLabel(t)}
              </option>
            ))}
          </select>
        </Toolbar>

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
                      <th>Thumb</th>
                      <th>File &amp; description</th>
                      <th>Author</th>
                      <th>Uploaded</th>
                      <th className="ad-th-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActive.map((entry) => (
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
                          <Thumb src={entry.thumbnail || null} title={entry.name} kind="doc" />
                        </td>
                        <td>
                          <div className="ad-title-stack">
                            <div className="ad-title-row">
                              <Tag label={formatTypeLabel(entry.category ?? "Document")} tone="primary" />
                              <span className="ad-title-link ad-mono">{entry.name}</span>
                            </div>
                            <p className="ad-desc">{entry.description}</p>
                            <div className="ad-meta">
                              {entry.term && <span className="ad-mono">{entry.term}</span>}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="ad-author">
                            <MiniAvatar name={entry.owner_id ? shortId(entry.owner_id) : "Admin"} />
                            <span>{entry.owner_id ? shortId(entry.owner_id) : "Admin"}</span>
                          </div>
                        </td>
                        <td>
                          <div className="ad-date">
                            <span className="ad-date-abs">{fmtDate(entry.createdAt)}</span>
                            <span className="ad-date-rel">{timeAgo(entry.createdAt)}</span>
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
                          {entry.url && (
                            <a
                              href={entry.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ad-icon-btn"
                              title="Download"
                            >
                              <I.download width="14" height="14" />
                            </a>
                          )}
                          <button
                            className="ad-icon-btn"
                            title="Edit"
                            onClick={() => {
                              setId(entry.id);
                              setSelectedName(entry.name);
                              setEditTitle(entry.name);
                              setEditDescription(entry.description);
                              setEditType(entry.category);
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
                    ))}
                    {filteredActive.length === 0 && (
                      <tr>
                        <td colSpan={6} className="ad-empty">No documents found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <TableFoot shown={`1–${filteredActive.length}`} total={filteredActive.length} label="documents" />
              </section>
            )}

            {/* ── Archived tab ── */}
            {tab === "archived" && (
              <>
                {sortedTerms.length === 0 && (
                  <p className="ad-empty-state">No archived documents.</p>
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
                          <col style={{ width: 160 }} />
                        </colgroup>
                        <thead>
                          <tr>
                            <th></th>
                            <th>Thumb</th>
                            <th>File &amp; description</th>
                            <th>Uploaded</th>
                            <th className="ad-th-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {archivedGroups[term].map((entry) => (
                            <tr key={entry.id}>
                              <td>
                                <input
                                  type="checkbox"
                                  title={`Select ${entry.name}`}
                                  checked={active.includes(entry.id)}
                                  onChange={() => handleActive(entry.id)}
                                />
                              </td>
                              <td>
                                <Thumb src={entry.thumbnail || null} title={entry.name} kind="doc" />
                              </td>
                              <td>
                                <div className="ad-title-stack">
                                  <div className="ad-title-row">
                                    <Tag label={formatTypeLabel(entry.category ?? "Document")} tone="primary" />
                                    <span className="ad-title-link ad-mono">{entry.name}</span>
                                  </div>
                                  <p className="ad-desc">{entry.description}</p>
                                </div>
                              </td>
                              <td>
                                <div className="ad-date">
                                  <span className="ad-date-abs">{fmtDate(entry.createdAt)}</span>
                                </div>
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
                          ))}
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
                    <col style={{ width: 44 }} />
                    <col style={{ width: 72 }} />
                    <col />
                    <col style={{ width: 140 }} />
                    <col style={{ width: 160 }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th></th>
                      <th>Thumb</th>
                      <th>File &amp; description</th>
                      <th>Uploaded</th>
                      <th className="ad-th-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((entry) => (
                      <tr key={entry.id}>
                        <td></td>
                        <td>
                          <Thumb src={entry.thumbnail || null} title={entry.name} kind="doc" />
                        </td>
                        <td>
                          <div className="ad-title-stack">
                            <div className="ad-title-row">
                              <Tag label={formatTypeLabel(entry.category ?? "Document")} tone="primary" />
                              <span className="ad-title-link ad-mono">{entry.name}</span>
                            </div>
                            <p className="ad-desc">{entry.description}</p>
                          </div>
                        </td>
                        <td>
                          <div className="ad-date">
                            <span className="ad-date-abs">{fmtDate(entry.createdAt)}</span>
                          </div>
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
                            title="Permanently delete"
                            onClick={() => handlePermanentDelete(entry.id)}
                          >
                            <I.trash width="14" height="14" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {data.length === 0 && (
                      <tr>
                        <td colSpan={5} className="ad-empty">No items in bin.</td>
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
        {open && (
          <div className="ad-modal-overlay">
            <Form
              forType="document"
              id={id}
              initialTitle={editTitle}
              initialDescription={editDescription}
              initialType={editType}
              setOpen={setOpen}
              onSuccess={fetchData}
            />
          </div>
        )}

        {isModalOpen && (
          <div className="ad-modal-overlay">
            <DeleteModal
              isOpen={isModalOpen}
              source="document"
              id={id}
              name={selectedName}
              onClose={() => setIsModalOpen(false)}
              onConfirm={() => {
                setActive((prev) => prev.filter((a) => a !== id));
                fetchData();
              }}
            />
          </div>
        )}

        {previewItem && (
          <PublicPreviewModal
            isOpen={true}
            onClose={() => setPreviewItem(null)}
            type="document"
            item={previewItem as unknown as Record<string, unknown>}
          />
        )}
      </main>
    </div>
  );
};

export default Documents;
