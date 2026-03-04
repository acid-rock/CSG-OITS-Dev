import './contributorAvatar.css';

interface avatarProps {
  img: string;
  name: string;
  position: string;
  bio: string;
}

const ContributorAvatar = ({ info }: { info: avatarProps }) => {
  return (
    <div className='avatar-container'>
      <img src={info.img} alt='' />
      <div className='avatar-details'>
        <span className='avatar-name'>{info.name}</span>
        <span className='avatar-positon'>{info.position}</span>
        <span className='avatar-bio'>{info.bio}</span>
      </div>
    </div>
  );
};

export default ContributorAvatar;
