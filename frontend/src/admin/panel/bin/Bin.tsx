import { useState, useCallback, useEffect } from "react";
import "../_shared/admin-list.css";
import axios from "axios";
import Sidebar from "../_shared/Sidebar";
import { PageHead, Tabs, Toolbar, BulkBar, TableFoot } from "../_shared/chrome";
import { Thumb, Tag } from "../_shared/atoms";
import { I } from "../_shared/icons";
import { fmtDate, timeAgo, purgesIn } from "../_shared/utils";
import { useLockBodyScroll } from "../../../hooks/useLockBodyScroll";

const API_URL = import.meta.env.VITE_API_URL as string;

type BinTab = "bin" | "archived";
type ItemType = "doc" | "ann" | "event" | "officer";
type Tone = "primary" | "warning" | "danger" | "neutral" | "success";

const TYPE_TONE: Record<ItemType, Tone> = {
  ann: "primary",
  doc: "neutral",
  event: "warning",
  officer: "danger",
};
const TYPE_LABEL: Record<ItemType, string> = {
  ann: "Announcement",
  doc: "Document",
  event: "Event",
  officer: "Officer",
};

interface BinItem {
  id: string;
  __type: ItemType;
  name: string;
  imgSrc: string | null;
  deleted_at: string | null;
}

interface ArchivedItem {
  id: string;
  __type: ItemType;
  name: string;
  imgSrc: string | null;
  archived_at?: string | null;
}

interface BinDocument {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  deleted_at: string;
}
interface BinAnnouncement {
  id: string;
  title: string;
  content: string;
  imgUrl?: string;
  deleted_at: string;
}
interface BinEvent {
  id: string;
  name: string;
  description: string;
  images?: string[];
  deleted_at: string;
}
interface BinOfficer {
  id: string;
  full_name: string;
  avatar?: string;
  deleted_at: string;
}

interface ArcDoc {
  id: string;
  name: string;
  thumbnail?: string;
  archived_at?: string;
}
interface ArcAnn {
  id: string;
  title: string;
  imgUrl?: string;
  archived_at?: string;
}
interface ArcEvent {
  id: string;
  name: string;
  images?: string[];
  archived_at?: string;
}
interface ArcOfficer {
  id: string;
  full_name: string;
  position: string | string[];
  year_serving?: string;
  avatar?: string;
}

const Bin = () => {
  const [binTab, setBinTab] = useState<BinTab>("bin");

  /* ── Bin state (deleted_at IS NOT NULL) ── */
  const [docs, setDocs] = useState<BinDocument[]>([]);
  const [announcements, setAnnouncements] = useState<BinAnnouncement[]>([]);
  const [events, setEvents] = useState<BinEvent[]>([]);
  const [binOfficers, setBinOfficers] = useState<BinOfficer[]>([]);

  /* ── Archived state (is_archived=true OR status=archived) ── */
  const [arcDocs, setArcDocs] = useState<ArcDoc[]>([]);
  const [arcAnns, setArcAnns] = useState<ArcAnn[]>([]);
  const [arcEvents, setArcEvents] = useState<ArcEvent[]>([]);
  const [arcOfficers, setArcOfficers] = useState<ArcOfficer[]>([]);

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [, setSpinning] = useState(false);
  const [selected, setSelected] = useState<{ type: ItemType; id: string }[]>(
    [],
  );
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<ItemType | "">("");
  const [sort, setSort] = useState("");

  useLockBodyScroll(confirmBulkDelete);

  /* ── Fetch bin items (deleted_at IS NOT NULL) ── */
  const fetchBin = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    setSelected([]);
    const ts = Date.now();
    try {
      const [docsRes, annRes, eventsRes, offBinRes] = await Promise.allSettled([
        axios.get(`${API_URL}/documents/bin?t=${ts}`, {
          withCredentials: true,
        }),
        axios.get(`${API_URL}/announcements/bin?t=${ts}`, {
          withCredentials: true,
        }),
        axios.get(`${API_URL}/events/bin?t=${ts}`, { withCredentials: true }),
        axios.get(`${API_URL}/officers/bin?t=${ts}`, { withCredentials: true }),
      ]);
      if (offBinRes.status === "fulfilled")
        setBinOfficers(offBinRes.value.data);
      if (docsRes.status === "fulfilled") setDocs(docsRes.value.data);
      if (annRes.status === "fulfilled") setAnnouncements(annRes.value.data);
      if (eventsRes.status === "fulfilled") setEvents(eventsRes.value.data);
    } catch {
      setFetchError("Failed to load bin.");
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Fetch archived items (is_archived=true OR status=archived) ── */
  const fetchArchived = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    setSelected([]);
    const ts = Date.now();
    try {
      const [docsRes, annRes, eventsRes, offRes] = await Promise.allSettled([
        axios.get(`${API_URL}/documents/archived?t=${ts}`, {
          withCredentials: true,
        }),
        axios.get(`${API_URL}/announcements/archived?t=${ts}`, {
          withCredentials: true,
        }),
        axios.get(`${API_URL}/events/archived?t=${ts}`, {
          withCredentials: true,
        }),
        axios.get(`${API_URL}/officers/archived?t=${ts}`, {
          withCredentials: true,
        }),
      ]);
      if (docsRes.status === "fulfilled") setArcDocs(docsRes.value.data);
      if (annRes.status === "fulfilled") setArcAnns(annRes.value.data);
      if (eventsRes.status === "fulfilled") setArcEvents(eventsRes.value.data);
      if (offRes.status === "fulfilled") setArcOfficers(offRes.value.data);
    } catch {
      setFetchError("Failed to load archived items.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (binTab === "bin") fetchBin();
    else fetchArchived();
  }, [binTab, fetchBin, fetchArchived]);

  const handleRefresh = () => {
    setSpinning(true);
    const fn = binTab === "bin" ? fetchBin : fetchArchived;
    fn().finally(() => setTimeout(() => setSpinning(false), 600));
  };

  /* ── Build unified bin list ── */
  const binItems: BinItem[] = [
    ...announcements.map((a) => ({
      id: a.id,
      __type: "ann" as ItemType,
      name: a.title,
      imgSrc: a.imgUrl ?? null,
      deleted_at: a.deleted_at,
    })),
    ...docs.map((d) => ({
      id: d.id,
      __type: "doc" as ItemType,
      name: d.name,
      imgSrc: d.thumbnail ?? null,
      deleted_at: d.deleted_at,
    })),
    ...events.map((e) => ({
      id: e.id,
      __type: "event" as ItemType,
      name: e.name,
      imgSrc: e.images?.[0] ?? null,
      deleted_at: e.deleted_at,
    })),
    ...binOfficers.map((o) => ({
      id: o.id,
      __type: "officer" as ItemType,
      name: o.full_name,
      imgSrc: o.avatar ?? null,
      deleted_at: o.deleted_at,
    })),
  ];

  /* ── Build unified archived list ── */
  const archivedItems: ArchivedItem[] = [
    ...arcAnns.map((a) => ({
      id: a.id,
      __type: "ann" as ItemType,
      name: a.title,
      imgSrc: a.imgUrl ?? null,
      archived_at: a.archived_at,
    })),
    ...arcDocs.map((d) => ({
      id: d.id,
      __type: "doc" as ItemType,
      name: d.name,
      imgSrc: d.thumbnail ?? null,
      archived_at: d.archived_at,
    })),
    ...arcEvents.map((e) => ({
      id: e.id,
      __type: "event" as ItemType,
      name: e.name,
      imgSrc: e.images?.[0] ?? null,
      archived_at: e.archived_at,
    })),
    ...arcOfficers.map((o) => ({
      id: o.id,
      __type: "officer" as ItemType,
      name: o.full_name,
      imgSrc: o.avatar ?? null,
      archived_at: undefined,
    })),
  ];

  const sortItems = <
    T extends {
      name: string;
      deleted_at?: string | null;
      archived_at?: string | null;
    },
  >(
    items: T[],
  ): T[] =>
    [...items].sort((a, b) => {
      if (sort === "Name (A-Z)") return a.name.localeCompare(b.name);
      if (sort === "Name (Z-A)") return b.name.localeCompare(a.name);
      const dateA = a.deleted_at ?? a.archived_at ?? "";
      const dateB = b.deleted_at ?? b.archived_at ?? "";
      if (sort === "Date (Oldest)")
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      return new Date(dateB).getTime() - new Date(dateA).getTime(); // newest first default
    });

  const filteredBin = sortItems(
    binItems
      .filter((i) => !typeFilter || i.__type === typeFilter)
      .filter(
        (i) =>
          !searchQuery ||
          i.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
  );

  const filteredArchived = sortItems(
    archivedItems
      .filter((i) => !typeFilter || i.__type === typeFilter)
      .filter(
        (i) =>
          !searchQuery ||
          i.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
  );

  /* ── Selection helpers ── */
  const toggleSelect = (type: ItemType, id: string) =>
    setSelected((p) =>
      p.find((s) => s.type === type && s.id === id)
        ? p.filter((s) => !(s.type === type && s.id === id))
        : [...p, { type, id }],
    );
  const isSelected = (type: ItemType, id: string) =>
    selected.some((s) => s.type === type && s.id === id);

  /* ── Bin actions ── */
  const restoreFromBin = async (type: ItemType, id: string) => {
    const ep =
      type === "doc"
        ? `${API_URL}/documents/restore-from-bin`
        : type === "ann"
          ? `${API_URL}/announcements/restore-from-bin`
          : type === "officer"
            ? `${API_URL}/officers/restore-from-bin`
            : `${API_URL}/events/restore-from-bin`;
    try {
      // Officers use singleIdSchema {id}; others use {ids:[id]}
      const body = type === "officer" ? { id } : { ids: [id] };
      await axios.post(ep, body, { withCredentials: true });
      if (type === "doc") setDocs((p) => p.filter((d) => d.id !== id));
      if (type === "ann") setAnnouncements((p) => p.filter((a) => a.id !== id));
      if (type === "event") setEvents((p) => p.filter((e) => e.id !== id));
      if (type === "officer")
        setBinOfficers((p) => p.filter((o) => o.id !== id));
    } catch {
      fetchBin();
    }
  };

  const deleteFromBin = async (type: ItemType, id: string) => {
    if (!window.confirm("Permanently delete? This cannot be undone.")) return;
    try {
      if (type === "doc")
        await axios.delete(`${API_URL}/documents/bin/purge`, {
          data: [id],
          withCredentials: true,
        });
      if (type === "ann")
        await axios.delete(`${API_URL}/announcements/delete`, {
          data: { ids: [id] },
          withCredentials: true,
        });
      if (type === "event")
        await axios.delete(`${API_URL}/events/delete`, {
          data: { id },
          withCredentials: true,
        });
      if (type === "officer")
        await axios.delete(`${API_URL}/officers/delete`, {
          data: { ids: [id] },
          withCredentials: true,
        });
      if (type === "doc") setDocs((p) => p.filter((d) => d.id !== id));
      if (type === "ann") setAnnouncements((p) => p.filter((a) => a.id !== id));
      if (type === "event") setEvents((p) => p.filter((e) => e.id !== id));
      if (type === "officer")
        setBinOfficers((p) => p.filter((o) => o.id !== id));
    } catch {
      fetchBin();
    }
  };

  /* ── Archived actions (restore only — no permanent delete) ── */
  const restoreFromArchived = async (type: ItemType, id: string) => {
    const ep =
      type === "officer"
        ? `${API_URL}/officers/restore`
        : type === "doc"
          ? `${API_URL}/documents/restore`
          : type === "ann"
            ? `${API_URL}/announcements/restore`
            : `${API_URL}/events/restore`;
    try {
      // Officers use singleIdSchema {id}; others use {ids:[id]}
      const body = type === "officer" ? { id } : { ids: [id] };
      await axios.post(ep, body, { withCredentials: true });
      if (type === "doc") setArcDocs((p) => p.filter((d) => d.id !== id));
      if (type === "ann") setArcAnns((p) => p.filter((a) => a.id !== id));
      if (type === "event") setArcEvents((p) => p.filter((e) => e.id !== id));
      if (type === "officer")
        setArcOfficers((p) => p.filter((o) => o.id !== id));
    } catch {
      fetchArchived();
    }
  };

  /* ── Bulk handlers ── */
  const bulkRestoreBin = async () => {
    const byType = (t: ItemType) =>
      selected.filter((s) => s.type === t).map((s) => s.id);
    const docIds = byType("doc");
    const annIds = byType("ann");
    const evIds = byType("event");
    const offIds = byType("officer");
    await Promise.allSettled([
      docIds.length &&
        axios.post(
          `${API_URL}/documents/restore-from-bin`,
          { ids: docIds },
          { withCredentials: true },
        ),
      annIds.length &&
        axios.post(
          `${API_URL}/announcements/restore-from-bin`,
          { ids: annIds },
          { withCredentials: true },
        ),
      evIds.length &&
        axios.post(
          `${API_URL}/events/restore-from-bin`,
          { ids: evIds },
          { withCredentials: true },
        ),
      // Officers use singleIdSchema — one call per officer
      ...offIds.map((id) =>
        axios.post(
          `${API_URL}/officers/restore-from-bin`,
          { id },
          { withCredentials: true },
        ),
      ),
    ]);
    if (docIds.length) setDocs((p) => p.filter((d) => !docIds.includes(d.id)));
    if (offIds.length)
      setBinOfficers((p) => p.filter((o) => !offIds.includes(o.id)));
    if (annIds.length)
      setAnnouncements((p) => p.filter((a) => !annIds.includes(a.id)));
    if (evIds.length) setEvents((p) => p.filter((e) => !evIds.includes(e.id)));
    setSelected([]);
  };

  const bulkDelete = async () => {
    const byType = (t: ItemType) =>
      selected.filter((s) => s.type === t).map((s) => s.id);
    const docIds = byType("doc");
    const annIds = byType("ann");
    const evIds = byType("event");
    await Promise.allSettled([
      docIds.length &&
        axios.delete(`${API_URL}/documents/bin/purge`, {
          data: docIds,
          withCredentials: true,
        }),
      annIds.length &&
        axios.delete(`${API_URL}/announcements/delete`, {
          data: annIds.map((id) => ({ id })),
          withCredentials: true,
        }),
      ...evIds.map((id) =>
        axios.delete(`${API_URL}/events/delete`, {
          data: { id },
          withCredentials: true,
        }),
      ),
    ]);
    if (docIds.length) setDocs((p) => p.filter((d) => !docIds.includes(d.id)));
    if (annIds.length)
      setAnnouncements((p) => p.filter((a) => !annIds.includes(a.id)));
    if (evIds.length) setEvents((p) => p.filter((e) => !evIds.includes(e.id)));
    setSelected([]);
    setConfirmBulkDelete(false);
  };

  const bulkRestoreArchived = async () => {
    const byType = (t: ItemType) =>
      selected.filter((s) => s.type === t).map((s) => s.id);
    const docIds = byType("doc");
    const annIds = byType("ann");
    const evIds = byType("event");
    const offIds = byType("officer");
    await Promise.allSettled([
      docIds.length &&
        axios.post(
          `${API_URL}/documents/restore`,
          { ids: docIds },
          { withCredentials: true },
        ),
      annIds.length &&
        axios.post(
          `${API_URL}/announcements/restore`,
          { ids: annIds },
          { withCredentials: true },
        ),
      evIds.length &&
        axios.post(
          `${API_URL}/events/restore`,
          { ids: evIds },
          { withCredentials: true },
        ),
      offIds.length &&
        axios.post(
          `${API_URL}/officers/restore`,
          { ids: offIds },
          { withCredentials: true },
        ),
    ]);
    if (docIds.length)
      setArcDocs((p) => p.filter((d) => !docIds.includes(d.id)));
    if (annIds.length)
      setArcAnns((p) => p.filter((a) => !annIds.includes(a.id)));
    if (evIds.length)
      setArcEvents((p) => p.filter((e) => !evIds.includes(e.id)));
    if (offIds.length)
      setArcOfficers((p) => p.filter((o) => !offIds.includes(o.id)));
    setSelected([]);
  };

  const binTypeOptions = [
    { label: "All types", value: "" },
    { label: "Announcements", value: "ann" },
    { label: "Documents", value: "doc" },
    { label: "Events", value: "event" },
    { label: "Officers", value: "officer" },
  ] as const;

  const arcTypeOptions = [
    { label: "All types", value: "" },
    { label: "Announcements", value: "ann" },
    { label: "Documents", value: "doc" },
    { label: "Events", value: "event" },
    { label: "Officers", value: "officer" },
  ] as const;

  const resetFilters = () => {
    setTypeFilter("");
    setSearchQuery("");
  };

  return (
    <>
      <div className="ad-shell">
        <Sidebar active="bin" />
        <main className="ad-main">
          <PageHead
            title="Bin & Archive"
            subtitle={
              binTab === "bin"
                ? "Deleted items. Automatically purged 30 days after deletion."
                : "Archived items are preserved permanently and never auto-purged."
            }
            actions={
              <button className="ad-btn-ghost" onClick={() => window.print()}>
                <I.print width="14" height="14" />
                Print
              </button>
            }
          />

          {/* ── Main tab switcher ── */}
          <Tabs
            items={[
              {
                label: "Bin",
                active: binTab === "bin",
                count: binItems.length,
              },
              {
                label: "Archived",
                active: binTab === "archived",
                count: archivedItems.length,
              },
            ]}
            onTabChange={(l) => {
              setBinTab(l.toLowerCase() as BinTab);
              resetFilters();
            }}
          />

          <Toolbar
            placeholder={
              binTab === "bin"
                ? "Search deleted items…"
                : "Search archived items…"
            }
            search={searchQuery}
            onSearch={setSearchQuery}
            onRefresh={handleRefresh}
            showSort={false}
          >
            <span className="ad-filter-label">Type</span>
            <select
              className="ad-filter-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ItemType | "")}
            >
              {(binTab === "bin" ? binTypeOptions : arcTypeOptions).map(
                (opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ),
              )}
            </select>
            <span className="ad-filter-label">Sort</span>
            <select
              className="ad-filter-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="">Newest first</option>
              <option value="Date (Oldest)">Oldest first</option>
              <option value="Name (A-Z)">A → Z</option>
              <option value="Name (Z-A)">Z → A</option>
            </select>
          </Toolbar>

          {fetchError && (
            <p style={{ fontSize: 13, color: "var(--color-danger-text)" }}>
              {fetchError}
            </p>
          )}

          {/* ── BIN TAB ── */}
          {binTab === "bin" && (
            <>
              <BulkBar
                count={selected.length}
                actions={["Restore", "Delete"]}
                handlers={{
                  Restore: bulkRestoreBin,
                  Delete: () => setConfirmBulkDelete(true),
                }}
                onClear={() => setSelected([])}
              />

              {loading ? (
                <section className="ad-card">
                  <div className="ad-empty">
                    <p>Loading…</p>
                  </div>
                </section>
              ) : (
                <section className="ad-card">
                  <table className="ad-table">
                    <colgroup>
                      <col style={{ width: 44 }} />
                      <col style={{ width: 140 }} />
                      <col style={{ width: 72 }} />
                      <col />
                      <col style={{ width: 160 }} />
                      <col style={{ width: 140 }} />
                      <col style={{ width: 140 }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>
                          <input
                            type="checkbox"
                            checked={
                              filteredBin.length > 0 &&
                              filteredBin.every((i) =>
                                isSelected(i.__type, i.id),
                              )
                            }
                            onChange={() =>
                              setSelected(
                                filteredBin.every((i) =>
                                  isSelected(i.__type, i.id),
                                )
                                  ? []
                                  : filteredBin.map((i) => ({
                                      type: i.__type,
                                      id: i.id,
                                    })),
                              )
                            }
                          />
                        </th>
                        <th>Type</th>
                        <th>Thumb</th>
                        <th>Name</th>
                        <th>Deleted on</th>
                        <th>Purges</th>
                        <th className="ad-th-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBin.length === 0 && (
                        <tr>
                          <td colSpan={7}>
                            <div className="ad-empty">
                              <I.bin
                                width="32"
                                height="32"
                                style={{
                                  color: "var(--color-text-hint)",
                                  marginBottom: 8,
                                }}
                              />
                              <h3>Bin is empty</h3>
                              <p>
                                Deleted items from Announcements, Documents, and
                                Events appear here.
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                      {filteredBin.map((item) => (
                        <tr
                          key={`bin-${item.__type}-${item.id}`}
                          className={
                            isSelected(item.__type, item.id)
                              ? "is-selected"
                              : ""
                          }
                        >
                          <td>
                            <input
                              type="checkbox"
                              checked={isSelected(item.__type, item.id)}
                              onChange={() =>
                                toggleSelect(item.__type, item.id)
                              }
                            />
                          </td>
                          <td>
                            <Tag
                              label={TYPE_LABEL[item.__type]}
                              tone={TYPE_TONE[item.__type]}
                            />
                          </td>
                          <td>
                            <Thumb
                              src={item.imgSrc}
                              title={item.name}
                              size={44}
                            />
                          </td>
                          <td>
                            <span
                              className={
                                item.__type === "doc"
                                  ? "ad-cell-text ad-mono"
                                  : "ad-cell-text"
                              }
                              title={item.name}
                            >
                              {item.name}
                            </span>
                          </td>
                          <td>
                            {item.deleted_at ? (
                              <div className="ad-date">
                                <span className="ad-date-abs">
                                  {fmtDate(item.deleted_at)}
                                </span>
                                <span className="ad-date-rel">
                                  {timeAgo(item.deleted_at)}
                                </span>
                              </div>
                            ) : (
                              <span className="ad-cell-muted">—</span>
                            )}
                          </td>
                          <td>
                            <span className="ad-cell-muted">
                              {item.deleted_at
                                ? `Purges ${purgesIn(item.deleted_at)}`
                                : "—"}
                            </span>
                          </td>
                          <td className="ad-actions">
                            <button
                              className="ad-icon-btn is-on"
                              title="Restore to Active"
                              onClick={() =>
                                restoreFromBin(item.__type, item.id)
                              }
                            >
                              <I.restore width="14" height="14" />
                            </button>
                            <button
                              className="ad-icon-btn ad-icon-btn--danger"
                              title="Delete permanently"
                              onClick={() =>
                                deleteFromBin(item.__type, item.id)
                              }
                            >
                              <I.trash width="14" height="14" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <TableFoot
                    shown={`1–${filteredBin.length}`}
                    total={binItems.length}
                    label="deleted items"
                  />
                </section>
              )}
            </>
          )}

          {/* ── ARCHIVED TAB ── */}
          {binTab === "archived" && (
            <>
              <BulkBar
                count={selected.length}
                actions={["Restore"]}
                handlers={{ Restore: bulkRestoreArchived }}
                onClear={() => setSelected([])}
              />

              {loading ? (
                <section className="ad-card">
                  <div className="ad-empty">
                    <p>Loading…</p>
                  </div>
                </section>
              ) : (
                <section className="ad-card">
                  <table className="ad-table">
                    <colgroup>
                      <col style={{ width: 44 }} />
                      <col style={{ width: 140 }} />
                      <col style={{ width: 72 }} />
                      <col />
                      <col style={{ width: 180 }} />
                      <col style={{ width: 140 }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>
                          <input
                            type="checkbox"
                            checked={
                              filteredArchived.length > 0 &&
                              filteredArchived.every((i) =>
                                isSelected(i.__type, i.id),
                              )
                            }
                            onChange={() =>
                              setSelected(
                                filteredArchived.every((i) =>
                                  isSelected(i.__type, i.id),
                                )
                                  ? []
                                  : filteredArchived.map((i) => ({
                                      type: i.__type,
                                      id: i.id,
                                    })),
                              )
                            }
                          />
                        </th>
                        <th>Type</th>
                        <th>Thumb</th>
                        <th>Name</th>
                        <th>Archived on</th>
                        <th className="ad-th-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredArchived.length === 0 && (
                        <tr>
                          <td colSpan={6}>
                            <div className="ad-empty">
                              <I.archive
                                width="32"
                                height="32"
                                style={{
                                  color: "var(--color-text-hint)",
                                  marginBottom: 8,
                                }}
                              />
                              <h3>No archived items</h3>
                              <p>
                                Archived announcements, documents, events, and
                                officers appear here.
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                      {filteredArchived.map((item) => (
                        <tr
                          key={`arc-${item.__type}-${item.id}`}
                          className={
                            isSelected(item.__type, item.id)
                              ? "is-selected"
                              : ""
                          }
                        >
                          <td>
                            <input
                              type="checkbox"
                              checked={isSelected(item.__type, item.id)}
                              onChange={() =>
                                toggleSelect(item.__type, item.id)
                              }
                            />
                          </td>
                          <td>
                            <Tag
                              label={TYPE_LABEL[item.__type]}
                              tone={TYPE_TONE[item.__type]}
                            />
                          </td>
                          <td>
                            <Thumb
                              src={item.imgSrc}
                              title={item.name}
                              size={44}
                            />
                          </td>
                          <td>
                            <span
                              className={
                                item.__type === "doc"
                                  ? "ad-cell-text ad-mono"
                                  : "ad-cell-text"
                              }
                              title={item.name}
                            >
                              {item.name}
                            </span>
                          </td>
                          <td>
                            {item.archived_at ? (
                              <div className="ad-date">
                                <span className="ad-date-abs">
                                  {fmtDate(item.archived_at)}
                                </span>
                                <span className="ad-date-rel">
                                  {timeAgo(item.archived_at)}
                                </span>
                              </div>
                            ) : (
                              <span className="ad-cell-muted">—</span>
                            )}
                          </td>
                          <td className="ad-actions">
                            <button
                              className="ad-icon-btn is-on"
                              title="Restore to Active"
                              onClick={() =>
                                restoreFromArchived(item.__type, item.id)
                              }
                            >
                              <I.restore width="14" height="14" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <TableFoot
                    shown={`1–${filteredArchived.length}`}
                    total={archivedItems.length}
                    label="archived items"
                  />
                </section>
              )}
            </>
          )}
        </main>
      </div>

      {/* Bulk delete confirm (Bin tab only) */}
      {confirmBulkDelete && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,41,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setConfirmBulkDelete(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: "24px",
              maxWidth: 400,
              width: "92vw",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 10px", fontWeight: 800 }}>
              Delete {selected.length} item{selected.length !== 1 ? "s" : ""}{" "}
              permanently?
            </h3>
            <p
              style={{
                color: "var(--color-text-muted)",
                fontSize: 13,
                marginBottom: 20,
              }}
            >
              This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                className="ad-btn-ghost"
                onClick={() => setConfirmBulkDelete(false)}
              >
                Cancel
              </button>
              <button
                className="ad-btn-primary"
                style={{
                  background: "var(--color-danger-text)",
                  borderColor: "var(--color-danger-text)",
                }}
                onClick={bulkDelete}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Bin;
