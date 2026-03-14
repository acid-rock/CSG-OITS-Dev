import { useState, useMemo } from 'react';
import eventData from '../../config/eventsConfig';
import Card from '../../components/event-card/Card';
import Typography from '../../components/typography/Typography';
import './event.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '../../components/modal/Modal';

export default function Events() {
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [open, setOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null); // Add state for selected event
  const EVENTS_PER_SLIDE = 4;

  /*function to take all the event object and group into 4*/
  const eventSlides = useMemo(() => {
    const slides = [];
    for (let i = 0; i < eventData.length; i += EVENTS_PER_SLIDE) {
      slides.push(eventData.slice(i, i + EVENTS_PER_SLIDE));
    }
    return slides;
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => Math.min(prev + 1, eventSlides.length - 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  };

  // Function to handle card click
  const handleCardClick = (event: any) => {
    setSelectedEvent(event);
    setOpen(true);
  };

  return (
    <div className='event-container'>
      <div className='event-layout'>
        <div className='event-texts'>
          <Typography size='text-md' color='text-dark'>
            Events
          </Typography>
          <Typography size='text-sm' color='text-ghost'>
            Explore official events from students government
          </Typography>
        </div>

        <div className='carousel-wrapper'>
          <div
            className='carousel-track'
            style={{
              transform: `translateX(-${currentSlide * 100}%)`,
            }}
          >
            {eventSlides.map((slide, slideIndex) => (
              <div key={slideIndex} className='carousel-slide'>
                <div className='card-container'>
                  {slide.map((event, index) => (
                    <div
                      key={event.id}
                      className={`card-item-${index}`}
                      onClick={() => handleCardClick(event)}
                      style={{ cursor: 'pointer' }} // Make it clear it's clickable
                    >
                      <Card
                        title={event.title}
                        description={event.description}
                        date={event.date}
                        image={event.image}
                        variant='default'
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className='carousel-controls'>
            <button
              className='event-button'
              type='button'
              onClick={prevSlide}
              aria-label='Previous slide'
              title='Previous slide'
              disabled={currentSlide === 0}
            >
              <ChevronLeft size={30} />
            </button>
            <button
              className='event-button'
              type='button'
              onClick={nextSlide}
              aria-label='next slide'
              title='next slide'
              disabled={currentSlide === eventSlides.length - 1}
            >
              <ChevronRight size={30} />
            </button>
          </div>
          <div className='dot-indicators'>
            {eventSlides.map((_, index) => (
              <button
                key={index}
                type='button'
                aria-label={`Go to slide ${index + 1}`}
                className={`dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
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
    </div>
  );
}
