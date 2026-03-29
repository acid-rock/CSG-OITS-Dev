import React, { useState, useEffect } from "react";
import "./modal.css";

interface ModalProps {
  isOpen: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  imageSrc: string;
  imageAlt: string;
  date: string;
  title: string;
  description: string;
  type?: string;
  extraImage?: string[];
  currentIndex?: number;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  setOpen,
  imageSrc,
  imageAlt,
  date,
  title,
  description,
  type,
  extraImage,
}) => {
  const [imageIndex, setImageIndex] = useState<number>(0);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) setOpen(false);
  };

  const handleNext = () => {
    if (extraImage) {
      setImageIndex((prev) => (prev + 1) % extraImage.length);
    }
  };

  const handlePrevious = () => {
    if (extraImage) {
      setImageIndex(
        (prev) => (prev - 1 + extraImage.length) % extraImage.length,
      );
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-container">
        <button className="modal-close-btn" onClick={() => setOpen(false)}>
          ×
        </button>

        <div className="modal-image-section">
          {extraImage && extraImage.length > 0 ? (
            <img
              src={extraImage[imageIndex]}
              alt={imageAlt}
              className="modal-image"
            />
          ) : (
            imageSrc && (
              <img src={imageSrc} alt={imageAlt} className="modal-image" />
            )
          )}

          {type === "event" && (
            <>
              <button
                className="modal-arrow left"
                aria-label="Previous"
                onClick={handlePrevious}
              >
                ❮
              </button>
              <button
                className="modal-arrow right"
                aria-label="Next"
                onClick={handleNext}
              >
                ❯
              </button>

              {extraImage && extraImage.length > 1 && (
                <div className="modal-dot-indicators">
                  {extraImage.map((_, i) => (
                    <span
                      key={i}
                      className={`modal-dot ${i === imageIndex ? "active" : ""}`}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-text-section">
          <h2 className="modal-title">{title}</h2>
          <p className="modal-date">{date}</p>
          <div className="modal-divider" />
          <p className="modal-description">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default Modal;
