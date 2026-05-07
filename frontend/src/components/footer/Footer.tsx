import { useState } from 'react';
import logo from '../../assets/CSG_logo.svg';
import './footer.css';
import { FaFacebook } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';

/* ─── Google Form (Send Feedback) URL — preserve exactly ─── */
const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdpXwlDybMgEV8rrfazdYuQoHz8G5UCKTZg1zErSKZMK6Nnjg/viewform?usp=header";

type PolicyType = 'privacy' | 'terms' | 'cookies' | null;

const POLICY_CONTENT: Record<NonNullable<PolicyType>, { title: string; body: React.ReactNode }> = {
  privacy: {
    title: 'Privacy Policy',
    body: (
      <>
        <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 0 }}>Last updated: January 25, 2026</p>
        <p>The Central Student Government (CSG) of Cavite State University – Imus Campus operates the Online Information Transparency System (OITS). This page informs you of our policies regarding the collection and use of personal data when you use our site.</p>
        <h4>Information We Collect</h4>
        <p>We do not collect personal information from students browsing the public site. The site displays publicly available CSG records including announcements, documents, events, and officer information.</p>
        <p>Admin users who are authorized CSG members may have their email address and student number recorded in our whitelist for access-control purposes.</p>
        <h4>Use of Information</h4>
        <p>Information collected from admin users is used solely to verify identity and maintain access control to the admin panel. It is never sold, shared, or used for any commercial purpose.</p>
        <h4>Contact</h4>
        <p>For questions regarding this privacy policy, contact us at <a href="mailto:csg.imus@cvsu.edu.ph">csg.imus@cvsu.edu.ph</a>.</p>
      </>
    ),
  },
  terms: {
    title: 'Terms of Service',
    body: (
      <>
        <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 0 }}>Last updated: January 25, 2026</p>
        <p>By accessing the OITS website, you agree to the following terms:</p>
        <ul>
          <li>This site is operated by the Central Student Government of Cavite State University – Imus Campus for informational purposes.</li>
          <li>All documents, announcements, and records published on this site are official CSG materials and are provided for public transparency.</li>
          <li>You may not reproduce, redistribute, or misrepresent any content from this site without written permission from the CSG.</li>
          <li>The CSG reserves the right to update or remove content at any time without prior notice.</li>
          <li>Unauthorized access to the admin panel is strictly prohibited.</li>
        </ul>
        <h4>Contact</h4>
        <p>For questions, contact us at <a href="mailto:csg.imus@cvsu.edu.ph">csg.imus@cvsu.edu.ph</a>.</p>
      </>
    ),
  },
  cookies: {
    title: 'Cookie Settings',
    body: (
      <>
        <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 0 }}>Last updated: January 25, 2026</p>
        <p>This site uses minimal cookies necessary for operation.</p>
        <h4>Session Cookies</h4>
        <p>Admin users are authenticated using secure, HTTP-only session cookies. These cookies are deleted when you close your browser or log out.</p>
        <h4>No Tracking Cookies</h4>
        <p>The OITS does not use advertising cookies, analytics tracking cookies, or any third-party tracking technologies. No personal browsing data is collected from public visitors.</p>
        <p>If you have questions about how cookies are used, contact us at <a href="mailto:csg.imus@cvsu.edu.ph">csg.imus@cvsu.edu.ph</a>.</p>
      </>
    ),
  },
};

function FooterModal({ type, onClose }: { type: PolicyType; onClose: () => void }) {
  if (!type) return null;
  const content = POLICY_CONTENT[type];
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100vw', height: '100vh',
        background: 'rgba(0,0,0,0.5)', zIndex: 2000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: '10px', padding: '2rem',
          maxWidth: '600px', width: '90%', maxHeight: '80vh',
          overflowY: 'auto', position: 'relative', color: '#111', lineHeight: 1.7,
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '1rem', right: '1rem',
            background: 'none', border: 'none', fontSize: '1.4rem',
            cursor: 'pointer', lineHeight: 1, color: '#374151',
          }}
          aria-label='Close'
        >×</button>
        <h2 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 700 }}>
          {content.title}
        </h2>
        <div style={{ fontSize: '0.9rem' }}>{content.body}</div>
      </div>
    </div>
  );
}

export default function Footer() {
  const [openPolicy, setOpenPolicy] = useState<PolicyType>(null);

  return (
    <>
      <footer className='footer-container'>
        <div className='footer-inner'>

          {/* ── LEFT: brand block ── */}
          <div className='footer-brand-col'>
            <div className='footer-brand-row'>
              <img src={logo} alt='CSG Logo' className='footer-logo-img' />
              <span className='footer-brand-name'>Central Student Government</span>
            </div>
            <p className='footer-brand-sub'>
              Cavite State University — Imus Campus &nbsp;·&nbsp; csg.imus@cvsu.edu.ph
            </p>
          </div>

          {/* ── RIGHT: links + copyright ── */}
          <div className='footer-right-col'>
            <nav className='footer-nav'>
              {/* Contact — preserves Gmail window.open handler */}
              <button
                type='button'
                className='footer-nav-link'
                onClick={() => window.open('https://mail.google.com/mail/?view=cm&to=csg.imus@cvsu.edu.ph', '_blank', 'noopener,noreferrer')}
              >
                Contact
              </button>
              <span className='footer-nav-sep'>|</span>

              {/* Privacy — preserves modal handler */}
              <button
                type='button'
                className='footer-nav-link'
                onClick={() => setOpenPolicy('privacy')}
              >
                Privacy
              </button>
              <span className='footer-nav-sep'>|</span>

              {/* Transparency → Terms modal — preserves modal handler */}
              <button
                type='button'
                className='footer-nav-link'
                onClick={() => setOpenPolicy('terms')}
              >
                Transparency
              </button>

              {/* Facebook — preserves href exactly */}
              <span className='footer-nav-sep'>|</span>
              <a
                href='https://www.facebook.com/csg.imus'
                target='_blank'
                rel='noopener noreferrer'
                className='footer-nav-link footer-fb-link'
              >
                <FaFacebook style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                Facebook
              </a>
            </nav>

            <p className='footer-copyright'>© 2026 CSG-OITS</p>
          </div>
        </div>

        {/* ── Bottom divider line ── */}
        <div className='footer-divider' />

        {/* ── Send Feedback text link ── */}
        <div className='footer-feedback-row'>
          <a
            href={GOOGLE_FORM_URL || '#'}
            target='_blank'
            rel='noopener noreferrer'
            className='footer-feedback-link'
            onClick={GOOGLE_FORM_URL ? undefined : (e) => e.preventDefault()}
          >
            Send Feedback →
          </a>

          {/* Cookie settings — preserves modal handler */}
          <button
            type='button'
            className='footer-nav-link'
            style={{ fontSize: 'var(--font-size-xs)' }}
            onClick={() => setOpenPolicy('cookies')}
          >
            Cookie Settings
          </button>
        </div>
      </footer>

      {/* Policy modals — preserve all handlers */}
      <FooterModal type={openPolicy} onClose={() => setOpenPolicy(null)} />
    </>
  );
}
