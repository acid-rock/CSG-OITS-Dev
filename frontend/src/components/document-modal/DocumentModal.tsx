import './documentmodal.css';

type DocumentModalProps = {
  selected: {
    title: string;
    date: string;
    memoSrc: string;
  } | null;
  forType?: 'letter';
  onClose: () => void;
};

export default function DocumentModal({
  selected,
  forType,
  onClose,
}: DocumentModalProps) {
  if (!selected) return null;

  return (
    <div className='overlay' onClick={onClose}>
      <div className='modal' onClick={(e) => e.stopPropagation()}>
        <button className='modal__close' onClick={onClose}>
          ✕
        </button>
        <iframe
          className='modal__iframe'
          src={`${selected.memoSrc}#toolbar=${forType === 'letter' ? 1 : 0}&navpanes=0&scrollbar=1&view=FitH`}
          title={selected.title}
        />
      </div>
    </div>
  );
}
