import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import "./documentmodal.css";
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).href;

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useLockBodyScroll(!!selected);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    setStatus("loading");

    (async () => {
      try {
        const pdf = await pdfjsLib.getDocument(selected.memoSrc).promise;
        if (cancelled || !containerRef.current) return;

        containerRef.current.innerHTML = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled || !containerRef.current) return;
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });

          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.className = "modal__canvas";

          containerRef.current.appendChild(canvas);

          const canvasContext = canvas.getContext("2d");
          if (!canvasContext)
            throw new Error("Unable to create canvas 2D context");

          await page.render({
            canvas,
            canvasContext,
            viewport,
          }).promise;
        }

        if (!cancelled) setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selected?.memoSrc]);

  if (!selected) return null;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <span className="modal__title">{selected.title}</span>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {status === "error" ? (
          <div className="modal__error">
            <p>
              This document could not be loaded. It may have been moved or
              deleted.
            </p>
            <button onClick={onClose}>Close</button>
          </div>
        ) : (
          <div className="modal__scroll">
            {status === "loading" && (
              <div className="modal__loading">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ opacity: 0.4 }}
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                </svg>
                <p>Loading document…</p>
              </div>
            )}
            <div
              ref={containerRef}
              className="modal__pages"
              style={status !== "ready" ? { display: "none" } : undefined}
            />
          </div>
        )}
      </div>
    </div>
  );
}
