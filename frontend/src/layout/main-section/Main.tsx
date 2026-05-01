import Typography from "../../components/typography/Typography";
import "./main.css";
import Button from "../../components/button/Button";

export default function Main() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const slides = ["/home1.JPG", "/home2.JPG"];

  return (
    <div className="hero-container">
      <div className="hero-layout">
        <div className="hero-text">
          <Typography size="text-lg" color="text-dark">
            Online Information and Transparency System
          </Typography>
          <Typography
            size="text-md"
            color="text-dark"
            style={{ fontSize: "1rem" }}
          >
            We believe in open communication and accountability. Our mission is
            to represent student voices and ensure every decision is clear and
            accessible.
          </Typography>
          <div className="hero-buttons">
            <Button
              variant="primary"
              onClick={() => scrollToSection("document")}
            >
              Documents
            </Button>
          </div>
        </div>

        <div className="hero-image-container">
          <div className="image-carousel-track">
            {slides.map((slide, index) => (
              <div key={index} className="slide">
                <img src={slide} alt="" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
