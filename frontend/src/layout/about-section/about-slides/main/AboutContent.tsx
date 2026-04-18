import './AboutContent.css';
import Typography from '../../../../components/typography/Typography';

const AboutContent = () => {
  return (
    <div className='about-layout'>
      <div className='about-text-layout'>
        <div className='about-texts'>
          <Typography size='text-md' color='text-dark'>
            About
          </Typography>
          <Typography size='text-light' color='text-ghost'>
            Get to know the Central Student Government, our history, and our
            mission.
          </Typography>
        </div>
      </div>
      <div className='about-content'>
        <div className='about-content-sect1'>
          <div className='about-title'>
            <h1>
              CENTRAL STUDENT <br></br> GOVERNMENT
            </h1>
          </div>

          <div className='about-content-text'>
            <h1 className=''>
              A new era arises, bringing with it a new set of student leaders.
              We're not just a new set of faces; we represent a new face of
              leadership—one built on genuine commitment and dedication. In a
              time when the passion to lead may have dimmed for some, we stand
              ready to reignite that fire.
            </h1>
          </div>
        </div>
        <div className='about-content-image'>
          <img
            src='./about1.jpg'
            alt='Central Student Government'
            className='about-image'
          />
        </div>
        <div className='about-content-image'>
          <img
            src='./about2.jpg'
            alt='Central Student Government'
            className='about-image'
          />
        </div>
        <div className='about-content-sect2'>
          <div className='about-content-text'>
            <h1>
              This new term is driven by a deep sense of purpose, ensuring that
              every initiative, decision, and program is rooted in the true
              needs and aspirations of every kabsuhenyo. This is more than a
              change; it is a transformation in how we serve. We recognize that
              the heart of effective governance is not just in policies and
              plans, but in the sincerity with which they are executed. Our
              promise is simple yet powerful: to bring empathy, dedication, and
              true care to the forefront of our work. Our mission is to lead not
              just with our minds, but with our deepest convictions.
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutContent;
