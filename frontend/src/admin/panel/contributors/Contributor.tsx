import './contributor.css';

export const contributorConfig = [
  {
    img: 'https://randomuser.me/api/portraits/men/32.jpg',
    name: 'Ralph Kenneth B. Perez',
    position: 'UI/UX Designer',
    bio: 'Specializes in server-side logic and database design.',
  },
  {
    img: 'https://randomuser.me/api/portraits/men/32.jpg',
    name: 'Jerald D. Estrella',
    position: 'Front-End Developer',
    bio: 'Specializes in server-side logic and database design.',
  },
  {
    img: 'https://randomuser.me/api/portraits/men/32.jpg',
    name: 'Taisei Domingo',
    position: 'Front-End Developer',
    bio: 'Specializes in server-side logic and database design.',
  },
  {
    img: 'https://randomuser.me/api/portraits/men/32.jpg',
    name: 'Lorenz E. Tuboro',
    position: 'Back-End Developer',
    bio: 'Specializes in server-side logic and database design.',
  },
  {
    img: 'https://randomuser.me/api/portraits/men/32.jpg',
    name: 'John Harold D. Magma',
    position: 'Quality Assurance Officer',
    bio: 'Specializes in server-side logic and database design.',
  },
  {
    img: 'https://randomuser.me/api/portraits/men/32.jpg',
    name: 'Ivan P. Duran',
    position: 'Project Head',
    bio: 'Specializes in server-side logic and database design.',
  },
  {
    img: 'https://randomuser.me/api/portraits/men/32.jpg',
    name: 'Gerald D. Alansalon',
    position: 'Documentation Officer',
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
