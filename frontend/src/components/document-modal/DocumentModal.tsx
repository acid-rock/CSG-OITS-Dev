import { useState, useEffect } from "react";
import "./documentmodal.css";
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";

type DocumentModalProps = {
  selected: {
    title: string;
    date: string;
    memoSrc: string;
  } | null;
  onClose: () => void;
};

export default function DocumentModal({
  selected,
  onClose,
}: DocumentModalProps) {
  const [iframeError, setIframeError] = useState(false);

  useLockBodyScroll(!!selected);

  // Reset error state whenever a new document is opened
  useEffect(() => {
    setIframeError(false);
  }, [selected?.memoSrc]);

  if (!selected) return null;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose}>
          ✕
        </button>
        {iframeError ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "1rem",
              padding: "3rem 2rem",
              color: "var(--color-text-muted)",
              fontSize: "0.9rem",
              textAlign: "center",
            }}
          >
            <p style={{ margin: 0 }}>
              This document could not be loaded. It may have been moved or
              deleted.
            </p>
            <button
              onClick={onClose}
              style={{
                padding: "0.5rem 1.25rem",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                background: "var(--color-surface)",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        ) : (
          <iframe
            className="modal__iframe"
            src={`https://docs.google.com/viewer?url=${encodeURIComponent(selected.memoSrc)}&embedded=true`}
            title={selected.title}
            onError={() => setIframeError(true)}
          />
        )}
      </div>
    </div>
  );
}
