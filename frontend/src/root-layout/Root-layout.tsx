import { Outlet } from "react-router-dom";
import Navigation from "../components/navigation/Navigation";
import Footer from "../components/footer/Footer";
import { useEffect, useState, useCallback } from "react";
import fetchBulletinData from "../config/bulletinConfig";
import fetchDocuments from "../config/documentsConfig";
import fetchEvents from "../config/eventConfig";
import fetchOfficers from "../config/officerConfig";

export type Announcement = {
  id: string;
  imgUrl: string;
  title: string;
  content: string;
  date: string;
  is_pinned?: boolean;
};

export type Document = {
  id: string;
  name: string;
  description: string;
  category: string;
  url: string;
  date: string;
  created_at?: string;
};

type Event = {
  id: string;
  name: string;
  description: string;
  folder: string;
  date: string;
  images: string[];
};

export type Officer = {
  id: string;
  full_name: string;
  position: string | string[];
  avatar: string;
  type: string;
  socials?: string;
  year_serving: string;
  student_number?: string;
  committee?: number;
  is_committee_official: boolean;
};

export interface OutletContext {
  bulletin: Announcement[];
  documents: Document[];
  events: Event[];
  officers: Officer[];
}

const Root = () => {
  const [bulletin, setBulletin] = useState<Announcement[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bulletinData, documentsData, eventsData, officersData] =
        await Promise.all([
          fetchBulletinData(),
          fetchDocuments(),
          fetchEvents(),
          fetchOfficers(),
        ]);

      // Pinned items first; within each group preserve API order (already sorted by created_at desc)
      const sortedBulletin = [...bulletinData].sort((a, b) => {
        if ((a.is_pinned ?? false) && !(b.is_pinned ?? false)) return -1;
        if (!(a.is_pinned ?? false) && (b.is_pinned ?? false)) return 1;
        return 0;
      });
      setBulletin(sortedBulletin);
      setDocuments(documentsData);
      setEvents(eventsData);
      setOfficers(officersData);
    } catch {
      setError(
        "Failed to load content. Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          gap: "1rem",
        }}
      >
        <p>{error}</p>
        <button onClick={fetchAll} style={{ padding: "0.5rem 1.5rem" }}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="relative px-4 md:px-8 lg:px-16 lx:px-32 2xl:px-64 overflow-hidden flex flex-col">
      <Navigation />
      <Outlet context={{ bulletin, documents, events, officers }} />
      <Footer />
    </div>
  );
};

export default Root;
