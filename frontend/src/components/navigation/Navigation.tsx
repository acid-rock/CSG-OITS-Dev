import "./navigation.css";
import { useState, useRef, useEffect } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../../assets/CSG_logo.svg";
import Typography from "../typography/Typography";
import { useTheme } from "../../hooks/useTheme";

const SunIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
  </svg>
);
const MoonIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

/* ── Dropdown item icons ── */
const DDIcons = {
  bell: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  ),
  doc: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <path d="M14 2v6h6"/>
    </svg>
  ),
  hdd: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="14" width="20" height="8" rx="2"/>
      <path d="M3 14l3-8h12l3 8"/>
    </svg>
  ),
  duty: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <path d="M16 2v4M8 2v4M3 10h18"/>
      <circle cx="12" cy="15" r="2"/>
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 16v-4M12 8h.01"/>
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  org: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="6" height="14"/>
      <rect x="16" y="7" width="6" height="14"/>
      <rect x="9" y="3" width="6" height="18"/>
    </svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
};

/* ── Navigation group definitions ── */
const NAV_GROUPS = [
  {
    label: "News",
    items: [
      { label: "Announcements", sub: "Updates, events, and notices", href: "/bulletin",  icon: DDIcons.bell     },
      { label: "Events",        sub: "What's happening",             href: "/events",    icon: DDIcons.calendar },
    ],
  },
  {
    label: "Resources",
    items: [
      { label: "Documents",        sub: "Resolutions, memos, minutes",    href: "/documents", icon: DDIcons.doc  },
      { label: "Borrow Equipment", sub: "Reserve council equipment",       href: "/borrow",    icon: DDIcons.hdd  },
      { label: "Office Hours",     sub: "Live officer availability",       href: "/office",    icon: DDIcons.duty },
    ],
  },
  {
    label: "About",
    items: [
      { label: "About",         sub: "Our story and mission",          href: "/about",         icon: DDIcons.info  },
      { label: "Officers",      sub: "Meet the council officers",      href: "/officers",      icon: DDIcons.users },
      { label: "Organizations", sub: "Accredited student orgs",        href: "/organizations", icon: DDIcons.org   },
      { label: "Contributors",  sub: "People behind this system",      href: "/contributors",  icon: DDIcons.star  },
    ],
  },
];

export default function Navigation() {
  const navigate = useNavigate();
  const { theme, toggle: toggleTheme } = useTheme();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  /* openGroup is kept for aria-expanded and click-to-toggle on keyboard/click */
  const [openGroup, setOpenGroup] = useState<string | null>(null);
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
        <div
          className="nav-left"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        >
          <img className="logo" src={logo} alt="CSG Logo" />
          <Typography color="text-dark">
            Central Student Government - Imus
          </Typography>
        </div>

        {/* ── Desktop: grouped nav ── */}
        <div className="nav-center nav-desktop">
          {/* Home — direct link */}
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `nav-link${isActive ? " nav-link-active" : ""}`
            }
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
                    <span className="nav-dd-ico">{item.icon}</span>
                    <span className="nav-dd-text">
                      <span>{item.label}</span>
                      {item.sub && <span className="nav-dd-sub">{item.sub}</span>}
                    </span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}

          {/* Theme toggle — desktop */}
          <button
            type="button"
            className="nav-theme-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
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
          <NavLink to="/" end className="mobile-nav-link" onClick={closeMenu}>
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

          {/* Theme toggle — mobile */}
          <button
            type="button"
            className="nav-theme-btn nav-theme-btn-mobile"
            onClick={() => { toggleTheme(); closeMenu(); }}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
