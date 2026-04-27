import "./dashboard.css";
import { useEffect, useState } from "react";
import Barcharts from "../../components/charts/bar-chart/Barchart";
import Linechart from "../../components/charts/line-chart/Linechart";
import fetchAudit from "../../../config/auditConfig";
import type { AuditLogs } from "../../../root-layout/Root-layout";

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

const Dashboard = () => {
  const [active, setActive] = useState<string[]>([]);
  const [auditData, setAuditData] = useState([]);

  const handleActive = (fileName: string) => {
    setActive((prev) =>
      prev.includes(fileName)
        ? prev.filter((name) => name !== fileName)
        : [...prev, fileName],
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchAudit(5);
      setAuditData(data);
    };
    fetchData();
  }, []);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <span>Dashboard</span>
        <p>
          {new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </p>
      </div>
      <div className="dashboard-content">
        {/*graph div*/}
        <div className="graph-container">
          <Barcharts />
          <Linechart />
        </div>

        {/*file table div*/}
        <div className="dashboard-file-table">
          <span>Recent Activity</span>
          <table>
            <thead>
              <tr className="table-header-black">
                <th>User / Admin</th>
                <th>File Name</th>
                <th>Description</th>
                <th>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {auditData.map((entry: AuditLogs, idx) => (
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
                  <td className="audit-datetime">
                    {formatDateTime(entry.date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
