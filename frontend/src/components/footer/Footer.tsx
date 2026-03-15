import Typography from '../typography/Typography';
import logo from '../../assets/CSG_logo.svg';
import './footer.css';
import { FaFacebook } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';

export default function Footer() {
  return (
    <footer className='footer-container'>
      <div className='footer-main'>
        <div className='footer-newsletter'>
          <div className='footer-logo'>
            <img src={logo} alt='Logo' className='logo-image' />
          </div>
          <Typography size='text-light' color='text-white'>
            Stay informed on the latest student government 
            updates and campus initiatives.
          </Typography>
          <div className='newsletter-form'>
            <button className='newsletter-button'>Feedback</button>
          </div>
          <Typography size='text-light' color='text-white'>
            Your feedback helps us improve. 
            Let us know how we can make this platform better.
          </Typography>
        </div>

        <div className='footer-columns'>
          <div className='footer-column'>
            <Typography size='text-sm' color='text-white'>
              Connect with us
            </Typography>
            <ul className='footer-social'>
              <li className='social-item'>
                <span className='social-icon'>
                  <FaFacebook style={{ color: '#ffffff' }} />
                </span>
                <Typography size='text-sm' color='text-white'>
                  Facebook
                </Typography>
              </li>
              <li className='social-item'>
                <span className='social-icon'>
                  <MdEmail style={{ color: '#ffffff' }} />
                </span>
                <Typography size='text-sm' color='text-white'>
                  Email
                </Typography>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className='footer-bottom'>
        <div className='footer-layout'>
          <div className='footer-text'>
            <Typography size='text-light' color='text-white'>
              © 2024 Student Government Transparency Project. All Rights
              Reserved
            </Typography>
          </div>
          <div className='footer-links'>
            <Typography size='text-light' color='text-white'>
              Privacy policy
            </Typography>
            <Typography size='text-light' color='text-white'>
              Terms of services
            </Typography>
            <Typography size='text-light' color='text-white'>
              Cookie settings
            </Typography>
          </div>
        </div>
      </div>
    </footer>
  );
}
