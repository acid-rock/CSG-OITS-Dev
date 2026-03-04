import OfficerCard from "../../components/officer-card/Officer-card";
import Typography from "../../components/typography/Typography";
import { Link, useOutletContext } from "react-router-dom";
import Button from "../../components/button/Button";
import type { OutletContext, Officer } from "../../root-layout/Root-layout";
import "./officer.css";

export default function Officer() {
  const { officers } = useOutletContext<OutletContext>();
  const executives = officers?.filter((officer) => {
    return officer.type === "executive";
  });

  const board = officers?.filter((officer) => {
    return officer.type === "board";
  });

  const advisers = officers?.filter((officer) => {
    return officer.type === "adviser";
  });
  return (
    <section className="officer-container" id="officers">
      <div className="officer-layout">
        <div className="document-texts">
          <Typography size="text-md" color="text-dark">
            Executive Officers
          </Typography>
          <Typography size="text-light" color="text-ghost">
            These are the executive officers
          </Typography>
        </div>

        <div className="officer-grid">
          {executives?.slice(0, 6).map((o: Officer) => (
            <div key={o.id} className="office-card-container">
              <OfficerCard
                id={o.full_name}
                title={o.position[0]}
                image={o.avatar}
                variant="default"
              />
            </div>
          ))}
        </div>

        <div className="document-texts">
          <Typography size="text-md" color="text-dark">
            Board Members
          </Typography>
          <Typography size="text-light" color="text-ghost">
            These are the board members
          </Typography>
        </div>

        <div className="board-member-grid">
          {board?.slice(0, 10).map((b: Officer) => (
            <div key={b.id} className="office-card-container">
              <OfficerCard
                id={b.full_name}
                title={b.position[0]}
                image={b.avatar}
                variant="default"
              />
            </div>
          ))}
        </div>

        <div className="document-texts">
          <Typography size="text-md" color="text-dark">
            Advisers
          </Typography>
          <Typography size="text-light" color="text-ghost">
            These are the advisers
          </Typography>
        </div>

        <div className="adviser-grid">
          {advisers?.slice(0, 2).map((a: Officer) => (
            <div key={a.id} className="office-card-container">
              <OfficerCard
                id={a.full_name}
                title={a.position}
                image={a.avatar}
                variant="default"
              />
            </div>
          ))}
        </div>

        <div className="view-btn">
          <Button variant="primary">
            <Link
              to="/officers"
              style={{ textDecoration: "none", color: "white" }}
            >
              VIEW ALL
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
