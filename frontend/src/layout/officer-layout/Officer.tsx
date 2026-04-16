import OfficerCard from "../../components/officer-card/Officer-card";
import Typography from "../../components/typography/Typography";
import officer from "../../config/officerConfig";
import board from "../../config/boardConfig";
import { Link } from "react-router-dom";
import Button from "../../components/button/Button";
import "./officer.css";
import adviser from "../../config/adviserConfig";

export default function Officer() {
  const scroll = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <section className="officer-container" id="officers">
      <div className="officer-layout">
        <div className="document-texts">
          <Typography size="text-md" color="text-dark">
            Executive Officers
          </Typography>

          <Typography size="text-light" color="text-dark">
            Meet your Executive Officers
          </Typography>
        </div>

        <div className="officer-grid">
          {officer.slice(0, 7).map((o) => (
            <OfficerCard
              key={o.id}
              id={o.id}
              title={o.title}
              description={o.description}
              image={o.image}
            />
          ))}
        </div>

        <div className="document-texts">
          <Typography size="text-md" color="text-dark">
            Board Members
          </Typography>

          <Typography size="text-light" color="text-dark">
            Meet the Board Members
          </Typography>
        </div>

        <div className="board-grid">
          {board.slice(0, 10).map((b) => (
            <OfficerCard
              key={b.id}
              id={b.id}
              title={b.title}
              description={b.description}
              image={b.image}
            />
          ))}
        </div>

        <div className="document-texts">
          <Typography size="text-md" color="text-dark">
            Advisers
          </Typography>

          <Typography size="text-light" color="text-dark">
            Meet our Advisers
          </Typography>
        </div>

        <div className="adviser-grid">
          {adviser.slice(0, 2).map((a) => (
            <OfficerCard
              key={a.id}
              id={a.id}
              title={a.title}
              description={a.description}
              image={a.image}
            />
          ))}
        </div>

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
