import React from 'react';
import './contributor.css';

export const contributorConfig = [
  {
    img: 'https://randomuser.me/api/portraits/men/32.jpg',
    name: 'Bob Smith',
    position: 'Backend Engineer',
    bio: 'Specializes in server-side logic and database design.',
  },
  {
    img: 'https://randomuser.me/api/portraits/men/32.jpg',
    name: 'Bob Smith',
    position: 'Backend Engineer',
    bio: 'Specializes in server-side logic and database design.',
  },
  {
    img: 'https://randomuser.me/api/portraits/men/32.jpg',
    name: 'Bob Smith',
    position: 'Backend Engineer',
    bio: 'Specializes in server-side logic and database design.',
  },
  {
    img: 'https://randomuser.me/api/portraits/men/32.jpg',
    name: 'Bob Smith',
    position: 'Backend Engineer',
    bio: 'Specializes in server-side logic and database design.',
  },
  {
    img: 'https://randomuser.me/api/portraits/men/32.jpg',
    name: 'Bob Smith',
    position: 'Backend Engineer',
    bio: 'Specializes in server-side logic and database design.',
  },
  {
    img: 'https://randomuser.me/api/portraits/men/32.jpg',
    name: 'Bob Smith',
    position: 'Backend Engineer',
    bio: 'Specializes in server-side logic and database design.',
  },
  {
    img: 'https://randomuser.me/api/portraits/men/32.jpg',
    name: 'Bob Smith',
    position: 'Backend Engineer',
    bio: 'Specializes in server-side logic and database design.',
  },
  {
    img: 'https://randomuser.me/api/portraits/men/32.jpg',
    name: 'Bob Smith',
    position: 'Backend Engineer',
    bio: 'Specializes in server-side logic and database design.',
  },
];

import ContributorAvatar from '../../components/avatar/ContributorAvatar';

const Contributor = () => {
  // Split contributors for layout
  const firstRow = contributorConfig.slice(0, 4);
  const secondRow = contributorConfig.slice(4, 7);

  return (
    <div className='admin-contributor-container'>
      <div className='admin-contributor-header'>
        <span>Contributors</span>
        <p>
          {new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </p>
      </div>
      <div className='admin-contributor-avatar-list'>
        <div className='admin-contributor-avatar-row admin-contributor-avatar-row-1'>
          {firstRow.map((i, idx) => (
            <ContributorAvatar key={idx} info={i} />
          ))}
        </div>
        <div className='admin-contributor-avatar-row admin-contributor-avatar-row-2'>
          {secondRow.map((i, idx) => (
            <ContributorAvatar key={idx + 4} info={i} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Contributor;
