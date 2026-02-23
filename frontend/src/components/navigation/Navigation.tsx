import './navigation.css';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Button from '../button/Button';
import { navigationConfig } from '../../config/navigationConfig';
import logo from '../../assets/CSG_logo.svg';
import Typography from '../typography/Typography';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const handleNavClick = (href: string) => {
    closeMenu();

    // If not on homepage, navigate to homepage first
    if (location.pathname !== '/') {
      navigate('/');

      // Wait for navigation, then scroll
      setTimeout(() => {
        const element = document.getElementById(href);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      // Already on homepage, just scroll
      const element = document.getElementById(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <nav className='navigation-container'>
      <div className='navigation-layout'>
        {/* Logo Section */}
        <div className='nav-left'>
          <img className='logo' src={logo} alt='CSG Logo' />
          <Typography color='text-dark'>Central Student Government</Typography>
        </div>

        {/* Desktop Navigation */}
        <div className='nav-center nav-desktop'>
          {navigationConfig.map((button) => (
            <Button
              key={button.id}
              variant={button.variant}
              id={button.id}
              onClick={() => handleNavClick(button.href)}
            >
              {button.label}
            </Button>
          ))}
        </div>

        {/* Desktop Feedback Button */}
        <div className='nav-right nav-desktop'>
          <Button variant='primary' id='feedback'>
            Feedback
          </Button>
        </div>

        {/* Mobile Hamburger */}
        <button
          type='button'
          className='hamburger-menu'
          onClick={toggleMenu}
          aria-label='Toggle navigation menu'
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        id='mobile-menu'
        className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}
      >
        <div className='mobile-menu-content'>
          {navigationConfig.map((button) => (
            <Button
              key={button.id}
              variant={button.variant}
              id={button.id}
              onClick={() => handleNavClick(button.href)}
            >
              {button.label}
            </Button>
          ))}
          <Button variant='primary' id='feedback-mobile' onClick={closeMenu}>
            Feedback
          </Button>
        </div>
      </div>
    </nav>
  );
}
