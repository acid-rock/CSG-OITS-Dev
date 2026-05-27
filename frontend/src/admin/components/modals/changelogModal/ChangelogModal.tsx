import { useEffect, useState } from "react";
import { useLockBodyScroll } from "../../../../hooks/useLockBodyScroll";

const API_URL = import.meta.env.VITE_API_URL as string;

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ── Minimal markdown renderer ────────────────────────────────────────────────
// Handles the exact subset used in CHANGELOG.md:
//   # h1   ## h2   ### h3   - bullet   blank line (paragraph break)
// Inline: **bold**  `code`  [text](url)
// No external dependency needed.

function renderInline(text: string): React.ReactNode[] {
  // Split on **bold**, `code`, and [text](url) patterns
  const parts: React.ReactNode[] = [];
  const re = /(\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[0].startsWith("**"))   parts.push(<strong key={match.index}>{match[2]}</strong>);
    else if (match[0].startsWith("`")) parts.push(<code key={match.index} style={{ background: "rgba(0,0,0,0.06)", borderRadius: 4, padding: "1px 5px", fontFamily: "monospace", fontSize: "0.82em" }}>{match[3]}</code>);
    else parts.push(<a key={match.index} href={match[5]} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary, #4f6ef7)" }}>{match[4]}</a>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function MarkdownChangelog({ raw }: { raw: string }) {
  const isDev = ['localhost', '127.0.0.1'].includes(window.location.hostname);

  // In production: strip the [Unreleased] section entirely so the latest
  // released version is the first thing visible.
  // In development: keep it and badge it with "DEV" so the team can see
  // in-progress notes without confusion.
  const processedRaw = isDev
    ? raw
    : raw.replace(/## \[Unreleased\][^\n]*\n[\s\S]*?(?=## \[)/, '');

  const lines = processedRaw.split("\n");
  const nodes: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listBuffer.length === 0) return;
    nodes.push(
      <ul key={key++} style={{ margin: "4px 0 10px 0", paddingLeft: 20 }}>
        {listBuffer.map((item, i) => (
          <li key={i} style={{ fontSize: "0.875rem", color: "#374151", marginBottom: 3, lineHeight: 1.55 }}>
            {renderInline(item)}
          </li>
        ))}
      </ul>
    );
    listBuffer = [];
  };

  for (const raw_line of lines) {
    const line = raw_line.trimEnd();

    if (line.startsWith("### ")) {
      flushList();
      nodes.push(
        <h3 key={key++} style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6b7280", margin: "14px 0 4px" }}>
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith("## ")) {
      flushList();
      const heading = line.slice(3);
      const isUnreleased = /^\[Unreleased\]/i.test(heading.trim());
      nodes.push(
        <h2 key={key++} style={{ fontSize: "1rem", fontWeight: 700, color: "#111827", margin: "22px 0 2px", paddingBottom: 6, borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 8 }}>
          {renderInline(heading)}
          {isUnreleased && (
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", background: "#fef3c7", color: "#92400e", borderRadius: 4, padding: "2px 7px", lineHeight: 1.5, flexShrink: 0 }}>
              Dev
            </span>
          )}
        </h2>
      );
    } else if (line.startsWith("# ")) {
      flushList();
      nodes.push(
        <h1 key={key++} style={{ fontSize: "1.15rem", fontWeight: 800, color: "#111827", margin: "0 0 4px" }}>
          {line.slice(2)}
        </h1>
      );
    } else if (line.startsWith("- ")) {
      listBuffer.push(line.slice(2));
    } else if (line.trim() === "") {
      flushList();
    } else {
      flushList();
      nodes.push(
        <p key={key++} style={{ fontSize: "0.875rem", color: "#6b7280", margin: "2px 0 8px", lineHeight: 1.6 }}>
          {renderInline(line)}
        </p>
      );
    }
  }
  flushList();

  return <>{nodes}</>;
}

// ── Modal ────────────────────────────────────────────────────────────────────

const ChangelogModal = ({ isOpen, onClose }: ChangelogModalProps) => {
  useLockBodyScroll(isOpen);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    fetch(`${API_URL}/changelog`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.text();
      })
      .then((text) => setContent(text))
      .catch(() => setError("Could not load changelog."))
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        style={{ background: "#fff", borderRadius: 12, padding: "1.5rem", maxWidth: 680, width: "92%", maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#111827" }}>System Changelog</h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", color: "#6b7280", lineHeight: 1, padding: "0 2px" }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", flex: 1, paddingRight: 4 }}>
          {loading && <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>Loading changelog…</p>}
          {error  && <p style={{ color: "#dc2626", fontSize: "0.875rem" }}>{error}</p>}
          {!loading && !error && content && <MarkdownChangelog raw={content} />}
        </div>
      </div>
    </div>
  );
};

export default ChangelogModal;
