import "./announcement-card.css";
import { useState, useEffect } from "react";
import Button from "../button/Button";

type AnnouncementCardProps = {
  id?: string;
  title?: string;
  description?: string;
  image?: string;
  date?: string;
  variant?: "default" | "outlined" | "elevated";
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  items?: Array<{
    title?: string;
    description?: string;
    image?: string;
    date?: string;
  }>;
};

export default function AnnouncementCard({
  id,
  title = "",
  description = "",
  image = "",
  date = "",
  variant = "default",
  onClick,
  style,
  items = [],
}: AnnouncementCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const displayItems =
    items.length > 0 ? items : [{ title, description, image, date }];
  const currentItem = displayItems[currentIndex];

  useEffect(() => {
    if (displayItems.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayItems.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [displayItems.length]);

  const handleLearnMore = () => {
    console.log("Learn more clicked for:", currentItem.title);
  };

  return (
    <div
      id={id}
      className={`site-announce-card ${variant}`}
      style={style}
      onClick={onClick}
    >
      <div className="site-announce-card-image">
        <img
          src={currentItem.image}
          alt={currentItem.title || "Announcement"}
        />
      </div>

      <div className="site-announce-card-content">
        <div className="site-announce-card-top">
          <h3 className="site-announce-card-title">{currentItem.title}</h3>
          <p className="site-announce-card-date">{currentItem.date}</p>
        </div>

        <div className="site-announce-card-bottom">
          <p className="site-announce-card-description">
            {currentItem.description}
          </p>
          <Button
            variant="primary"
            id="learnmore"
            onClick={handleLearnMore}
            style={{ padding: ".75rem" }}
          >
            Learn More
          </Button>
        </div>
      </div>
    </div>
  );
}
