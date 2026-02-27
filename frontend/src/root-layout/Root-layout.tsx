import { Outlet } from "react-router-dom";
import Navigation from "../components/navigation/Navigation";
import Footer from "../components/footer/Footer";
import { useEffect, useState } from "react";
import fetchBulletinData from "../config/eventsConfig";
import fetchDocuments from "../config/documentsConfig";
import Announcement from "../layout/announcement-section/Announcement";

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

export interface OutletContext {
  bulletin: Announcement[];
  documents: Document[];
}

const Root = () => {
  const [bulletin, setBulletin] = useState<Announcement[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      const [bulletinData, documentsData] = await Promise.all([
        fetchBulletinData(),
        fetchDocuments(),
      ]);

      setBulletin(bulletinData);
      setDocuments(documentsData);
    };

    fetchAll();
  }, []);

  return (
    <div className="relative px-4 md:px-8 lg:px-16 lx:px-32 2xl:px-64 overflow-hidden flex flex-col">
      <Navigation />
      <Outlet context={{ bulletin, documents }} />
      <Footer />
    </div>
  );
};

export default Root;
