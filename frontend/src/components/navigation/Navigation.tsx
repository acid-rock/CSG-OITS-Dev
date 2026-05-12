import "./navigation.css";
import { useState, useRef, useEffect } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../../assets/CSG_logo.svg";
import Typography from "../typography/Typography";

/* ── Navigation group definitions ── */
const NAV_GROUPS = [
  {
    label: "News",
    items: [
      { label: "Announcements", href: "/bulletin" },
      { label: "Events",        href: "/events"  },
    ],
  },
  {
    label: "Resources",
    items: [
      { label: "Documents",        href: "/documents" },
      { label: "Borrow Equipment", href: "/borrow"    },
    ],
  },
  {
    label: "About",
    items: [
      { label: "About",         href: "/about"              },
      { label: "Officers",      href: "/officers"           },
      { label: "Organizations", href: "/about#organizations"},
      { label: "Contributors",  href: "/contributors"       },
    ],
  },
] as const;

export default function Navigation() {
  const navigate = useNavigate();

  const [isMenuOpen,      setIsMenuOpen]      = useState(false);
  /* openGroup is kept for aria-expanded and click-to-toggle on keyboard/click */
  const [openGroup,       setOpenGroup]       = useState<string | null>(null);
  const [mobileOpenGroup, setMobileOpenGroup] = useState<string | null>(null);

  const navRef = useRef<HTMLElement>(null);

  /* Close dropdown when clicking outside the nav */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenGroup(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const closeMenu = () => {
    setIsMenuOpen(false);
    setMobileOpenGroup(null);
  };

  return (
    <nav className="navigation-container" ref={navRef}>
      <div className="navigation-layout">

        {/* ── Left: logo + brand ── */}
        <div className="nav-left" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          <img className="logo" src={logo} alt="CSG Logo" />
          <Typography color="text-dark">Central Student Government - Imus</Typography>
        </div>

        {/* ── Desktop: grouped nav ── */}
        <div className="nav-center nav-desktop">

          {/* Home — direct link */}
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link${isActive ? " nav-link-active" : ""}`}
          >
            Home
          </NavLink>

          {/* Dropdown groups — visibility controlled by CSS :hover (reliable, no gap) */}
          {NAV_GROUPS.map((group) => (
            <div
              key={group.label}
              className={`nav-group${openGroup === group.label ? " nav-group-open" : ""}`}
            >
              <button
                type="button"
                className="nav-group-btn"
                onClick={() =>
                  setOpenGroup(openGroup === group.label ? null : group.label)
                }
                aria-haspopup="true"
                aria-expanded={openGroup === group.label}
              >
                {group.label}
                <ChevronDown size={13} className="nav-chevron" />
              </button>

              <div className="nav-dropdown" role="menu">
                {group.items.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    role="menuitem"
                    className={({ isActive }) =>
                      `nav-dropdown-item${isActive ? " nav-dropdown-item-active" : ""}`
                    }
                    onClick={() => setOpenGroup(null)}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── Mobile hamburger ── */}
        <button
          type="button"
          className="hamburger-menu"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* ── Mobile slide-down menu ── */}
      <div
        id="mobile-menu"
        className={`mobile-menu ${isMenuOpen ? "open" : ""}`}
      >
        <div className="mobile-menu-content">

          {/* Home */}
          <NavLink
            to="/"
            end
            className="mobile-nav-link"
            onClick={closeMenu}
          >
            Home
          </NavLink>

          {/* Accordion groups */}
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mobile-group">
              <button
                type="button"
                className="mobile-group-btn"
                onClick={() =>
                  setMobileOpenGroup(
                    mobileOpenGroup === group.label ? null : group.label,
                  )
                }
              >
                {group.label}
                <ChevronDown
                  size={14}
                  className={`nav-chevron${mobileOpenGroup === group.label ? " nav-chevron-open" : ""}`}
                />
              </button>

              {mobileOpenGroup === group.label && (
                <div className="mobile-group-items">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      className="mobile-nav-link mobile-nav-child"
                      onClick={closeMenu}
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}
