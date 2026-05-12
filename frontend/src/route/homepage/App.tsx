import Main from "../../layout/main-section/Main";
import Announcement from "../../layout/announcement-section/Announcement";
import About from "../../layout/about-section/About";
import Events from "../../layout/events-section/events";
import { useOutletContext } from "react-router-dom";
import type { OutletContext } from "../../root-layout/Root-layout";
import OrganizationCard from "../../components/organization-card/OrganizationCard";
import "./homepage.css";

const Homepage = () => {
  const { organizations } = useOutletContext<OutletContext>();

  return (
    <div>
      <div id="main">
        <Main />
      </div>
      <div id="announcement">
        <Announcement />
      </div>
      <div id="events">
        <Events />
      </div>
      <div id="about">
        <About />
      </div>
      {organizations && organizations.length > 0 && (
        <div id="organizations" className="hp-orgs-section">
          <div className="hp-orgs-inner">
            <span className="section-label" style={{ display: "block", marginBottom: "var(--space-2)", textAlign: "center" }}>Student organizations</span>
            <h2 className="hp-orgs-heading">Organizations at CVSU-Imus</h2>
            <p className="hp-orgs-sub">Student organizations recognized by the Central Student Government</p>
            <div className="hp-orgs-grid">
              {organizations.map((org) => (
                <OrganizationCard key={org.id} org={org} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Homepage;
