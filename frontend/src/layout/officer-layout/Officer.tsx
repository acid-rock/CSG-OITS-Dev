import OfficerCard from "../../components/officer-card/Officer-card";
import { Link, useOutletContext } from "react-router-dom";
import Button from "../../components/button/Button";
import "./officer.css";
import type { Officer, OutletContext } from "../../root-layout/Root-layout";

export default function OfficerSection() {
  /* ══════════════════════════════════════════
     LOCKED DATA BINDINGS — do not modify
     ══════════════════════════════════════════ */
  const { officers } = useOutletContext<OutletContext>();

  /* Group by type field — locked */
  const executives = officers?.filter((o) => o.type === "executive");
  const board = officers?.filter((o) => o.type === "board");
  const advisers = officers?.filter((o) => o.type === "adviser");

  /* Find president — locked: position field */
  const president = executives?.find((o) => {
    const pos = Array.isArray(o.position) ? o.position[0] : o.position;
    return /president/i.test(pos) && !/vice/i.test(pos);
  });
  const otherExecs = president
    ? executives?.filter((o) => o !== president)
    : executives;

  const scroll = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section className="officer-container" id="officers">
      <div className="officer-layout">
        {/* Section header */}
        <div className="section-head">
          <div className="kicker">Elected by the student body</div>
          <h2>
            Meet your <em>executive</em> officers
          </h2>
          <p>AY 2025–2026 · CSG-CVSU Imus Campus</p>
        </div>

        {/* President spotlight */}
        {president && (
          <div className="officer-pres">
            <span className="officer-pres-crown">President</span>
            <OfficerCard
              id={president.full_name} /* locked: full_name */
              title={
                Array.isArray(president.position)
                  ? president.position[0]
                  : president.position
              }
              image={president.avatar} /* locked: avatar */
              socials={president.socials} /* locked: socials */
              term={president.year_serving}
              officerType={president.type} /* locked: type */
              variant="default"
            />
          </div>
        )}

        {/* Other executive officers */}
        {otherExecs && otherExecs.length > 0 && (
          <>
            <div className="officer-texts" style={{ textAlign: "center" }}>
              <span className="section-label" style={{ color: "#ffffff" }}>
                Executive Officers
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "1rem",
                width: "100%",
              }}
            >
              {otherExecs.map((o: Officer) => (
                <div
                  key={o.id}
                  className="office-card-container"
                  style={{
                    width: "160px",
                    minWidth: "160px",
                    maxWidth: "160px",
                  }}
                >
                  <OfficerCard
                    id={o.full_name}
                    title={
                      Array.isArray(o.position) ? o.position[0] : o.position
                    }
                    image={o.avatar} /* locked: avatar */
                    socials={o.socials} /* locked: socials */
                    term={o.year_serving}
                    officerType={o.type} /* locked: type */
                    variant="default"
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Board members */}
        {board && board.length > 0 && (
          <>
            <div className="officer-texts">
              <span className="section-label" style={{ color: "#ffffff" }}>
                Board Members
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "1rem",
                width: "100%",
              }}
            >
              {board.map((b: Officer) => (
                <div
                  key={b.id}
                  className="office-card-container"
                  style={{
                    width: "160px",
                    minWidth: "160px",
                    maxWidth: "160px",
                  }}
                >
                  <OfficerCard
                    id={b.full_name}
                    title={
                      Array.isArray(b.position) ? b.position[0] : b.position
                    }
                    image={b.avatar} /* locked: avatar */
                    socials={b.socials} /* locked: socials */
                    officerType={b.type} /* locked: type */
                    variant="default"
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Advisers — no Facebook icon */}
        {advisers && advisers.length > 0 && (
          <>
            <div className="officer-texts">
              <span className="section-label" style={{ color: "#ffffff" }}>
                Advisers
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "1rem",
                width: "100%",
              }}
            >
              {advisers.map((a: Officer) => (
                <div
                  key={a.id}
                  className="office-card-container"
                  style={{
                    width: "160px",
                    minWidth: "160px",
                    maxWidth: "160px",
                  }}
                >
                  <OfficerCard
                    id={a.full_name}
                    title={
                      Array.isArray(a.position) ? a.position[0] : a.position
                    }
                    image={a.avatar} /* locked: avatar */
                    officerType={a.type} /* locked: type — hides FB */
                    variant="default"
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {/* VIEW ALL — preserved */}
        <div className="view-btn">
          <Button variant="primary">
            <Link
              to="/officers"
              style={{ textDecoration: "none", color: "white" }}
              onClick={scroll}
            >
              VIEW ALL
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
