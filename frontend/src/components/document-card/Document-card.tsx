import './document-card.css';

type DocumentCardProps = {
  id?: string;
  title?: string;
  description?: string;
  term?: string;
  date?: string;
  category?: string;
  variant?: 'default' | 'outlined' | 'elevated';
  onSelect?: () => void;
  onView?: () => void;
  className?: string;
  style?: React.CSSProperties;
};

export default function DocumentCard({
  id,
  title,
  description,
  term,
  category,
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
        {category && <h4 className='document-card-category'>{category}</h4>}
        {title && <h3 className='document-card-title'>{title}</h3>}
        {description && (
          <p className='document-card-description'>{description}</p>
        )}
        {term && <p className='document-card-term'>{term}</p>}
      </div>
      <button
        className='document-card-button'
        onClick={(e) => {
          e.stopPropagation();
          onView?.();
        }}
      >
        View
      </button>
    </div>
  );
}
