import React, { useRef, useState } from 'react';
import './form.css';
import type { Box } from '../pdf-selector-components/pdf-selector';
import PdfSelector from '../pdf-selector-components/pdf-selector';

interface FormProps {
  forType: 'announcement' | 'document';
  id?: string | null;
  setOpen: (open: boolean) => void;
}

const Form = ({ forType, id, setOpen }: FormProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [showPdfSelector, setShowPdfSelector] = useState(false);

  const [pdf, setPdf] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [selectedBoxes, setSelectedBoxes] = useState<Box[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const url =
    forType === 'announcement'
      ? `/api/announcement/${id ? `update/${id}` : 'upload'}`
      : `/api/document/${id ? `update/${id}` : 'upload'}`;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();

    formData.append('title', title);
    formData.append('description', description);

    if (pdf) {
      formData.append('file', pdf);
      formData.append('boxes', JSON.stringify(selectedBoxes));
    }

    fetch(url, {
      method: 'POST',
      body: formData,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        setPreview(file.name);
        setPdf(file);
        setPdfUrl(URL.createObjectURL(file));
        setShowPdfSelector(true);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(file);
        setPdf(null);
        setPdfUrl(null);
        setShowPdfSelector(false);
      }
    } else {
      setPreview(null);
      setPdf(null);
      setPdfUrl(null);
      setShowPdfSelector(false);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className='form-container'>
      <div className='form-header'>
        <h2>Add New File</h2>
      </div>

      {/* PDF Selector Modal */}
      {showPdfSelector && pdfUrl && (
        <div
          className='pdf-selector-overlay'
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            className='pdf-selector-modal'
            style={{
              backgroundColor: 'white',
              padding: '1rem',
              borderRadius: '8px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '1rem',
              }}
            >
              <h3>Select areas on PDF</h3>
              <button
                type='button'
                onClick={() => setShowPdfSelector(false)}
                style={{ padding: '0.5rem 1rem' }}
              >
                Done ({selectedBoxes.length} selected)
              </button>
            </div>
            <PdfSelector fileUrl={pdfUrl} onBoxesChange={setSelectedBoxes} />
          </div>
        </div>
      )}

      <form className='form-layout' onSubmit={handleSubmit}>
        <div className='form-fields'>
          <div className='form-group'>
            <label htmlFor='title'>Title</label>
            <input
              type='text'
              id='title'
              placeholder='System Maintenance'
              name='title'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className='form-group'>
            <label htmlFor='description'>Description</label>
            <textarea
              id='description'
              name='description'
              placeholder='Scheduled maintenance for system updates...'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>
        </div>

        <div className='image-upload'>
          <label>{forType === 'document' ? 'File' : 'PDF'}</label>
          <div
            className={`image-preview${preview ? ' has-image' : ''}`}
            id='imagePreview'
            onClick={handleImageClick}
            style={{ cursor: 'pointer' }}
          >
            {!preview ? (
              <div className='image-placeholder'>
                <div className='upload-icon'>📁</div>
                <div className='upload-text'>
                  <strong>Click to upload</strong>
                  <br />
                  PDF files
                </div>
              </div>
            ) : preview?.endsWith('.pdf') ? (
              <div className='pdf-preview'>
                <div className='upload-icon'>📄</div>
                <div className='upload-text'>{preview}</div>
                {selectedBoxes.length > 0 && (
                  <div style={{ marginTop: '0.5rem', color: 'green' }}>
                    ✓ {selectedBoxes.length} area(s) selected
                  </div>
                )}
                <button
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPdfSelector(true);
                  }}
                  style={{ marginTop: '0.5rem' }}
                >
                  Edit selections
                </button>
              </div>
            ) : (
              <img id='previewImage' alt='Preview' src={preview} />
            )}
          </div>
          <input
            type='file'
            ref={fileInputRef}
            title='Select a file to upload'
            accept='application/pdf'
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>

        <div className='form-actions'>
          <button
            type='button'
            className='btn btn-cancel'
            onClick={() => setOpen(false)}
          >
            Cancel
          </button>
          <button type='submit' className='btn btn-submit'>
            Post
          </button>
        </div>
      </form>
    </div>
  );
};

export default Form;
