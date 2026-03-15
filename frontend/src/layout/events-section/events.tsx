import { useState } from 'react'
import eventData from '../../config/eventsConfig'
import Card from '../../components/event-card/Card'
import Typography from '../../components/typography/Typography'
import './event.css'
import Modal from '../../components/modal/Modal'
import topwave from '../../assets/2.svg'

export default function Events() {
  const [open, setOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const handleCardClick = (index: number) => {
    setSelectedIndex(index)
    setOpen(true)
  }

  const handleNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % eventData.length)
    }
  }

  const handlePrev = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex - 1 + eventData.length) % eventData.length)
    }
  }

  const selectedEvent =
    selectedIndex !== null ? eventData[selectedIndex] : null

  return (
    <div className="event-container">
      <div className="event-layout">

        <div className="wave-image">
          <img className="wave" src={topwave} alt="Wave" />
        </div>

        <div className="event-texts">
          <Typography size="text-md" color="text-white">
            Events
          </Typography>

          <Typography size="text-sm" color="text-white">
            Discover upcoming events, programs, and initiatives led by the CSG.
          </Typography>
        </div>

        <div className="event-grid">
          {eventData.map((event, index) => (
            <div
              key={event.id}
              className="event-card-item"
              onClick={() => handleCardClick(index)}
            >
              <Card
                title={event.title}
                description={event.description}
                date={event.date}
                image={event.image}
                variant="default"
              />
            </div>
          ))}
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
          onNext={handleNext}
          onPrev={handlePrev}
        />
      )}
    </div>
  )
}