import './latestupdates.css';
import Typography from '../../components/typography/Typography';

const LatestUpdates = () => {
  return (
    <div className='latest-container'>
      <div className='latest-layout'>
        <div className='latest-content'>
          <div className='content-text'>
            <Typography color='text-dark' size='text-xl'>
              Latest Updates
            </Typography>
            <Typography
              color='text-dark'
              size='text-s'
              style={{ fontWeight: 'normal' }}
            >
              Lorem ipsum dolor sit, amet consectetur adipisicing elit. Rerum ea
              debitis esse, unde dignissimos praesentium minima, placeat quos
              accusantium illum sapiente! Aperiam molestiae iusto eius dolores
              repellendus quis optio ex.
            </Typography>
          </div>
          <div className='content-cards-container'>
            <div className='content-cards'>
              <div className='cards-link'>
                <a href=''>Category</a>
              </div>
              <div className='cards-text'>
                <Typography color='text-dark' size='text-xs'>
                  Lorem ipsum dolor sit amet consectetur adipisicing elit.
                  Repudiandae, consequatur. Labore magni, vitae rem architecto
                  eum molestias aspernatur eveniet delectus, quibusdam odio
                  inventore beatae reiciendis itaque ipsum dolorem tempora
                  provident.
                </Typography>
              </div>
            </div>
            <div className='content-cards'>
              <div className='cards-link'>
                <a href=''>Category</a>
              </div>
              <div className='cards-text'>
                <Typography color='text-dark' size='text-xs'>
                  Lorem ipsum dolor sit amet consectetur adipisicing elit.
                  Repudiandae, consequatur. Labore magni, vitae rem architecto
                  eum molestias aspernatur eveniet delectus, quibusdam odio
                  inventore beatae reiciendis itaque ipsum dolorem tempora
                  provident.
                </Typography>
              </div>
            </div>
            <div className='content-cards'>
              <div className='cards-link'>
                <a href=''>Category</a>
              </div>
              <div className='cards-text'>
                <Typography color='text-dark' size='text-xs'>
                  Lorem ipsum dolor sit amet consectetur adipisicing elit.
                  Repudiandae, consequatur. Labore magni, vitae rem architecto
                  eum molestias aspernatur eveniet delectus, quibusdam odio
                  inventore beatae reiciendis itaque ipsum dolorem tempora
                  provident.
                </Typography>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LatestUpdates;
