# `Main.tsx` — JSX additions

Add the eyebrow pill, italic emphasis in the headline, floating badges, and stat tiles. Keep the existing `Typography` and `Button` components — wrap their output with the new structural divs.

## Replace the body of `Main.tsx`

```tsx
import "./main.css";
import Button from "../../components/button/Button";

export default function Main() {
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
              <div className="hero-stat-num">42<em>+</em></div>
              <div className="hero-stat-lbl">Public documents filed</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-num">12</div>
              <div className="hero-stat-lbl">Active committees</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-num">68</div>
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
              <div className="val">CSG Elections 2026–27</div>
            </div>
          </div>
          <div className="hero-badge bg2">
            <div className="ico" style={{ background: "rgba(34,197,94,0.12)", color: "#15803d" }}>✓</div>
            <div>
              <div className="lbl">Equipment online</div>
              <div className="val">32 of 50 available</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## What changed

- Removed `<Typography>` for the headline + subtext — replaced with semantic `<h1>` and `<p>` so global heading rules in `index.css` (`h1 em` italic serif) apply.
- Added `.hero-eyebrow` pill above the headline.
- Added `.hero-stats` grid below the buttons.
- Added two `.hero-badge` floating cards inside `.hero-image-container`.
- Replace the data values in stats and badges with real values from your config layer.
