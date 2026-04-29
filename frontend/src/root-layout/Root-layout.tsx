import { Outlet } from "react-router-dom";
import Navigation from "../components/navigation/Navigation";
import Footer from "../components/footer/Footer";
import { useState, useEffect } from "react";
import fetchAudit from "../config/auditConfig";
import fetchBulletinData from "../config/bulletinConfig";
import fetchDocuments from "../config/documentsConfig";
import fetchEvents from "../config/eventConfig";
import fetchInventory from "../config/inventoryConfig";
import fetchOfficers from "../config/officerConfig";
import { usePageTracking } from "../hooks/usePageTracking";

/*This holds the root-layout to ensure the navigation and Footer to show in all route*/
export type Announcement = {
  id: string;
  imgUrl: string;
  title: string;
  content: string;
  date: string;
  is_archived?: boolean;
};

export type Document = {
  is_archived: boolean;
  id: string;
  name: string;
  description: string;
  category: string;
  url: string;
  date: string;
};

export type AuditLogs = {
  user: string;
  role: "Admin";
  imageName: string;
  fileName: string;
  description: string;
  date: string;
};

export type Event = {
  is_archived: boolean;
  id: string;
  created_at: string;
  name: string;
  description: string;
  date: string;
  images: string[];
};

export type Officer = {
  id: string;
  full_name: string;
  position: string;
  avatar: string;
  type: string;
  socials?: string;
  year_serving: string;
  student_number?: string;
  committee?: number;
  is_committee_official: boolean;
};

export type Inventory = {
  id: string;
  name: string;
  quantity: number;
  max_quantity: number;
  status: string;
};

export interface OutletContext {
  bulletin: Announcement[];
  documents: Document[];
  events: Event[];
  officers: Officer[];
  auditLogs: AuditLogs[];
  inventory: Inventory[];
}

const Root = () => {
  // Tracking hook
  usePageTracking();

  const [bulletin, setBulletin] = useState<Announcement[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [officers, setOfficers] = useState<Officer[]>();
  const [auditLogs, setAuditLogs] = useState<AuditLogs[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      const [bulletinData, documentsData, eventsData, officersData] =
        await Promise.all([
          fetchBulletinData(),
          fetchDocuments(),
          fetchEvents(),
          fetchOfficers(),
          fetchAudit(),
          fetchInventory(),
        ]);

      setBulletin(bulletinData);
      setDocuments(documentsData);
      setEvents(eventsData);
      setOfficers(officersData);
      setAuditLogs(auditLogs);
      setInventory(inventory);
    };

    fetchAll();
  }, []);

  return (
    <div className="relative px-4 md:px-8 lg:px-16 lx:px-32 2xl:px-64 overflow-hidden flex flex-col">
      <Navigation />
      <Outlet
        context={{
          bulletin,
          documents,
          events,
          officers,
          auditLogs,
          inventory,
        }}
      />
      <Footer />
    </div>
  );
};

export default Root;
