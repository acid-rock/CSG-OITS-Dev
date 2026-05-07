import "./main.css";
import { useState, useEffect } from "react";
import axios from "axios";
import Button from "../../components/button/Button";

export default function Main() {
  const [docs, setDocs] = useState<string>("—");
  const [committees, setCommittees] = useState<string>("—");
  const [officers, setOfficers] = useState<string>("—");

  const [pinnedTitle, setPinnedTitle] = useState<string>("Loading...");
  const [equipmentLabel, setEquipmentLabel] = useState<string>("— of — available");

  useEffect(() => {
    const base = import.meta.env.VITE_API_URL as string;

    // Stat counters
    Promise.all([
      axios.get(`${base}/documents/`).then((r) => setDocs(String(r.data.length))).catch(() => {}),
      axios.get(`${base}/committees/`).then((r) => setCommittees(String(r.data.length))).catch(() => {}),
      axios.get(`${base}/officers/`).then((r) => setOfficers(String(r.data.length))).catch(() => {}),
    ]);

    // Pinned Now badge — prefer admin-pinned item, fall back to most recent
    axios
      .get(`${base}/announcements/`)
      .then((r) => {
        const announcements: { title: string; created_at: string; is_pinned?: boolean }[] = r.data;
        const pinned =
          announcements.find((a) => a.is_pinned) ??
          [...announcements].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
          )[0];
        if (pinned?.title) {
          const title = pinned.title.length > 30 ? pinned.title.slice(0, 30) + "..." : pinned.title;
          setPinnedTitle(title);
        } else {
          setPinnedTitle("No announcements");
        }
      })
      .catch(() => setPinnedTitle("No announcements"));

    // Equipment Online badge
    axios
      .get(`${base}/equipment/`)
      .then((r) => {
        const rows: { quantity: number; max_quantity: number; is_available: boolean }[] = r.data;
        const available = rows.filter((row) => row.is_available).reduce((sum, row) => sum + row.quantity, 0);
        const total = rows.reduce((sum, row) => sum + row.max_quantity, 0);
        setEquipmentLabel(`${available} of ${total} available`);
      })
      .catch(() => setEquipmentLabel("— of — available"));
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const slides = ["/home1.JPG", "/home2.JPG"];

  return (
    <div className="hero-container">
      <div className="hero-layout">
        {/* TEXT SIDE */}
        <div className="hero-text">
          <span className="hero-eyebrow">
            <span className="dot" />
            AY 2025–2026 · Now in session
          </span>

          <h1 className="hero-headline">
            Your voice, your campus, your <em>student</em> government.
          </h1>

          <p className="hero-subtext">
            Stay informed about resolutions, events, and the day-to-day work of
            the CSG. Borrow equipment, follow announcements, and meet the
            officers serving you this academic year.
          </p>

          <div className="hero-buttons">
            <Button variant="primary" onClick={() => scrollToSection("document")}>
              Documents
            </Button>
          </div>

          {/* Stat tiles */}
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-num">{docs}</div>
              <div className="hero-stat-lbl">Public documents filed</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-num">{committees}</div>
              <div className="hero-stat-lbl">Active committees</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-num">{officers}</div>
              <div className="hero-stat-lbl">Officers serving</div>
            </div>
          </div>
        </div>

        {/* IMAGE SIDE */}
        <div className="hero-image-container">
          <div className="image-carousel-track">
            {slides.map((slide, i) => (
              <div key={i} className="slide">
                <img src={slide} alt="" />
              </div>
            ))}
          </div>

          {/* Floating badges */}
          <div className="hero-badge bg1">
            <div className="ico">📌</div>
            <div>
              <div className="lbl">Pinned now</div>
              <div className="val">{pinnedTitle}</div>
            </div>
          </div>
          <div className="hero-badge bg2">
            <div className="ico" style={{ background: "#22C55E", color: "#fff", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "700", flexShrink: 0 }}>✓</div>
            <div>
              <div className="lbl">Equipment online</div>
              <div className="val">{equipmentLabel}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
