import "./navigation.css";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import Button from "../button/Button";
import { navigationConfig } from "../../config/navigationConfig";
import logo from "../../assets/CSG_logo.svg";
import Typography from "../typography/Typography";
import { useLocation, useNavigate } from "react-router-dom";

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const getActiveId = () => {
    if (location.pathname !== "/") {
      const matched = navigationConfig.find(
        (n) =>
          location.pathname === `/${n.href}` ||
          location.pathname.startsWith(`/${n.href}/`),
      );
      return matched?.id ?? "";
    }
    return activeSection;
  };

  const currentActive = getActiveId();

  useEffect(() => {
    if (location.pathname !== "/") return;

    const sectionIds = navigationConfig.map((n) => n.href);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const matched = navigationConfig.find(
              (n) => n.href === entry.target.id,
            );
            if (matched) setActiveSection(matched.id);
          }
        });
      },
      {
        rootMargin: "-40% 0px -55% 0px",
        threshold: 0,
      },
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [location.pathname]);

  const handleNavClick = (href: string) => {
    closeMenu();

    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const element = document.getElementById(href);
        if (element)
          element.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } else {
      const element = document.getElementById(href);
      if (element)
        element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav className="navigation-container">
      <div className="navigation-layout">
        {/* Logo */}
        <div className="nav-left">
          <a className="nav-left" href="/">
            <img className="logo" src={logo} alt="CSG Logo" />
            <Typography color="text-dark">
              Central Student Government
            </Typography>
          </a>
        </div>

        {/* Desktop Navigation */}
        <div className="nav-center nav-desktop">
          {navigationConfig.map((button) => (
            <div
              key={button.id}
              className={`nav-item-wrapper ${currentActive === button.id ? "active" : ""}`}
            >
              <Button
                variant={button.variant}
                id={button.id}
                onClick={() => handleNavClick(button.href)}
              >
                {button.label}
              </Button>
            </div>
          ))}
        </div>

        {/* Hamburger */}
        <button
          type="button"
          className="hamburger-menu"
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMenuOpen ? "open" : ""}`}>
        <div className="mobile-menu-content">
          {navigationConfig.map((button) => (
            <div
              key={button.id}
              className={`nav-item-wrapper mobile ${currentActive === button.id ? "active" : ""}`}
            >
              <Button
                variant={button.variant}
                id={button.id}
                onClick={() => handleNavClick(button.href)}
              >
                {button.label}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}
