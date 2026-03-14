import React from 'react';
import './modal.css';

interface ModalProps {
  isOpen: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  imageSrc: string;
  imageAlt: string;
  date: string;
  title: string;
  description: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  setOpen,
  imageSrc,
  imageAlt,
  date,
  title,
  description,
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setOpen(false);
    }
  };

  const handleCloseClick = () => {
    setOpen(false);
  };

  return (
    <div className='modal-backdrop' onClick={handleBackdropClick}>
      <div className='modal-container'>
        <button className='modal-close-btn' onClick={handleCloseClick}>
          ×
        </button>

        <div className='modal-content'>
          <div className='modal-image-section'>
            <img src={imageSrc} alt={imageAlt} className='modal-image' />
          </div>

          <div className='modal-text-section'>
            <h2 className='modal-title'>{title}</h2>
            <p className='modal-date'>{date}</p>
            <p className='modal-description'>{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
