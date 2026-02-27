import { Outlet } from "react-router-dom";
import Navigation from "../components/navigation/Navigation";
import Footer from "../components/footer/Footer";
import { useEffect, useState } from "react";
import fetchBulletinData from "../config/bulletinConfig";
import fetchDocuments from "../config/documentsConfig";
import Announcement from "../layout/announcement-section/Announcement";
import fetchEvents from "../config/eventConfig";

/*This holds the root-layout to ensure the navigation and Footer to show in all route*/
type Announcement = {
  id: string;
  imgUrl: string;
  title: string;
  content: string;
  date: string;
};

export type Document = {
  id: string;
  name: string;
  description: string;
  category: string;
  url: string;
};

type Event = {
  id: string;
  name: string;
  description: string;
  folder: string;
  date: string;
  images: string[];
};

export interface OutletContext {
  bulletin: Announcement[];
  documents: Document[];
  events: Event[];
}

const Root = () => {
  const [bulletin, setBulletin] = useState<Announcement[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      const [bulletinData, documentsData, eventsData] = await Promise.all([
        fetchBulletinData(),
        fetchDocuments(),
        fetchEvents(),
      ]);

      setBulletin(bulletinData);
      setDocuments(documentsData);
      setEvents(eventsData);
    };

    fetchAll();
  }, []);

  return (
    <div className="relative px-4 md:px-8 lg:px-16 lx:px-32 2xl:px-64 overflow-hidden flex flex-col">
      <Navigation />
      <Outlet context={{ bulletin, documents, events }} />
      <Footer />
    </div>
  );
};

export default Root;
