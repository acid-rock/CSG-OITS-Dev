import { useState } from "react";
import "./BulletinAnnouncement.css";
import BulletinCard from "../../components/announcement-card-bulletin/Bulletincard";
import Modal from "../../components/modal/Modal.tsx";
import Typography from "../../components/typography/Typography.tsx";
import { useOutletContext } from "react-router-dom";
import type {
  Announcement,
  OutletContext,
} from "../../root-layout/Root-layout.tsx";

const BulletinAnnouncement = () => {
  const { bulletin } = useOutletContext<OutletContext>();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(bulletin[0] ?? null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredAnnouncements = bulletin.filter((ann) => {
    const matchSearch = ann.title
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());

    return matchSearch;
  });

  const handleView = (ann: Announcement) => {
    setSelectedAnnouncement(ann);
    setIsModalOpen(true);
  };

  return (
    <section
      id="bulletin-announcements"
      className="bulletin-announcement-page"
      aria-label="Bulletin Announcements Section"
    >
      <div className="bulletin-announcement-header">
        <Typography size="text-md" color="text-dark">
          Announcements
        </Typography>
        <Typography size="text-sm" color="text-ghost">
          Stay updated with the latest announcements, notices, and updates from
          the Central Student Government.
        </Typography>
      </div>

      <div className="bulletin-announcement-layout-wrapper">
        <div className="bulletin-announcement-layout">
          {/* Announcement Grid */}
          <main className="bulletin-announcement-main" tabIndex={-1}>
            <div className="bulletin-announcement-grid">
              {bulletin.map((ann) => (
                <BulletinCard
                  key={ann.id}
                  id={ann.id}
                  title={ann.title}
                  description={ann.content}
                  image={ann.imgUrl}
                  onClick={() => handleView(ann)}
                />
              ))}
            </div>
          </main>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && selectedAnnouncement && (
        <Modal
          isOpen={isModalOpen}
          setOpen={setIsModalOpen}
          imageSrc={selectedAnnouncement.imgUrl ?? ""}
          imageAlt={selectedAnnouncement.title}
          title={selectedAnnouncement.title}
          description={selectedAnnouncement.content}
          type="announcement"
        />
      )}
    </section>
  );
};

export default BulletinAnnouncement;
