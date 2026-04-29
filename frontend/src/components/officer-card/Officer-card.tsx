import "./officer-card.css";
import { FaFacebook } from "react-icons/fa";

type OfficerCardProps = {
  id?: string;
  title?: string;
  description?: string;
  image?: string;
  variant?: "default" | "outlined" | "elevated";
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
};

export default function OfficerCard({
  id,
  title,
  image,
  variant = "default",
  onClick,
  style,
}: OfficerCardProps) {
  return (
    <div
      id={id}
      className={`officer-card ${variant}`}
      style={style}
      onClick={onClick}
    >
      {image && (
        <div className="officer-card-image">
          <img src={image} alt={title} />
        </div>
      )}
      <div className="officer-card-content">
        <h3>{id}</h3>
        {title && <h3 className="officer-card-title">{title}</h3>}
      </div>
    </div>
  );
}
