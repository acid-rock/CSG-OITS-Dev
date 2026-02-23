import { useState } from 'react';
import DocumentCard from '../../components/document-card/Document-card';
import bulletinDocuments from '../../config/bulletin-documents';
import './bulletinDocument.css';
import Typography from '../../components/typography/Typography';

type DocumentItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  date?: string;
  image?: string;
  url?: string;
  size?: string;
  type?: string;
};

export default function BulletinDocument() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(
    null
  );

  const categories = [
    { id: 'all', label: 'All Documents' },
    { id: 'minutes', label: 'Meeting Minutes' },
    { id: 'reports', label: 'Reports' },
    { id: 'policies', label: 'Policies' },
  ];

  const filteredDocuments = () => {
    return selectedCategory === 'all'
      ? bulletinDocuments
      : bulletinDocuments.filter((doc) => doc.category === selectedCategory);
  };

  const handleDocumentClick = (doc: DocumentItem) => {
    setSelectedDocument(doc);
  };

  const displayedDocument = selectedDocument || bulletinDocuments[0];

  return (
    <section id='documents' className='bulletin-document-container'>
      <div className='bulletin-document-header'>
        <Typography size='text-md' color='text-dark'>
          Documents
        </Typography>
        <Typography size='text-sm' color='text-ghost'>
          Explore official documents from student government
        </Typography>
      </div>
      <div className='bulletin-document-layout-wrapper'>
        <div className='bulletin-document-layout'>
          {/* Sidebar Navigation */}
          <aside className='bulletin-document-navigation'>
            <Typography size='text-sm' color='text-dark'>
              Categories
            </Typography>
            <nav className='bulletin-nav-menu'>
              {categories.map((category) => (
                <button
                  key={category.id}
                  type='button'
                  className={`bulletin-nav-item ${
                    selectedCategory === category.id ? 'active' : ''
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Document Grid */}
          <main className='bulletin-document-content'>
            <div className='bulletin-document-grid'>
              {filteredDocuments().map((doc: DocumentItem) => (
                <DocumentCard
                  key={doc.id}
                  id={doc.id}
                  title={doc.title}
                  description={doc.description}
                  date={doc.date}
                  image={doc.image}
                  onClick={() => handleDocumentClick(doc)}
                />
              ))}
            </div>
          </main>
        </div>

        {/* Always Visible Document Preview Panel */}
        <aside className='bulletin-preview-panel'>
          <div className='bulletin-preview-content'>
            {/* Image Section */}
            <div className='bulletin-preview-image'>
              {displayedDocument.image ? (
                <img
                  src={displayedDocument.image}
                  alt={displayedDocument.title}
                />
              ) : (
                <div className='bulletin-preview-placeholder'>
                  <svg
                    width='64'
                    height='64'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                  >
                    <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
                    <polyline points='14 2 14 8 20 8' />
                    <line x1='16' y1='13' x2='8' y2='13' />
                    <line x1='16' y1='17' x2='8' y2='17' />
                  </svg>
                </div>
              )}
            </div>

            {/* Text Section */}
            <div className='bulletin-preview-body'>
              {displayedDocument.date && (
                <p className='bulletin-preview-date'>
                  {displayedDocument.date}
                </p>
              )}
              <h2 className='bulletin-preview-title'>
                {displayedDocument.title}
              </h2>
              <p className='bulletin-preview-description'>
                {displayedDocument.description}
              </p>

              <button
                type='button'
                className='bulletin-preview-download-btn'
                onClick={() =>
                  displayedDocument.url &&
                  window.open(displayedDocument.url, '_blank')
                }
              >
                Download Document{' '}
                {displayedDocument.size && `(${displayedDocument.size})`}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
