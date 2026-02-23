import Typography from '../../components/typography/Typography';
import './main.css';
import Button from '../../components/button/Button';
import wave from '../../assets/Wave_Section.svg';

export default function Main() {
  return (
    <div className='hero-container'>
      <div className='hero-layout'>
        <div className='hero-text'>
          <Typography size='text-lg' color='text-dark'>
            Online Information and Trasparency System
          </Typography>
          <Typography
            size='text-md'
            color='text-ghost'
            style={{ fontSize: '1rem' }}
          >
            We believe in open communication and accountability. Our mission is
            to represent student voices and ensure every decision in clever and
            accesible.
          </Typography>
          <div className='hero-buttons'>
            <Button variant='primary'>Documents</Button>
            <Button variant='outline'>Learn more</Button>
          </div>
        </div>
        <div className='hero-image'>
          <img
            src='https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800'
            alt='test'
          />
        </div>
      </div>
      <div className='wave-image'>
        <img className='wave' src={wave} alt='Wave' />
      </div>
    </div>
  );
}
