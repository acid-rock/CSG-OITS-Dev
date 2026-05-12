import { Outlet } from "react-router-dom";
import Navigation from "../components/navigation/Navigation";
import Footer from "../components/footer/Footer";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import fetchBulletinData from "../config/bulletinConfig";
import fetchDocuments from "../config/documentsConfig";
import fetchEvents from "../config/eventConfig";
import fetchOfficers from "../config/officerConfig";

const API_URL = import.meta.env.VITE_API_URL as string;

export type Announcement = {
  id: string;
  imgUrl: string;
  title: string;
  content: string;
  date: string;
  created_at?: string;
  is_pinned?: boolean;
  category?: string;
};

export type Document = {
  id: string;
  name: string;
  description: string;
  category: string;
  url: string;
  date: string;
  created_at?: string;
  term?: string | null;
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

export type Organization = {
  id: string;
  name: string;
  description: string | null;
  logo_path: string | null;
  facebook_link: string | null;
  created_at: string;
};

export interface OutletContext {
  bulletin: Announcement[];
  documents: Document[];
  events: Event[];
  officers: Officer[];
  organizations: Organization[];
}

const Root = () => {
  const [bulletin, setBulletin] = useState<Announcement[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Fetch active term for officer filtering (silent fail — fallback: no filter)
    let activeTerm: string | undefined;
    try {
      const { data } = await axios.get(`${API_URL}/settings/term`);
      activeTerm = data?.value || undefined;
    } catch {
      activeTerm = undefined;
    }

    const [bulletinResult, documentsResult, eventsResult, officersResult, orgsResult] =
      await Promise.allSettled([
        fetchBulletinData(),
        fetchDocuments(),
        fetchEvents(),
        fetchOfficers(undefined, undefined, activeTerm),
        axios.get(`${API_URL}/organizations`).then((r) => r.data as Organization[]),
      ]);

    const allFailed = [bulletinResult, documentsResult, eventsResult, officersResult]
      .every((r) => r.status === "rejected"); // organizations failure is non-fatal

    if (allFailed) {
      setError("Unable to load content. Please refresh the page or try again later.");
      setLoading(false);
      return;
    }

    if (bulletinResult.status === "fulfilled") {
      const sortedBulletin = [...bulletinResult.value].sort((a, b) => {
        if ((a.is_pinned ?? false) && !(b.is_pinned ?? false)) return -1;
        if (!(a.is_pinned ?? false) && (b.is_pinned ?? false)) return 1;
        return 0;
      });
      setBulletin(sortedBulletin);
    }
    if (documentsResult.status === "fulfilled") setDocuments(documentsResult.value);
    if (eventsResult.status === "fulfilled") setEvents(eventsResult.value);
    if (officersResult.status === "fulfilled") setOfficers(officersResult.value as Officer[]);
    if (orgsResult.status === "fulfilled") setOrganizations(orgsResult.value);

    setLoading(false);
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
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <p style={{ color: "#374151", fontSize: "1rem" }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{ padding: "0.5rem 1.5rem", borderRadius: 8, border: "1px solid #d1d5db", cursor: "pointer" }}
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="relative px-4 md:px-8 lg:px-16 lx:px-32 2xl:px-64 overflow-hidden flex flex-col">
      <Navigation />
      <Outlet context={{ bulletin, documents, events, officers, organizations }} />
      <Footer />
    </div>
  );
};

export default Root;
