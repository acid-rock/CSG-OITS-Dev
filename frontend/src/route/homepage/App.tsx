import Main from "../../layout/main-section/Main";
import Announcement from "../../layout/announcement-section/Announcement";
import About from "../../layout/about-section/About";
import Events from "../../layout/events-section/events";
import OrganizationsSection from "../../layout/organizations-section/OrganizationsSection";
import "./homepage.css";

const Homepage = () => {
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
      <OrganizationsSection />
    </div>
  );
};

export default Homepage;
