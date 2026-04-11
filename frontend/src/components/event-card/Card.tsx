import './card.css';

type CardProps = {
  id?: string;
  title?: string;
  description?: string;
  image?: string;
  date?: string;
  action?: string;
  variant?: 'default' | 'outlined' | 'elevated' | 'announcement-card';
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
};

export default function Card({
  id,
  title,
  description,
  action,
  image,
  date,
  variant = 'default',
  onClick,
  style,
}: CardProps) {
  return (
    <div
      id={id}
      className={`event-card ${variant}`}
      style={style}
      onClick={onClick}
    >
      {image && (
        <div className='event-card-image'>
          <img src={image} alt={title} />
        </div>
      )}
      <div className='event-card-content'>
        {date && <p className='event-card-date'>{date}</p>}
        {title && <h3 className='event-card-title'>{title}</h3>}
        {description && <p className='event-card-description'>{description}</p>}
        {action && <p className='event-card-action'>{action || "View"}</p>}
      </div>
    </div>
  );
}
