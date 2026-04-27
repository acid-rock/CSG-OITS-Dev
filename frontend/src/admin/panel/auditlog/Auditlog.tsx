import { useEffect, useMemo, useState } from "react";
import "./auditlog.css";
import FilterSelect from "../../components/filter/Filter";
import { type AuditLogs } from "../../../root-layout/Root-layout";
import fetchAudit from "../../../config/auditConfig";
import { DateTime } from "luxon";

const filterOptions = ["All", "Today", "This Week", "This Month"];
const sortOptions = [
  "Name (A-Z)",
  "Name (Z-A)",
  "Date (Newest)",
  "Date (Oldest)",
];

const formatDateTime = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const Audit = () => {
  const [spinning, setSpinning] = useState(false);
  const [active, setActive] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>("All");
  const [sort, setSort] = useState<string>("Date (Newest)");
  const [auditData, setAuditData] = useState<AuditLogs[]>([]);

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

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchAudit();
      setAuditData(data);
    };
    fetchData();
  }, []);

  const modifiedData = useMemo(() => {
    const now = DateTime.local();
    const filteredData = auditData.filter((entry) => {
      let entryDate;
      switch (filter) {
        case "All":
          return true;
        case "Today":
          entryDate = DateTime.fromISO(entry.date);
          return entryDate.hasSame(now, "day");

        case "This Week":
          const lastWeek = now.minus({ days: 7 });
          entryDate = DateTime.fromISO(entry.date);
          return entryDate >= lastWeek && entryDate <= now;

        case "This Month":
          const lastMonth = now.minus({ months: 1 });
          entryDate = DateTime.fromISO(entry.date);
          return entryDate >= lastMonth && entryDate <= now;

        default:
          return false;
      }
    });

    const sortedData = [...filteredData].sort((a: AuditLogs, b: AuditLogs) => {
      switch (sort) {
        case "Name (A-Z)":
          return a.fileName.localeCompare(b.fileName);
        case "Name (Z-A)":
          return b.fileName.localeCompare(a.fileName);
        case "Date (Newest)":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "Date (Oldest)":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        default:
          return 0;
      }
    });

    return sortedData;
  }, [auditData, filter, sort]);

  return (
    <div className="audit-container">
      <div className="audit-header">
        <span>Audit Log</span>
      </div>

      <div className="audit-toolbar">
        <span className="audit-file-count">{auditData.length} Entries</span>
        <div className="audit-toolbar-actions">
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
            className="audit-action-btn"
            title="Refresh"
            onClick={handleRefresh}
          >
            <img
              src="/refresh.png"
              alt="refresh"
              className={`refresh-img${spinning ? " audit-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      <div className="audit-file-table">
        <table>
          <colgroup>
            <col className="audit-col-user" />
            <col className="audit-col-filename" />
            <col className="audit-col-description" />
            <col className="audit-col-date" />
          </colgroup>
          <thead>
            <tr className="audit-table-header-light">
              <th>User / Admin</th>
              <th>File Name</th>
              <th>Description</th>
              <th>Date & Time</th>
            </tr>
          </thead>
          <tbody>
            {modifiedData.map((entry, idx) => (
              <tr
                key={idx}
                className={`audit-table-row ${active.includes(entry.fileName) ? "audit-active" : ""}`}
                onClick={() => handleActive(entry.fileName)}
              >
                <td>
                  <div className="audit-user-cell">
                    <span className="audit-user-name">{entry.user}</span>
                    <span className={`audit-role-badge audit-role-admin`}>
                      {entry.role}
                    </span>
                  </div>
                </td>
                <td>{entry.fileName}</td>
                <td>{entry.description}</td>
                <td className="audit-datetime">{formatDateTime(entry.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Audit;
