import { useState } from 'react';
import eventData from '../../config/eventsConfig.ts';
import './BulletinAnnouncement.css';
import BulletinCard from '../../components/announcement-card-bulletin/Bulletincard';
import Modal from '../../components/modal/Modal.tsx';
import Typography from '../../components/typography/Typography.tsx';

type AnnouncementItem = {
  id: number;
  title: string;
  description: string;
  category: string;
  date?: string;
  image?: string;
  extraImage?: string[];
};

const BulletinAnnouncement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<AnnouncementItem | null>(eventData[0] ?? null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const uniqueCategories = Array.from(
    new Set(eventData.map((ann) => ann.category))
  );

  const categories = [
    { id: 'all', label: 'All Announcements' },
    ...uniqueCategories.map((cat) => ({ id: cat, label: cat })),
  ];

  const filteredAnnouncements = eventData.filter((ann) => {
    const matchCategory =
      selectedCategory === 'all' || selectedCategory === ann.category;

    const matchSearch = ann.title
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());

    return matchCategory && matchSearch;
  });

  const handleView = (ann: AnnouncementItem) => {
    setSelectedAnnouncement(ann);
    setIsModalOpen(true);
  };

  return (
    <section
      id='bulletin-announcements'
      className='bulletin-announcement-page'
      aria-label='Bulletin Announcements Section'
    >
      <div className='bulletin-announcement-header'>
        <Typography size='text-md' color='text-dark'>
          Announcements
        </Typography>
        <Typography size='text-sm' color='text-ghost'>
          Stay updated with the latest announcements, notices, and updates from
          the Central Student Government.
        </Typography>
      </div>

      <div className='bulletin-announcement-layout-wrapper'>
        <div className='bulletin-announcement-layout'>
          {/* Sidebar */}
          <aside className='bulletin-announcement-navigation'>
            <Typography size='text-sm' color='text-dark'>
              Categories
            </Typography>

            <nav
              className='bulletin-announcement-nav-menu'
              aria-label='Announcement Categories'
            >
              {categories.map((category) => (
                <button
                  key={category.id}
                  type='button'
                  className={`bulletin-announcement-nav-item ${
                    selectedCategory === category.id ? 'active' : ''
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Announcement Grid */}
          <main className='bulletin-announcement-main' tabIndex={-1}>
            <div className='bulletin-announcement-grid'>
              {filteredAnnouncements.map((ann) => (
                <BulletinCard
                  key={ann.id}
                  id={ann.id}
                  title={ann.title}
                  description={ann.description}
                  image={ann.image}
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
          imageSrc={selectedAnnouncement.image ?? ''}
          imageAlt={selectedAnnouncement.title}
          title={selectedAnnouncement.title}
          description={selectedAnnouncement.description}
          type='announcement'
          extraImage={selectedAnnouncement.extraImage ?? []}
        />
      )}
    </section>
  );
};

export default BulletinAnnouncement;
