import Main from '../../layout/main-section/Main';
import Announcement from '../../layout/announcement-section/Announcement';
import Document from '../../layout/document-section/Document';
import Events from '../../layout/events-section/events';
import About from '../../layout/about-section/About';
import Officer from '../../layout/officer-layout/Officer';

const Homepage = () => {
  return (
    <div>
      <div id='main'>
        <Main />
      </div>
      <div id='announcement'>
        <Announcement />
      </div>
      <div id='document'>
        <Document />
      </div>
      <div id='events'>
        <Events />
      </div>
      <div id='about'>
        <About />
      </div>
      <div id='officers'>
        <Officer />
      </div>
    </div>
  );
};

export default Homepage;
