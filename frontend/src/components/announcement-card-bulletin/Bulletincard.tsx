import "./bulletincard.css";

type BulletinCardProps = {
  id: string;
  title?: string;
  description?: string;
  image?: string;
  date?: string;
  onClick?: () => void;
};

const BulletinCard = ({
  title = "",
  description = "",
  image = "",
  date = "",
  onClick,
}: BulletinCardProps) => {
  return (
    <div className="bulletin-card" onClick={onClick}>
      <div className="bulletin-card-image">
        <img src={image} alt={title || "Announcement"} />
      </div>

      <div className="bulletin-card-content">
        <div className="bulletin-card-info">
          <h3 className="bulletin-card-title">{title}</h3>
          <p className="bulletin-card-description">{description}</p>
        </div>

        <div className="bulletin-card-footer">
          <span className="bulletin-card-date">{date}</span>
          <button
            className="bulletin-card-btn"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            View
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulletinCard;
