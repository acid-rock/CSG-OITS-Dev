import OfficerCard from "../../components/officer-card/Officer-card";
import { Link, useOutletContext } from "react-router-dom";
import Button from "../../components/button/Button";
import "./officer.css";
import type { Officer, OutletContext } from "../../root-layout/Root-layout";

export default function OfficerSection() {
  const { officers } = useOutletContext<OutletContext>();

  const executives = officers?.filter((o) => o.type === "executive");
  const board = officers?.filter((o) => o.type === "board");
  const advisers = officers?.filter((o) => o.type === "adviser");

  // President spotlight: first executive whose position includes "president" (case-insensitive, not vice)
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
          <h2>Meet your <em>executive</em> officers</h2>
          <p>AY 2025–2026 · CSG-CVSU Imus Campus</p>
        </div>

        {/* President spotlight */}
        {president && (
          <div className="officer-pres">
            <span className="officer-pres-crown">President</span>
            <OfficerCard
              id={president.full_name}
              title={Array.isArray(president.position) ? president.position[0] : president.position}
              image={president.avatar}
              socials={president.socials}
              term={president.year_serving}
              officerType={president.type}
              variant="default"
            />
          </div>
        )}

        {/* Other executives */}
        {otherExecs && otherExecs.length > 0 && (
          <>
            <div className="officer-texts" style={{ textAlign: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Executive Officers
              </span>
            </div>
            <div className="officer-grid">
              {otherExecs.slice(0, 7).map((o: Officer) => (
                <div key={o.id} className="office-card-container">
                  <OfficerCard
                    id={o.full_name}
                    title={Array.isArray(o.position) ? o.position[0] : o.position}
                    image={o.avatar}
                    socials={o.socials}
                    term={o.year_serving}
                    officerType={o.type}
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
              <span style={{ fontSize: 13, fontWeight: 700, color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Board Members
              </span>
            </div>
            <div className="board-member-grid">
              {board.slice(0, 10).map((b: Officer) => (
                <div key={b.id} className="office-card-container">
                  <OfficerCard
                    id={b.full_name}
                    title={Array.isArray(b.position) ? b.position[0] : b.position}
                    image={b.avatar}
                    socials={b.socials}
                    officerType={b.type}
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
              <span style={{ fontSize: 13, fontWeight: 700, color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Advisers
              </span>
            </div>
            <div className="adviser-grid">
              {advisers.slice(0, 2).map((a: Officer) => (
                <div key={a.id} className="office-card-container">
                  <OfficerCard
                    id={a.full_name}
                    title={Array.isArray(a.position) ? a.position[0] : a.position}
                    image={a.avatar}
                    officerType={a.type}
                    variant="default"
                  />
                </div>
              ))}
            </div>
          </>
        )}

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
