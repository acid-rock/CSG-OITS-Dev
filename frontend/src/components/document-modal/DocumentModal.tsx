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
  const [iframeLoading, setIframeLoading] = useState(true);

  useLockBodyScroll(!!selected);

  // Reset loading/error state whenever a new document is opened
  useEffect(() => {
    setIframeError(false);
    setIframeLoading(true);
  }, [selected?.memoSrc]);

  if (!selected) return null;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <span className="modal__title">{selected.title}</span>
          <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>
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
          <>
            {iframeLoading && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '0.75rem', color: 'var(--color-text-muted)', fontSize: '0.875rem',
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>
                </svg>
                <p style={{ margin: 0 }}>Loading document…</p>
              </div>
            )}
            <iframe
              className="modal__iframe"
              src={`https://docs.google.com/viewer?url=${encodeURIComponent(selected.memoSrc)}&embedded=true`}
              title={selected.title}
              style={iframeLoading ? { opacity: 0 } : undefined}
              onLoad={() => setIframeLoading(false)}
              onError={() => { setIframeError(true); setIframeLoading(false); }}
            />
          </>
        )}
      </div>
    </div>
  );
}
