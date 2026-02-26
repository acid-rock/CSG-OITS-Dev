import './settingsForm.css';
import { useState, useRef } from 'react';
import ConfimationModal from '../../modals/confirmationModal/ConfimationModal';

interface settingsForm {
  setEdit: (open: boolean) => void;
}

const SettingsForm = ({ setEdit }: settingsForm) => {
  const [confirmModal, setConfirmModal] = useState(false);

  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }

    setPreview(null);
  };

  const handleSubmit = () => {
    /*fetch request to save*/
    setConfirmModal(false);
  };

  return (
    <div className='settings-form-container'>
      <form action=''>
        <div className='form-group'>
          <label htmlFor='system-name'>System Name:</label>
          <input type='text' name='system-name' title='system-name' />
        </div>
        <div className='image-upload'>
          <label htmlFor='file'>System Logo:</label>
          <div
            className={`image-preview${preview ? ' has-image' : ''}`}
            id='imagePreview'
            onClick={handleImageClick}
          >
            {!preview ? (
              <div className='image-placeholder'>
                <div className='upload-icon'>📁</div>

                <div className='upload-text'>
                  <strong>Click to upload</strong> or drag and drop
                  <br />
                  PNG, JPG up to 10MB
                </div>
              </div>
            ) : (
              <img id='previewImage' alt='Preview' src={preview} />
            )}
          </div>
          <input
            type='file'
            id='fileInput'
            accept='image/*'
            ref={fileInputRef}
            name='file'
            placeholder='image'
            onChange={handleFileChange}
          />
        </div>
        <div className='form-actions'>
          <button
            type='button'
            className='btn btn-cancel'
            onClick={() => setEdit(false)}
          >
            Cancel
          </button>
          <button
            className='btn btn-submit'
            type='button'
            onClick={() => setConfirmModal(true)}
          >
            Save
          </button>
        </div>
      </form>
      {confirmModal && (
        <ConfimationModal
          onClose={() => setConfirmModal(false)}
          onConfirm={handleSubmit}
        />
      )}
    </div>
  );
};

export default SettingsForm;
