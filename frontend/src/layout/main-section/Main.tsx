import Typography from '../../components/typography/Typography';
import './main.css';
import Button from '../../components/button/Button';
import wave from '../../assets/Wave_Section.svg';

export default function Main() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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
            <Button
              variant='primary'
              onClick={() => scrollToSection('document')}
            >
              Documents
            </Button>
          </div>
        </div>
        <div className='hero-image'>
          <img src='./home2.JPG' alt='test' />
        </div>
      </div>
      <div className='wave-image'>
        <img className='wave' src={wave} alt='Wave' />
      </div>
    </div>
  );
}
