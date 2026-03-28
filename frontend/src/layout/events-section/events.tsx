import { useState } from 'react';
import eventData from '../../config/eventsConfig';
import Typography from '../../components/typography/Typography';
import './event.css';
import Modal from '../../components/modal/Modal';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import wave from '../../assets/2.svg';

export default function Events() {
  const [open, setOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleCardClick = (index: number) => {
    setSelectedIndex(index);
    setOpen(true);
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % eventData.length);
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + eventData.length) % eventData.length);
  };

  const selectedEvent =
    selectedIndex !== null ? eventData[selectedIndex] : null;
  const current = eventData[currentSlide];

  return (
    <div className='event-container'>
      <div className='event-wave'>
        <img className='wave' src={wave} alt='Wave' />
      </div>
      <div className='event-layout'>
        <div className='event-texts'>
          <Typography size='text-md' color='text-white'>
            Events
          </Typography>

          <Typography size='text-sm' color='text-white'>
            Discover upcoming events, programs, and initiatives led by the CSG.
          </Typography>
        </div>

        {/* Featured Card */}
        <div className='featured-card'>
          <button
            className='featured-arrow featured-arrow--left'
            onClick={handlePrev}
            disabled={currentSlide === 0}
            aria-label='Previous event'
          >
            <ChevronLeft size={24} />
          </button>

          {/* Left: Image */}
          <div className='featured-image-wrap'>
            <img
              src={current.thumbnail}
              alt={current.title}
              className='featured-image'
            />
          </div>

          {/* Right: Content */}
          <div className='featured-content'>
            <h2 className='featured-title'>{current.title}</h2>
            <p className='featured-date'>{current.date}</p>
            <p className='featured-description'>{current.description}</p>
            <button
              className='featured-btn'
              onClick={() => handleCardClick(currentSlide)}
            >
              Learn More
            </button>
          </div>

          <button
            className='featured-arrow featured-arrow--right'
            onClick={handleNext}
            disabled={currentSlide === eventData.length - 1}
            aria-label='Next event'
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Dot indicators */}
        <div className='dot-indicators'>
          {eventData.map((_, i) => (
            <button
              key={i}
              className={`dot ${i === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(i)}
              aria-label={`Go to event ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {open && selectedEvent && (
        <Modal
          isOpen={open}
          setOpen={setOpen}
          imageSrc={selectedEvent.thumbnail}
          imageAlt={selectedEvent.title}
          date={selectedEvent.date}
          title={selectedEvent.title}
          description={selectedEvent.description}
          type='event'
          extraImage={selectedEvent.extraImage}
        />
      )}
    </div>
  );
}
