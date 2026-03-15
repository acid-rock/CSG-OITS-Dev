import { useEffect, useState } from 'react';
import eventData from '../../config/eventsConfig';
import Typography from '../../components/typography/Typography';
import AnnouncementCard from '../../components/announcement-card/Announcement-card';
import './announcement.css';
import Modal from '../../components/modal/Modal';

export default function Announcement() {
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [open, setOpen] = useState(false);

  const handleCardClick = (event: any) => {
    setSelectedEvent(event);
    setOpen(true);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        if (prev + 1 >= eventData.length) {
          return 0; 
        }
        return prev + 1; 
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const currentEvent = eventData[currentSlide];

  return (
    <section className='announcement-container'>
      <div className='announcement-layout'>
        <div className='announcement-texts'>
          <Typography size='text-md' color='text-white'>
            Announcements
          </Typography>
          <Typography size='text-sm' color='text-white'>
            Explore official records from student government proceedings
          </Typography>
        </div>

        {/* Slideshow */}
        <div className='announcement-content'>
          {currentEvent && (
            <AnnouncementCard
              title={currentEvent.title}
              description={currentEvent.description}
              date={currentEvent.date}
              image={currentEvent.image}
              variant='default'
              onClick={() => handleCardClick(currentEvent)}
            />
          )}
        </div>
      </div>

      {open && selectedEvent && (
        <Modal
          isOpen={open}
          setOpen={setOpen}
          imageSrc={selectedEvent.image}
          imageAlt={selectedEvent.title}
          date={selectedEvent.date}
          title={selectedEvent.title}
          description={selectedEvent.description}
        ></Modal>
      )}
    </section>
  );
}
