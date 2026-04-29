import "./about.css";
import AboutContent from "./about-slides/main/AboutContent";
import { useState } from "react";
import AboutOrganization from "./about-slides/org/AboutOrganization";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function About() {
  const [index, setIndex] = useState(0);

  const prev = () => {
    setIndex(0);
  };

  const next = () => {
    setIndex(1);
  };

  return (
    <section id="about" className="about-container">
      <div className="about-carousel">
        <div
          className="about-carousel-track"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          <div className="about-slide">
            <AboutContent />
          </div>
          <div className="about-slide">
            <AboutOrganization />
          </div>
        </div>

        <button
          type="button"
          onClick={prev}
          className="about-carousel-btn left"
          aria-label="Previous slide"
        >
          <ChevronLeft />
        </button>

        <button
          type="button"
          onClick={next}
          className="about-carousel-btn right"
          aria-label="Next slide"
        >
          <ChevronRight />
        </button>
      </div>
    </section>
  );
}
