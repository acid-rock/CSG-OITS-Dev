import "./officer-card.css";

type OfficerCardProps = {
  id?: string;
  title?: string;
  description?: string;
  image?: string;
<<<<<<< HEAD
  socials?: string | null;
  term?: string | null; // school year, e.g. "2025-2026"
=======
>>>>>>> 8b22842f790adc5614b6daf60635130b967e3062
  variant?: "default" | "outlined" | "elevated";
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
};

export default function OfficerCard({
  id,
  title,
  image,
<<<<<<< HEAD
  socials,
  term,
=======
>>>>>>> 8b22842f790adc5614b6daf60635130b967e3062
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
<<<<<<< HEAD
        {term && (
          <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: "0.1rem 0 0" }}>
            {term}
          </p>
        )}
        {description && (
          <p className="officer-card-description">{description}</p>
        )}
=======
>>>>>>> 8b22842f790adc5614b6daf60635130b967e3062
      </div>
    </div>
  );
}
