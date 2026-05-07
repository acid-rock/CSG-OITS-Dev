import Main from "../../layout/main-section/Main";
import Announcement from "../../layout/announcement-section/Announcement";
import About from "../../layout/about-section/About";
import Events from "../../layout/events-section/events";

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
    </div>
  );
};

export default Homepage;
