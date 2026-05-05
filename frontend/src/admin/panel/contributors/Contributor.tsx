import "./contributor.css";

const contributors = [
  {
    name: "Ivan P. Duran",
    role: "Committee Chair — Web Development",
    description: "Oversees the technical direction and development of the CSG-OITS platform.",
    initials: "ID",
  },
  {
    name: "John Harold R. Magma",
    role: "GAD Representative / Project Coordinator",
    description: "Coordinates overall project delivery and serves as the primary liaison between the CSG and the development team.",
    initials: "JM",
  },
  {
    name: "Lorenz E. Tuboro",
    role: "Back-End Developer",
    description: "Designs and maintains the Express API, Supabase integration, and server-side authentication.",
    initials: "LT",
  },
  {
    name: "Ralph Kenneth B. Perez",
    role: "UI/UX Designer",
    description: "Leads the visual design, layout systems, and user experience of the public and admin interfaces.",
    initials: "RP",
  },
  {
    name: "Jerald D. Estrella",
    role: "Front-End Developer",
    description: "Implements React components and integrates frontend views with backend API endpoints.",
    initials: "JE",
  },
  {
    name: "Taisei Domingo",
    role: "Front-End Developer",
    description: "Builds and maintains interactive UI components and responsive layouts across the system.",
    initials: "TD",
  },
  {
    name: "Gerald D. Alansalon",
    role: "Documentation Officer",
    description: "Manages technical documentation, system changelogs, and development records for the project.",
    initials: "GA",
  },
];

const InitialsAvatar = ({ initials }: { initials: string }) => (
  <div
    style={{
      background: "#6b7280",
      borderRadius: "50%",
      width: 80,
      height: 80,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff",
      fontWeight: 600,
      fontSize: "1.1rem",
      margin: "0 auto",
      flexShrink: 0,
    }}
  >
    {initials}
  </div>
);

const ContributorCard = ({ c }: { c: typeof contributors[number] }) => (
  <div
    style={{
      background: "#fff",
      borderRadius: 10,
      padding: "1.25rem",
      textAlign: "center",
      boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    }}
  >
    <InitialsAvatar initials={c.initials} />
    <p style={{ fontWeight: 600, margin: "0.75rem 0 0.25rem", fontSize: "0.9rem" }}>{c.name}</p>
    <p style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.5rem" }}>{c.role}</p>
    <p style={{ fontSize: "0.8rem", color: "#374151", lineHeight: 1.5, margin: 0 }}>{c.description}</p>
  </div>
);

const Contributor = () => {
  const firstRow = contributors.slice(0, 4);
  const secondRow = contributors.slice(4);

  return (
    <div className="admin-contributor-container">
      <div className="admin-contributor-header">
        <span>Contributors</span>
      </div>

      <div style={{ padding: "1.5rem 0" }}>
        {/* Row 1 — 4 cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          {firstRow.map((c) => (
            <ContributorCard key={c.name} c={c} />
          ))}
        </div>

        {/* Row 2 — remaining cards, centered */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "1.5rem",
          }}
        >
          {secondRow.map((c) => (
            <div key={c.name} style={{ width: "calc(25% - 1.125rem)" }}>
              <ContributorCard c={c} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Contributor;
