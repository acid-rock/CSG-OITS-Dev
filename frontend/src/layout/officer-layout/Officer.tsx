import OfficerCard from '../../components/officer-card/Officer-card';
import Typography from '../../components/typography/Typography';
import officer from '../../config/officerConfig';
import { Link } from 'react-router-dom';
import Button from '../../components/button/Button';
import './officer.css';
import board from '../../config/boardConfig';
import adviser from '../../config/adviserConfig';

export default function Officer() {
  return (
    <section className='officer-container' id='officers'>
      <div className='officer-layout'>
        <div className='document-texts'>
          <Typography size='text-md' color='text-dark'>
            Executive Officers
          </Typography>
          <Typography size='text-light' color='text-ghost'>
            These are the executive officers
          </Typography>
        </div>

        <div className='officer-grid'>
          {officer.slice(0, 6).map((o) => (
            <div key={o.id} className='office-card-container'>
              <OfficerCard
                id={o.id}
                title={o.title}
                description={o.description}
                image={o.image}
                variant='default'
              />
            </div>
          ))}
        </div>

        <div className='document-texts'>
          <Typography size='text-md' color='text-dark'>
            Board Members
          </Typography>
          <Typography size='text-light' color='text-ghost'>
            These are the board members
          </Typography>
        </div>

        <div className='board-member-grid'>
          {board.slice(0, 10).map((b) => (
            <div key={b.id} className='office-card-container'>
              <OfficerCard
                id={b.id}
                title={b.title}
                description={b.description}
                image={b.image}
                variant='default'
              />
            </div>
          ))}
        </div>

        <div className='document-texts'>
          <Typography size='text-md' color='text-dark'>
            Advisers
          </Typography>
          <Typography size='text-light' color='text-ghost'>
            These are the advisers
          </Typography>
        </div>

        <div className='adviser-grid'>
          {adviser.slice(0, 2).map((a) => (
            <div key={a.id} className='office-card-container'>
              <OfficerCard
                id={a.id}
                title={a.title}
                description={a.description}
                image={a.image}
                variant='default'
              />
            </div>
          ))}
        </div>

        <div className='view-btn'>
          <Button variant='primary'>
            <Link
              to='/officers'
              style={{ textDecoration: 'none', color: 'white' }}
            >
              VIEW ALL
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
