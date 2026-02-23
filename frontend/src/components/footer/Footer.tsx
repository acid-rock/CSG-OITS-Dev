import Typography from "../typography/Typography";
import logo from "../../assets/CSG_logo.svg";
import "./footer.css";

export default function Footer() {
  return (
    <footer className="footer-container">
      <div className="footer-main">
        <div className="footer-newsletter">
          <div className="footer-logo">
            <img src={logo} alt="Logo" className="logo-image" />
          </div>
          <Typography size="text-light" color="text-dark">
            Stay informed about student government updates and campus
            initiatives
          </Typography>
          <div className="newsletter-form">
            <input
              type="email"
              placeholder="Email address"
              className="newsletter-input"
            />
            <button className="newsletter-button">Feedback</button>
          </div>
          <Typography size="text-light" color="text-dark">
            By sending feedback, you can help improve this website
          </Typography>
        </div>

        <div className="footer-columns">
          <div className="footer-column">
            <Typography size="text-sm" color="text-ghost">
              NAVIGATION
            </Typography>
            <ul className="footer-menu">
              <li>
                <Typography size="text-light" color="text-dark">
                  Home page
                </Typography>
              </li>
              <li>
                <Typography size="text-light" color="text-dark">
                  About us
                </Typography>
              </li>
              <li>
                <Typography size="text-light" color="text-dark">
                  Initiatives
                </Typography>
              </li>
              <li>
                <Typography size="text-light" color="text-dark">
                  Meetings
                </Typography>
              </li>
              <li>
                <Typography size="text-light" color="text-dark">
                  Contact
                </Typography>
              </li>
            </ul>
          </div>

          <div className="footer-column">
            <Typography size="text-sm" color="text-ghost">
              QUICK ACCESS
            </Typography>
            <ul className="footer-menu">
              <li>
                <Typography size="text-light" color="text-dark">
                  Reports
                </Typography>
              </li>
              <li>
                <Typography size="text-light" color="text-dark">
                  Transparency
                </Typography>
              </li>
              <li>
                <Typography size="text-light" color="text-dark">
                  Budget
                </Typography>
              </li>
              <li>
                <Typography size="text-light" color="text-dark">
                  Archives
                </Typography>
              </li>
            </ul>
          </div>

          <div className="footer-column">
            <Typography size="text-sm" color="text-ghost">
              Connect with us
            </Typography>
            <ul className="footer-social">
              <li className="social-item">
                <span className="social-icon">f</span>
                <Typography size="text-sm" color="text-dark">
                  Facebook
                </Typography>
              </li>
              <li className="social-item">
                <span className="social-icon">📷</span>
                <Typography size="text-sm" color="text-dark">
                  Email
                </Typography>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-layout">
          <div className="footer-text">
            <Typography size="text-light" color="text-dark">
              © 2024 Student Government Transparency Project. All Rights
              Reserved
            </Typography>
          </div>
          <div className="footer-links">
            <Typography size="text-light" color="text-dark">
              Privacy policy
            </Typography>
            <Typography size="text-light" color="text-dark">
              Terms of services
            </Typography>
            <Typography size="text-light" color="text-dark">
              Cookie settings
            </Typography>
          </div>
        </div>
      </div>
    </footer>
  );
}
