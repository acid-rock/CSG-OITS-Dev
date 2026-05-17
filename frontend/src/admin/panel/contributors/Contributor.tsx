import "./contributor.css";
import { useEffect, useState } from "react";
import axios from "axios";
import { FaGithub, FaEnvelope, FaFacebook, FaInstagram } from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL as string;

const contributors = [
  {
    name: "Ivan P. Duran",
    role: "Committee Chair — Web Development",
    description: "Oversees the technical direction and development of the CSG-OITS platform.",
    initials: "ID",
    github:    "https://github.com/sleepdeprive-gray",
    facebook:  "https://www.facebook.com/infectious.ivan",
    email:     "ayban.duran@gmail.com",
    instagram: "https://www.instagram.com/not.aybann",
  },
  {
    name: "John Harold R. Magma",
    role: "GAD Representative / Project Coordinator",
    description: "Coordinates overall project delivery and serves as the primary liaison between the CSG and the development team.",
    initials: "JM",
    github:    "https://github.com/Hexizen",
    facebook:  "https://www.facebook.com/jhnhrldmgm",
    email:     "johnharold8888@gmail.com",
    instagram: "https://www.instagram.com/j.h.magma",
  },
  {
    name: "Lorenz E. Tuboro",
    role: "Back-End Developer",
    description: "Designs and maintains the Express API, Supabase integration, and server-side authentication.",
    initials: "LT",
    github:    "https://github.com/acid-rock",
    facebook:  "https://www.facebook.com/herelieszee3/",
    email:     "lorenztuboro00@gmail.com",
    instagram: "https://www.instagram.com/thisiszee3/",
  },
  {
    name: "Ralph Kenneth B. Perez",
    role: "UI/UX Designer",
    description: "Leads the visual design, layout systems, and user experience of the public and admin interfaces.",
    initials: "RP",
    github:    "https://github.com/rkenbperez",
    facebook:  "https://www.facebook.com/Ralph.Ken.Perez",
    email:     "rken.perez@gmail.com",
    instagram: "https://www.instagram.com/si_kenp",
  },
  {
    name: "Jerald D. Estrella",
    role: "Front-End Developer",
    description: "Implements React components and integrates frontend views with backend API endpoints.",
    initials: "JE",
    github:    "https://github.com/JeraldEstrella",
    facebook:  "https://www.facebook.com/jerald.estrellaii",
    email:     "jeraldestrella127@gmail.com",
    instagram: "https://www.instagram.com/jrldstellar",
  },
  {
    name: "Taisei Domingo",
    role: "Front-End Developer",
    description: "Builds and maintains interactive UI components and responsive layouts across the system.",
    initials: "TD",
    github:    "https://github.com/TaiseiD",
    facebook:  "https://www.facebook.com/iiseiich",
    email:     "domingo.taisei070606@gmail.com",
    instagram: "https://www.instagram.com/iiseichi",
  },
  {
    name: "Gerald D. Alansalon",
    role: "Documentation Officer",
    description: "Manages technical documentation, system changelogs, and development records for the project.",
    initials: "GA",
    github:    "https://github.com/GeraldTheTeenGR",
    facebook:  "https://www.facebook.com/GDomingoA",
    email:     "geraldalansalon@gmail.com",
    instagram: "https://www.instagram.com/iamgerald_12",
  },
];

interface OfficerMatch {
  avatar: string | null;
  year_serving: string | null;
}

const ContributorCard = ({
  c,
  avatarUrl,
  termYear,
}: {
  c: (typeof contributors)[number];
  avatarUrl: string | null;
  termYear: string | null;
}) => (
  <div
    style={{
      background: "#fff",
      borderRadius: 10,
      padding: "1.25rem",
      textAlign: "center",
      boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      flex: "0 0 calc(25% - 1.125rem)",
      maxWidth: 240,
      minWidth: 160,
      boxSizing: "border-box",
    }}
  >
    <div
      style={{
        width: 80,
        height: 80,
        borderRadius: "50%",
        overflow: "hidden",
        flexShrink: 0,
        background: "#e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span style={{ fontWeight: 700, fontSize: "1.25rem", color: "#6b7280" }}>{c.initials}</span>
      )}
    </div>

    <p style={{ fontWeight: 600, margin: "0.75rem 0 0.25rem", fontSize: "0.9rem" }}>{c.name}</p>
    <p style={{ fontSize: "0.8rem", color: "#6b7280", margin: "0 0 0.15rem" }}>{c.role}</p>
    <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: "0 0 0.5rem" }}>{termYear ?? "N/A"}</p>
    <p style={{ fontSize: "0.8rem", color: "#374151", lineHeight: 1.5, margin: "0 0 0.75rem", overflow: "hidden" }}>
      {c.description}
    </p>

    {/* Social links */}
    <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", marginTop: "auto" }}>
      <a href={c.github} target="_blank" rel="noopener noreferrer"
        aria-label={`${c.name} GitHub`}
        style={{ color: "#6b7280", display: "flex", transition: "color 0.15s" }}
        onMouseEnter={e => (e.currentTarget.style.color = "#1a1a1a")}
        onMouseLeave={e => (e.currentTarget.style.color = "#6b7280")}>
        <FaGithub size={16} />
      </a>
      <a href={c.facebook} target="_blank" rel="noopener noreferrer"
        aria-label={`${c.name} Facebook`}
        style={{ color: "#6b7280", display: "flex", transition: "color 0.15s" }}
        onMouseEnter={e => (e.currentTarget.style.color = "#1877f2")}
        onMouseLeave={e => (e.currentTarget.style.color = "#6b7280")}>
        <FaFacebook size={16} />
      </a>
      <a href={`https://mail.google.com/mail/?view=cm&to=${c.email}`}
        target="_blank" rel="noopener noreferrer"
        aria-label={`Email ${c.name}`}
        style={{ color: "#6b7280", display: "flex", transition: "color 0.15s" }}
        onMouseEnter={e => (e.currentTarget.style.color = "#4f6ef7")}
        onMouseLeave={e => (e.currentTarget.style.color = "#6b7280")}>
        <FaEnvelope size={16} />
      </a>
      <a href={c.instagram} target="_blank" rel="noopener noreferrer"
        aria-label={`${c.name} Instagram`}
        style={{ color: "#6b7280", display: "flex", transition: "color 0.15s" }}
        onMouseEnter={e => (e.currentTarget.style.color = "#e1306c")}
        onMouseLeave={e => (e.currentTarget.style.color = "#6b7280")}>
        <FaInstagram size={16} />
      </a>
    </div>
  </div>
);

const Contributor = () => {
  const [officerMap, setOfficerMap] = useState<Record<string, OfficerMatch>>({});

  useEffect(() => {
    axios
      .get(`${API_URL}/officers`)
      .then(({ data }) => {
        const map: Record<string, OfficerMatch> = {};
        for (const o of data) {
          map[o.full_name] = { avatar: o.avatar ?? null, year_serving: o.year_serving ?? null };
        }
        setOfficerMap(map);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="admin-contributor-container">
      <div className="admin-contributor-header">
        <span>Contributors</span>
      </div>

      <div style={{ padding: "1.5rem 0" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "1.5rem",
          }}
        >
          {contributors.map((c) => {
            const match = officerMap[c.name] ?? null;
            return (
              <ContributorCard
                key={c.name}
                c={c}
                avatarUrl={match?.avatar ?? null}
                termYear={match?.year_serving ?? null}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Contributor;
