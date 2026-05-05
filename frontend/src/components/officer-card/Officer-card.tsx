import "./officer-card.css";
import { useState, useEffect } from "react";
import { FaFacebook } from "react-icons/fa";

type OfficerCardProps = {
  id?: string;
  title?: string;
  description?: string;
  image?: string;
  socials?: string | null;
  term?: string | null;
  officerType?: string;
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
  officerType,
  variant = "default",
  onClick,
  style,
}: OfficerCardProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [image]);

  const initials = [
    (id ?? "").split(" ")[0]?.[0],
    (id ?? "").split(" ").at(-1)?.[0],
  ]
    .filter(Boolean)
    .join("")
    .toUpperCase();

  const showInitials = !image || imgError;

  return (
    <div
      id={id}
      className={`officer-card ${variant}`}
      style={style}
      onClick={onClick}
    >
      <div className="officer-card-image">
        {showInitials ? (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "#374151",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.4rem",
              fontWeight: 700,
            }}
          >
            {initials || "?"}
          </div>
        ) : (
          <img
            src={image}
            alt={title}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", display: "block" }}
            onError={() => setImgError(true)}
          />
        )}
      </div>
      <div className="officer-card-content">
        <h3>{id}</h3>
        {title && <h3 className="officer-card-title">{title}</h3>}
        {term && (
          <p style={{ fontSize: "0.85rem", color: "inherit", margin: "0.25rem 0 0", textAlign: "center" }}>
            {term}
          </p>
        )}
        {description && (
          <p className="officer-card-description">{description}</p>
        )}
        {officerType !== "adviser" && (
          <div className="officer-card-socials">
            <a
              href={socials || "#"}
              target={socials ? "_blank" : undefined}
              rel={socials ? "noopener noreferrer" : undefined}
              className="social-icon"
              style={!socials ? { opacity: 0.3, cursor: "default" } : undefined}
              onClick={(e) => {
                e.stopPropagation();
                if (!socials) e.preventDefault();
              }}
            >
              <FaFacebook className="fb-icon" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
