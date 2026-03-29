import { useState } from 'react';
import eventData from '../../config/eventsConfig';
import './BulletinAnnouncement.css';
import BulletinCard from '../../components/announcement-card-bulletin/Bulletincard';

const BulletinAnnouncement = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = eventData.filter((item) => {
    const matchSearch = item.title
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());

    return matchSearch;
  });

  return (
    <div className='announcement-page'>
      {/* Header */}
      <div className='announcement-header'>
        <h1>Announcements</h1>
        <p>
          Access the latest announcements and proceedings of the Central Student
          Government.
        </p>
      </div>

      {/* Search Bar */}
      <div className='announcement-search-wrapper'>
        <input
          className='announcement-search-input'
          type='text'
          placeholder='Search announcements…'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Body */}
      <div className='announcement-body'>
        {/* Main */}
        <main className='announcement-main'>
          {filtered.length === 0 ? (
            <div className='announcement-empty'>
              <p className='announcement-empty-title'>No announcements found</p>
              <p className='announcement-empty-sub'>
                Try a different search term or category.
              </p>
            </div>
          ) : (
            <div className='announcement-grid'>
              {filtered.map((item) => (
                <BulletinCard
                  id={item.id}
                  title={item.title}
                  description={item.description}
                  image={item.image}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default BulletinAnnouncement;
