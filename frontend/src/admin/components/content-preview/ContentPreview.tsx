import "./ContentPreview.css";

interface ContentPreviewProps {
  type: "announcement" | "document" | "event";
  formValues: {
    title: string;
    description: string;
    category?: string;
    date?: string;
    docType?: string;
    term?: string;
    pdfName?: string | null;
  };
  imagePreviewUrl: string | null;
}

function estimateReadTime(text: string): number {
  const words = (text ?? "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function truncate(text: string | undefined, n: number): string {
  if (!text) return "";
  return text.length > n ? text.slice(0, n) + "…" : text;
}

function formatDate(iso: string | undefined): string {
  if (!iso) return "Date not set";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Date not set";
  }
}

export default function ContentPreview({
  type,
  formValues,
  imagePreviewUrl,
}: ContentPreviewProps) {
  return (
    <div className="cp-panel">
      <p className="cp-label">PUBLIC PREVIEW</p>
      <p className="cp-subtitle">How students will see this</p>
      <div className="cp-divider" />

      {type === "announcement" && (
        <div className="cp-announcement-card">
          {imagePreviewUrl ? (
            <img
              src={imagePreviewUrl}
              alt="Preview"
              className="cp-card-image"
            />
          ) : (
            <div className="cp-card-image-placeholder">
              <span>No image uploaded</span>
            </div>
          )}
          <div className="cp-card-body">
            <span className="cp-card-category">
              {formValues.category || "CSG Updates"}
            </span>
            <h3 className="cp-card-title">
              {formValues.title || <em>Title will appear here</em>}
            </h3>
            <p className="cp-card-meta">
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
              {" · "}
              {estimateReadTime(formValues.description)} min read
            </p>
            <p className="cp-card-content">
              {truncate(formValues.description, 150) || (
                <em>Content will appear here…</em>
              )}
            </p>
          </div>
        </div>
      )}

      {type === "document" && (
        <div className="cp-document-card">
          <div className="cp-doc-icon">
            <img src="/CSG_logo.svg" alt="Document" />
          </div>
          <div className="cp-doc-body">
            <p className="cp-doc-type">
              {(formValues.docType || "document")
                .replace(/-/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase())}
            </p>
            <p className="cp-doc-name">
              {formValues.title || <em>Document name will appear here</em>}
            </p>
            {formValues.description && (
              <p className="cp-doc-description">
                {truncate(formValues.description, 100)}
              </p>
            )}
            {formValues.pdfName && (
              <p className="cp-doc-file">📄 {formValues.pdfName}</p>
            )}
          </div>
          <div className="cp-doc-action">
            <button disabled className="cp-doc-btn">
              View →
            </button>
          </div>
          <p className="cp-doc-note">
            The uploaded PDF will be viewable inline. Certain sections may be
            redacted before publishing.
          </p>
        </div>
      )}

      {type === "event" && (
        <div className="cp-event-card">
          {imagePreviewUrl ? (
            <img
              src={imagePreviewUrl}
              alt="Preview"
              className="cp-event-image"
            />
          ) : (
            <div className="cp-event-image-placeholder">
              <span>No photo uploaded</span>
            </div>
          )}
          <div className="cp-event-body">
            <p className="cp-event-date">• {formatDate(formValues.date)}</p>
            <h3 className="cp-event-title">
              {formValues.title || <em>Event name will appear here</em>}
            </h3>
            <p className="cp-event-description">
              {truncate(formValues.description, 120) || (
                <em>Description will appear here…</em>
              )}
            </p>
          </div>
        </div>
      )}

      <div className="cp-divider" style={{ marginTop: "var(--space-4)" }} />
      <p className="cp-disclaimer">
        ℹ Actual appearance may vary slightly based on context.
      </p>
    </div>
  );
}
