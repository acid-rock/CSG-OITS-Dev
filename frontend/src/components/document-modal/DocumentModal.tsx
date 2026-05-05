import { useState, useEffect } from 'react';
import './documentmodal.css';

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

  // Reset error state whenever a new document is opened
  useEffect(() => {
    setIframeError(false);
  }, [selected?.memoSrc]);

  if (!selected) return null;

  return (
    <div className='overlay' onClick={onClose}>
      <div className='modal' onClick={(e) => e.stopPropagation()}>
        <button className='modal__close' onClick={onClose}>
          ✕
        </button>
        {iframeError ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              padding: '3rem 2rem',
              color: '#6b7280',
              fontSize: '0.9rem',
              textAlign: 'center',
            }}
          >
            <p style={{ margin: 0 }}>
              This document could not be loaded. It may have been moved or deleted.
            </p>
            <button
              onClick={onClose}
              style={{
                padding: '0.5rem 1.25rem',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                background: '#fff',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        ) : (
          <iframe
            className='modal__iframe'
            src={`${selected.memoSrc}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
            title={selected.title}
            onError={() => setIframeError(true)}
          />
        )}
      </div>
    </div>
  );
}
