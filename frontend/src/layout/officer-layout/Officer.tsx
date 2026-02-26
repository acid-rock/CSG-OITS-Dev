import OfficerCard from '../../components/officer-card/Officer-card';
import Typography from '../../components/typography/Typography';
import officer from '../../config/officerConfig';
import { Link } from 'react-router-dom';
import Button from '../../components/button/Button';
import './officer.css';

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
          {officer.slice(0, 3).map((o) => (
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
