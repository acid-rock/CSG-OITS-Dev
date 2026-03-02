import { Outlet } from "react-router-dom";
import Navigation from "../components/navigation/Navigation";
import Footer from "../components/footer/Footer";
import { useEffect, useState } from "react";
import fetchBulletinData from "../config/bulletinConfig";
import fetchDocuments from "../config/documentsConfig";
import Announcement from "../layout/announcement-section/Announcement";
import fetchEvents from "../config/eventConfig";
import fetchOfficers from "../config/officerConfig";

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
  date: string;
};

type Event = {
  id: string;
  name: string;
  description: string;
  folder: string;
  date: string;
  images: string[];
};

type Officer = {
  id: string;
  full_name: string;
  position: string;
  avatar: string;
  type: string;
  socials?: string;
  year_serving: string;
  student_number?: string;
  committee?: string;
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

  useEffect(() => {
    const fetchAll = async () => {
      const [bulletinData, documentsData, eventsData, officersData] =
        await Promise.all([
          fetchBulletinData(),
          fetchDocuments(),
          fetchEvents(),
          fetchOfficers(),
        ]);

      setBulletin(bulletinData);
      setDocuments(documentsData);
      setEvents(eventsData);
      setOfficers(officersData);
    };

    fetchAll();
  }, []);

  return (
    <div className="relative px-4 md:px-8 lg:px-16 lx:px-32 2xl:px-64 overflow-hidden flex flex-col">
      <Navigation />
      <Outlet context={{ bulletin, documents, events, officers }} />
      <Footer />
    </div>
  );
};

export default Root;
