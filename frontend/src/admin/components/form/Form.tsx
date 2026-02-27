import React, { useRef, useState } from 'react';
import './form.css';
import type { Box } from '../pdf-selector-components/pdf-selector';
import PdfSelector from '../pdf-selector-components/pdf-selector';

interface FormProps {
  forType: 'announcement' | 'document';
  id?: string | null;
  initialTitle?: string;
  initialDescription?: string;
  setOpen: (open: boolean) => void;
}

const Form = ({
  forType,
  id,
  initialTitle = '',
  initialDescription = '',
  setOpen,
}: FormProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [showPdfSelector, setShowPdfSelector] = useState(false);

  const [pdf, setPdf] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [selectedBoxes, setSelectedBoxes] = useState<Box[]>([]);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);

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
      // Only send boxes for documents — announcements skip the selector
      if (forType === 'document') {
        formData.append('boxes', JSON.stringify(selectedBoxes));
      }
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
        // Only open the PDF box selector for documents, not announcements
        if (forType === 'document') {
          setShowPdfSelector(true);
        }
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
        <h2>{id ? 'Update File' : 'Add New File'}</h2>
      </div>

      {/* PDF Selector Modal — documents only */}
      {forType === 'document' && showPdfSelector && pdfUrl && (
        <div className='pdf-selector-overlay'>
          <div className='pdf-selector-modal'>
            <div className='pdf-selector-header'>
              <h3>Select areas on PDF</h3>
              <button
                type='button'
                className='btn btn-secondary'
                onClick={() => setShowPdfSelector(false)}
              >
                Done ({selectedBoxes.length} selected)
              </button>
            </div>
            <div className='pdf-selector-body'>
              <PdfSelector fileUrl={pdfUrl} onBoxesChange={setSelectedBoxes} />
            </div>
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
          <label>{forType === 'announcement' ? 'Image' : 'File'}</label>
          <div
            className={`image-preview${preview ? ' has-image' : ''}`}
            id='imagePreview'
            onClick={handleImageClick}
          >
            {!preview ? (
              <div className='image-placeholder'>
                <div className='upload-icon'>📁</div>
                <div className='upload-text'>
                  <strong>Click to upload</strong>
                  <br />
                  {forType === 'announcement' ? 'PNG, JPG, JPEG' : 'PDF files'}
                </div>
              </div>
            ) : preview?.endsWith('.pdf') ? (
              <div className='pdf-preview'>
                <div className='upload-icon'>📄</div>
                <div className='upload-text'>{preview}</div>
                {/* Edit selections button only shown for documents */}
                {forType === 'document' && (
                  <>
                    {selectedBoxes.length > 0 && (
                      <div className='pdf-selected-count'>
                        ✓ {selectedBoxes.length} area(s) selected
                      </div>
                    )}
                    <button
                      type='button'
                      className='btn btn-edit-selections'
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPdfSelector(true);
                      }}
                    >
                      Edit selections
                    </button>
                  </>
                )}
              </div>
            ) : (
              <img id='previewImage' alt='Preview' src={preview} />
            )}
          </div>
          <input
            type='file'
            ref={fileInputRef}
            title='Select a file to upload'
            accept={forType === 'announcement' ? 'image/*' : 'application/pdf'}
            onChange={handleFileChange}
            className='file-input-hidden'
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
            {id ? 'Update' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Form;