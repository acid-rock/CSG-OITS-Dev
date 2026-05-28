import "./contenePanel.css";

import Dashboard from "../panel/dashboard/Dashboard";
import Announcement from "../panel/announcement/Announcement";
import Documents from "../panel/documents/Document";
import Contributor from "../panel/contributors/Contributor";
import Audit from "../panel/auditlog/Auditlog";
import Settings from "../panel/settings/Settings";
import Events from "../panel/events/Events";
import OfficersPanel from "../panel/officers/Officers";
import CommitteesPanel from "../panel/committees/Committees";
import Bin from "../panel/bin/Bin";
import BorrowingPanel from "../panel/borrowing/Borrowing";
import OrganizationsPanel from "../panel/organizations/Organizations";
import FinancePanel from "../panel/finance/Finance";
import AdminLogbook from "../panel/logbook/AdminLogbook";
import FeedbackPanel from "../panel/feedback/FeedbackPanel";

const panel = [
  { name: "dashboard", content: <Dashboard /> },
  { name: "announcement", content: <Announcement /> },
  { name: "documents", content: <Documents /> },
  { name: "events", content: <Events /> },
  { name: "officers", content: <OfficersPanel /> },
  { name: "committees", content: <CommitteesPanel /> },
  { name: "borrowing", content: <BorrowingPanel /> },
  { name: "auditlog", content: <Audit /> },
  { name: "contributors", content: <Contributor /> },
  { name: "settings", content: <Settings /> },
  { name: "bin", content: <Bin /> },
  { name: "organizations", content: <OrganizationsPanel /> },
  { name: "finance",       content: <FinancePanel /> },
  { name: "logbook",       content: <AdminLogbook /> },
  { name: "feedback",      content: <FeedbackPanel /> },
];

const ContentPanel = ({ active }: { active: string | null }) => {
  return panel.find((p) => p.name === active)?.content ?? null;
};

export default ContentPanel;
