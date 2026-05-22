import { Outlet, useLocation } from "react-router-dom";
import Navigation from "../components/navigation/Navigation";
import Footer from "../components/footer/Footer";
import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";

const VITE_API_URL = import.meta.env.VITE_API_URL as string;

// Map public route paths to entity_type values tracked in page_views
const TRACK_MAP: Record<string, string> = {
  "/announcements": "announcement",
  "/documents":     "document",
  "/events":        "event",
};
import fetchBulletinData from "../config/bulletinConfig";
import fetchDocuments from "../config/documentsConfig";
import fetchEvents from "../config/eventConfig";
import fetchOfficers from "../config/officerConfig";
import { fetchOrganizations } from "../config/organizationsConfig";
import type { Organization } from "../config/organizationsConfig";
import fetchCommittees from "../config/committeeConfig";
import type { Committee } from "../config/committeeConfig";
export type { Organization };
export type { Committee };


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
  thumbnail?: string;
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
  committee?: string | null;  // UUID FK → committees.id
  is_committee_official: boolean;
};


export interface OutletContext {
  bulletin: Announcement[];
  documents: Document[];
  events: Event[];
  officers: Officer[];
  organizations: Organization[];
  committees: Committee[];
}

const Root = () => {
  const location = useLocation();
  const lastTracked = useRef<string>("");

  const [bulletin, setBulletin] = useState<Announcement[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [bulletinResult, documentsResult, eventsResult, officersResult, orgsResult, committeesResult] =
      await Promise.allSettled([
        fetchBulletinData(),
        fetchDocuments(),
        fetchEvents(),
        fetchOfficers(),
        fetchOrganizations(),
        fetchCommittees(),
      ]);

    const allFailed = [bulletinResult, documentsResult, eventsResult, officersResult]
      .every((r) => r.status === "rejected");

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
    if (committeesResult.status === "fulfilled") setCommittees(committeesResult.value);

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Content protection: block right-click on images and file download links ──
  // Applied only to the public layout — the admin panel has its own root.
  useEffect(() => {
    const blockContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Block on images
      if (target.tagName === 'IMG') { e.preventDefault(); return; }
      // Block on links that point to files (pdf, jpg, png, etc.)
      const anchor = target.closest('a');
      if (anchor) {
        const href = anchor.getAttribute('href') ?? '';
        if (/\.(pdf|jpg|jpeg|png|gif|webp|svg|mp4|mp3|zip|docx?)(\?|$)/i.test(href)) {
          e.preventDefault();
        }
      }
    };

    const blockDragStart = (e: DragEvent) => {
      if ((e.target as HTMLElement).tagName === 'IMG') e.preventDefault();
    };

    // Block left-click on direct file links and download-attributed links
    const blockLeftClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href') ?? '';
      const hasDownload = anchor.hasAttribute('download');
      // Prevent clicking links that point directly to a file or have download attr
      if (hasDownload || /\.(pdf|jpg|jpeg|png|gif|webp|svg|mp4|mp3|zip|docx?)(\?|$)/i.test(href)) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', blockContextMenu);
    document.addEventListener('dragstart', blockDragStart);
    document.addEventListener('click', blockLeftClick);
    return () => {
      document.removeEventListener('contextmenu', blockContextMenu);
      document.removeEventListener('dragstart', blockDragStart);
      document.removeEventListener('click', blockLeftClick);
    };
  }, []);

  // Fire a section-level page-view event whenever the user navigates to a
  // tracked public route.  This is fire-and-forget — errors are silently
  // swallowed so tracking never breaks a page load.
  useEffect(() => {
    const entityType = TRACK_MAP[location.pathname];
    if (!entityType || entityType === lastTracked.current) return;
    lastTracked.current = entityType;

    axios
      .post(`${VITE_API_URL}/views/track`, { entity_type: entityType })
      .catch(() => { /* non-fatal — backend may not have migration yet */ });
  }, [location.pathname]);

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
      <Outlet context={{ bulletin, documents, events, officers, organizations, committees }} />
      <Footer />
    </div>
  );
};

export default Root;
