import "./officer-card.css";
import { FaFacebook } from "react-icons/fa";

type OfficerCardProps = {
  id?: string;
  title?: string;
  description?: string;
  image?: string;
  socials?: string | null;
  term?: string | null; // school year, e.g. "2025-2026"
  variant?: "default" | "outlined" | "elevated";
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
};

export default function OfficerCard({
  id,
  title,
  description,
  image,
  socials,
  term,
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
        {term && (
          <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: "0.1rem 0 0" }}>
            {term}
          </p>
        )}
        {description && (
          <p className="officer-card-description">{description}</p>
        )}
      </div>
      {socials ? (
        <div className="officer-card-socials">
          <a
            href={socials}
            target="_blank"
            rel="noopener noreferrer"
            className="social-icon"
            onClick={(e) => e.stopPropagation()}
          >
            <FaFacebook className="fb-icon" />
          </a>
        </div>
      ) : null}
    </div>
  );
}
