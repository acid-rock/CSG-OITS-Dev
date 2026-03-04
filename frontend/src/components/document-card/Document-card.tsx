import './document-card.css';

type DocumentCardProps = {
  id?: string;
  title?: string;
  description?: string;
  date?: string;
  variant?: 'default' | 'outlined' | 'elevated';
  onSelect?: () => void; // clicking the card → updates preview
  onView?: () => void; // clicking "View" → opens modal
  className?: string;
  style?: React.CSSProperties;
};

export default function DocumentCard({
  id,
  title,
  description,
  date,
  variant = 'default',
  onSelect,
  onView,
  style,
}: DocumentCardProps) {
  return (
    <div
      id={id}
      className={`document-card ${variant}`}
      style={style}
      onClick={onSelect}
    >
      <div className='document-card-content'>
        {title && <h3 className='document-card-title'>{title}</h3>}
        {date && <p className='document-card-date'>{date}</p>}
        {description && (
          <p className='document-card-description'>{description}</p>
        )}
      </div>
      <button
        className='document-card-button'
        onClick={(e) => {
          e.stopPropagation(); // prevent card's onSelect from firing
          onView?.();
        }}
      >
        View
      </button>
    </div>
  );
}
