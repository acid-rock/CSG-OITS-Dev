import React, { useState, useEffect, useCallback } from "react";
import "./modal.css";
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";

interface ModalProps {
  isOpen: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  imageSrc: string;
  imageAlt: string;
  date?: string;
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
  const [transitioning, setTransitioning] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // Use the shared hook so the scrollbar is properly restored (including
  // padding compensation) when the modal closes — same as every other modal.
  useLockBodyScroll(isOpen);

  // Close lightbox on Escape
  const closeLightbox = useCallback(() => setLightboxSrc(null), []);
  useEffect(() => {
    if (!lightboxSrc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxSrc, closeLightbox]);

  // Preload adjacent images
  useEffect(() => {
    if (!extraImage || extraImage.length <= 1) return;
    const nextIdx = (imageIndex + 1) % extraImage.length;
    const prevIdx = (imageIndex - 1 + extraImage.length) % extraImage.length;
    [nextIdx, prevIdx].forEach((idx) => {
      const img = new Image();
      img.src = extraImage[idx];
    });
  }, [imageIndex, extraImage]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) setOpen(false);
  };

  const handleNext = () => {
    if (transitioning || !extraImage) return;
    setDirection("right");
    setTransitioning(true);
    setTimeout(() => {
      setImageIndex((i) => (i + 1) % extraImage.length);
      setTransitioning(false);
    }, 350);
  };

  const handlePrevious = () => {
    if (transitioning || !extraImage) return;
    setDirection("left");
    setTransitioning(true);
    setTimeout(() => {
      setImageIndex((i) => (i - 1 + extraImage.length) % extraImage.length);
      setTransitioning(false);
    }, 350);
  };

  const slideStyle: React.CSSProperties = transitioning
    ? {
        transition: "transform 0.35s ease, opacity 0.35s ease",
        transform: direction === "right" ? "translateX(-8%)" : "translateX(8%)",
        opacity: 0,
      }
    : {
        transition: "transform 0.35s ease, opacity 0.35s ease",
        transform: "translateX(0)",
        opacity: 1,
      };

  return (
    <>
    {lightboxSrc && (
      <div
        className="modal-lightbox"
        onClick={closeLightbox}
        role="dialog"
        aria-modal="true"
        aria-label="Zoomed image"
      >
        <button
          className="modal-lightbox-close"
          onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
          aria-label="Close zoomed view"
        >
          ×
        </button>
        <img
          src={lightboxSrc}
          alt=""
          className="modal-lightbox-img"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    )}
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
              className="modal-image modal-image--zoomable"
              style={slideStyle}
              onClick={() => setLightboxSrc(extraImage[imageIndex])}
              title="Click to zoom"
            />
          ) : (
            imageSrc && (
              <img
                src={imageSrc}
                alt={imageAlt}
                className="modal-image modal-image--zoomable"
                onClick={() => setLightboxSrc(imageSrc)}
                title="Click to zoom"
              />
            )
          )}

          {type === "event" && (
            <>
              <button
                className="modal-arrow left"
                aria-label="Previous"
                onClick={handlePrevious}
                disabled={transitioning}
              >
                ❮
              </button>
              <button
                className="modal-arrow right"
                aria-label="Next"
                onClick={handleNext}
                disabled={transitioning}
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
    </>
  );
};

export default Modal;
