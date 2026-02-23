import './officers.css';
import committees from '../../config/officers-board-members';
import { Facebook, Instagram, ChevronDown, ChevronUp } from 'lucide-react';
import { FaTiktok } from 'react-icons/fa';
import { useState } from 'react';

const Officers = () => {
  const [isOpen, setOpen] = useState(false);

  return (
    <div className='officers-container'>
      <div className='officers-layout'>
        {committees.map((committee, idx) => (
          <div key={idx} className='committee-section'>
            <h2 className='committee-title'>
              {committee.committee.toUpperCase()}
            </h2>

            <div className='committee-layout'>
              {/* Board Members Cards */}
              <div className='officials-section'>
                {committee.officials.map((official, i) => (
                  <div key={i} className='officer-card'>
                    <img
                      src={official.image}
                      alt={official.id}
                      className='officer-image'
                    />
                    <h3 className='officer-name'>{official.id}</h3>
                    <p className='officer-title'>{official.title}</p>
                    <div className='social-icons'>
                      <a href='#' className='social-icon'>
                        <Facebook size={20} />
                      </a>
                      <a href='#' className='social-icon'>
                        <FaTiktok size={20} />
                      </a>
                      <a href='#' className='social-icon'>
                        <Instagram size={20} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* Members Dropdown - Pure CSS */}
              <div className='members-section'>
                <details className='members-dropdown'>
                  <summary
                    className='dropdown-toggle'
                    onClick={() => setOpen((prev) => !prev)}
                  >
                    <div className='dropdown-toggle-content'>
                      Members ({committee.members.length}){' '}
                      <div className='dropdown-icons'>
                        {isOpen ? (
                          <ChevronUp size={24} />
                        ) : (
                          <ChevronDown size={24} />
                        )}
                      </div>
                    </div>
                  </summary>
                  <div className='dropdown-content'>
                    {committee.members?.map((member, i) => (
                      <div key={i} className='member-item'>
                        <span className='member-name'>{member.id}</span>
                        <span className='member-role'>{member.role}</span>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Officers;
