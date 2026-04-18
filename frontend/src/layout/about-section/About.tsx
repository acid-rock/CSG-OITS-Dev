import './about.css';
import wave from '../../assets/3.svg';
import AboutContent from './about-slides/main/AboutContent';
import { useState } from 'react';
import AboutOrganization from './about-slides/org/AboutOrganization';

export default function About() {
  const [index, setIndex] = useState(0);

  const prev = () => {
    setIndex(0);
  };

  const next = () => {
    setIndex(1);
  };

  return (
    <section id='about' className='about-container'>
      <div className='about-carousel'>
        <div
          className='about-carousel-track'
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          <div className='about-slide'>
            <AboutContent />
          </div>
          <div className='about-slide'>
            <AboutOrganization />
          </div>
        </div>

        <button onClick={prev} className='about-carousel-btn left'>
          ◀
        </button>

        <button onClick={next} className='about-carousel-btn right'>
          ▶
        </button>
      </div>
      <div className='wave-image'>
        <img className='wave' src={wave} alt='Wave' />
      </div>
    </section>
  );
}
