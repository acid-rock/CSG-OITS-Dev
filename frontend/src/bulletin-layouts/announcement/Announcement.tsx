import './Announcemnet.css'
import Typography from '../../components/typography/Typography'
import eventData from '../../config/eventsConfig'
import { useState } from 'react'
import DocumentCard from '../../components/document-card/Document-card'

const Announcement = () => {

const [selectedCategory, setSelectedCategory] = useState('');

const uniqueCategories = [
  ...new Set(
    eventData.map((item) =>
      new Date(item.date).toLocaleString('default', { month: 'long' })
    )
  ),
].map((month, index) => ({ id: index, label: month }));

  return (
    <div className='bulletin-announcement-container'>
            <div className='bulletin-announcement-header'>
              <Typography size='text-md' color='text-dark'>
                Annoucements
              </Typography>
              <Typography size='text-sm' color='text-ghost'>
                Access the latest announcements and proceedings of the Central Student Government
              </Typography>
            </div>

            <div className='bulletin-announcement-layout-wrapper'>
  <div className='bulletin-announcement-layout'>
    {/* Sidebar Navigation */}
   <aside className='bulletin-announcement-navigation'>
  <Typography size='text-sm' color='text-dark'>
    Categories
  </Typography>
  <nav className='bulletin-nav-menu'>
    {uniqueCategories.map((category) => (
      <button
        key={category.id}
        type='button'
        className={`bulletin-nav-item ${
          selectedCategory === category.label ? 'active' : ''
        }`}
        onClick={() => setSelectedCategory(category.label)}
      >
        {category.label}
      </button>
    ))}
  </nav>
</aside>

    {/* Announcement Grid */}
    <main className='bulletin-announcement-content'>
      <div className='bulletin-announcement-grid'>
        {eventData.map((doc) => (
          <DocumentCard
            key={doc.id}
            id={doc.id}
            title={doc.title}
            description={doc.description}
            date={doc.date}
          />
        ))}
      </div>
    </main>
  </div>
</div>
    </div>
  )
}

export default Announcement
