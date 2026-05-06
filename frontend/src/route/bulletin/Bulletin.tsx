import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import Modal from "../../components/modal/Modal";
import type { Announcement, OutletContext } from "../../root-layout/Root-layout";

const Bulletin = () => {
  const { bulletin } = useOutletContext<OutletContext>();
  const [selected, setSelected] = useState<Announcement | null>(null);
  const [open, setOpen] = useState(false);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  };

  const handleOpen = (ann: Announcement) => {
    setSelected(ann);
    setOpen(true);
  };

  return (
    <section className="bulletin-content">
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", marginBottom: "0.4rem" }}>
        Announcements
      </h1>
      <p style={{ fontSize: "0.9rem", color: "#6b7280", marginBottom: "2rem" }}>
        Stay informed with the latest updates from the Central Student Government.
      </p>

      {bulletin.length === 0 ? (
        <p style={{ color: "#9ca3af" }}>No announcements yet.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
          {bulletin.map((ann) => (
            <div
              key={ann.id}
              onClick={() => handleOpen(ann)}
              style={{
                background: "#fff",
                borderRadius: "10px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                overflow: "hidden",
                cursor: "pointer",
              }}
            >
              {ann.imgUrl && (
                <img
                  src={ann.imgUrl}
                  alt={ann.title}
                  style={{ width: "100%", height: "160px", objectFit: "cover" }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
              )}
              <div style={{ padding: "1rem" }}>
                <p style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.35rem" }}>
                  {formatDate(ann.date)}
                </p>
                <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#111827", marginBottom: "0.5rem", lineHeight: 1.4 }}>
                  {ann.title}
                </h3>
                <p style={{ fontSize: "0.85rem", color: "#6b7280", lineHeight: 1.5, margin: 0 }}>
                  {ann.content.length > 120 ? ann.content.slice(0, 120) + "…" : ann.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && selected && (
        <Modal
          isOpen={open}
          setOpen={setOpen}
          imageSrc={selected.imgUrl}
          imageAlt={selected.title}
          date={formatDate(selected.date)}
          title={selected.title}
          description={selected.content}
        />
      )}
    </section>
  );
};

export default Bulletin;
