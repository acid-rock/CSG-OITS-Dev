// LatestUpdates.tsx
import './latestupdates.css';
import Typography from '../../components/typography/Typography';
import documents from '../../config/documentsConfig';

const LatestUpdates = () => {
  const latest = [...documents]
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, 3);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

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
              Stay informed with the most recent documents and announcements
              from the Central Student Government of CvSU-Imus Campus.
            </Typography>
          </div>
          <div className='content-cards-container'>
            {latest.map((doc) => (
              <div key={doc.id} className='content-cards'>
                {/* Left: Title and Category */}
                <div className='card-left'>
                  <h3 className='card-title'>{doc.title}</h3>
                  <div className='card-category'>
                    <a href='/bulletin'>{doc.category}</a>
                  </div>
                </div>

                {/* Center: Date */}
                <div className='card-center'>
                  <span className='card-date'>
                    {doc.date ? formatDate(doc.date) : 'N/A'}
                  </span>
                </div>

                {/* Right: View Button */}
                <div className='card-right'>
                  <a href={`/bulletin/${doc.id}`} className='card-view-btn'>
                    View
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LatestUpdates;
