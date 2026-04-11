import React, { useRef, useState } from 'react';
import './form.css';
import type { Box } from '../pdf-selector-components/pdf-selector';
import PdfSelector from '../pdf-selector-components/pdf-selector';

interface FormProps {
  forType: 'announcement' | 'document' | 'events' | 'inventory';
  id?: string | null;
  initialTitle?: string;
  Images?: string[];
  initialDescription?: string;
  inventoryQuantity?: number;
  setOpen: (open: boolean) => void;
}

const Form = ({
  forType,
  id,
  initialTitle = '',
  Images,
  inventoryQuantity,
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
  const [eventFiles, setEventFiles] = useState<File[]>([]);
  const [quantity, setQuantity] = useState(inventoryQuantity || 0);
  const [status, setStatus] = useState('in-stock');

  const url =
    forType === 'announcement'
      ? `/api/announcement/${id ? `update/${id}` : 'upload'}`
      : `/api/document/${id ? `update/${id}` : 'upload'}`;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();

    formData.append('title', title);

    if (forType !== 'inventory') {
      formData.append('description', description);
    }

    if (forType === 'inventory') {
      formData.append('quantity', quantity.toString());
      formData.append('status', status);
    }

    if (forType === 'events') {
      eventFiles.forEach((file) => formData.append('files', file));
    }

    if (pdf && forType === 'document') {
      formData.append('file', pdf);
    }

    fetch(url, {
      method: 'POST',
      body: formData,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (forType === 'events') {
      setEventFiles(Array.from(files));
      return;
    }

    const file = files[0];

    if (file) {
      if (file.type === 'application/pdf') {
        setPreview(file.name);
        setPdf(file);
        setPdfUrl(URL.createObjectURL(file));
        setShowPdfSelector(true);
      } else {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => setPreview(reader.result as string);
        setPdf(null);
        setPdfUrl(null);
        setShowPdfSelector(false);
      }
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

      <form
        className={`form-layout ${forType === 'inventory' ? 'inventory-form' : ''}`}
        onSubmit={handleSubmit}
      >
        <div className='form-fields'>
          <div className='form-group'>
            <label htmlFor='title'>
              {forType === 'inventory' ? 'Equipment Name' : 'Title'}
            </label>
            <input
              type='text'
              id='title'
              placeholder={
                forType === 'inventory'
                  ? 'e.g., Laptop, Monitor'
                  : 'System Maintenance'
              }
              name='title'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {forType !== 'inventory' && (
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
          )}

          {forType === 'inventory' && (
            <div className='inventory-fields'>
              <div className='form-group'>
                <label htmlFor='quantity'>Quantity</label>
                <input
                  id='quantity'
                  type='number'
                  placeholder='0'
                  min={0}
                  value={quantity}
                  name='quantity'
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className='inventory-input'
                />
              </div>

              <div className='form-group'>
                <label htmlFor='status'>Status</label>
                <select
                  id='status'
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className='inventory-select'
                >
                  <option value='in-stock'>In Stock</option>
                  <option value='out-of-stock'>Out of Stock</option>
                  <option value='low-stock'>Low Stock</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {forType !== 'inventory' && (
          <div className='image-upload'>
            <label>
              {forType === 'announcement'
                ? 'Image'
                : forType === 'events'
                  ? 'Images'
                  : 'File'}
            </label>

            {forType === 'events' ? (
              <div
                className={`image-preview${eventFiles.length > 0 ? ' has-image' : ''}`}
                onClick={handleImageClick}
              >
                {eventFiles.length === 0 && !Images?.length ? (
                  <div className='image-placeholder'>
                    <div className='upload-icon'>📁</div>
                    <div className='upload-text'>
                      <strong>Click to upload</strong>
                      <br />
                      PNG, JPG, JPEG (min. 5 images)
                    </div>
                  </div>
                ) : (
                  <div className='events-file-list'>
                    {eventFiles.length > 0
                      ? eventFiles.map((file, i) => (
                          <div key={i} className='events-file-list-item'>
                            <span className='events-file-name'>
                              {file.name}
                            </span>
                          </div>
                        ))
                      : Images?.map((file, i) => (
                          <div key={i} className='events-file-list-item'>
                            <span className='events-file-name'>{file}</span>
                          </div>
                        ))}
                  </div>
                )}
              </div>
            ) : (
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
                      {forType === 'announcement'
                        ? 'PNG, JPG, JPEG'
                        : 'PDF files'}
                    </div>
                  </div>
                ) : preview?.endsWith('.pdf') ? (
                  <div className='pdf-preview'>
                    <div className='upload-icon'>📄</div>
                    <div className='upload-text'>{preview}</div>
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
            )}

            <input
              type='file'
              ref={fileInputRef}
              multiple={forType === 'events'}
              title='Select a file to upload'
              accept={
                forType === 'announcement'
                  ? 'image/*'
                  : forType === 'events'
                    ? 'image/*'
                    : 'application/pdf'
              }
              onChange={handleFileChange}
              className='file-input-hidden'
            />

            {forType === 'events' && (
              <p className='form-file-hint'>
                {eventFiles.length} image{eventFiles.length !== 1 ? 's' : ''}{' '}
                selected
              </p>
            )}
          </div>
        )}

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
