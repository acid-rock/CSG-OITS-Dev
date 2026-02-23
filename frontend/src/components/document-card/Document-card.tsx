import './document-card.css';

type DocumentCardProps = {
  id?: string;
  title?: string;
  description?: string;
  image?: string;
  date?: string;
  variant?: 'default' | 'outlined' | 'elevated';
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
};

export default function DocumentCard({
  id,
  title,
  description,
  image,
  date,
  variant = 'default',
  onClick,
  style,
}: DocumentCardProps) {
  return (
    <div
      id={id}
      className={`document-card ${variant}`}
      style={style}
      onClick={onClick}
    >
      {image && (
        <div className='document-card-image'>
          <img src={image} alt={title} />
        </div>
      )}
      <div className='document-card-content'>
        {title && <h3 className='document-card-title'>{title}</h3>}
        {date && <p className='document-card-date'>{date}</p>}
        {description && (
          <p className='document-card-description'>{description}</p>
        )}
      </div>
      <button className='document-card-button' onClick={onClick}>
        View
      </button>
    </div>
  );
}
