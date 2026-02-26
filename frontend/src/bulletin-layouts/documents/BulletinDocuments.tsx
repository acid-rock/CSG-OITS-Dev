import { useState } from 'react';
import DocumentCard from '../../components/document-card/Document-card';
import documents from '../../config/documentsConfig.ts';
import './bulletinDocument.css';
import Typography from '../../components/typography/Typography';
import DocumentModal from '../../components/document-modal/DocumentModal.tsx';

type DocumentItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  date?: string;
  url?: string;
  size?: string;
  type?: string;
  memoSrc?: string;
};

export default function BulletinDocument() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem>(
    documents[0]
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Derive unique categories directly from the documents array
  const uniqueCategories = Array.from(
    new Set(documents.map((doc) => doc.category))
  );

  const categories = [
    { id: 'all', label: 'All Documents' },
    ...uniqueCategories.map((cat) => ({ id: cat, label: cat })),
  ];

  // Filter documents by selected category
  const filteredDocuments =
    selectedCategory === 'all'
      ? documents
      : documents.filter((doc) => doc.category === selectedCategory);

  // Clicking a card updates the preview panel
  const handleSelect = (doc: DocumentItem) => {
    setSelectedDocument(doc);
  };

  // Clicking "View" opens the modal
  const handleView = (doc: DocumentItem) => {
    setSelectedDocument(doc);
    setIsModalOpen(true);
  };

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
              {filteredDocuments.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  id={doc.id}
                  title={doc.title}
                  description={doc.description}
                  date={doc.date}
                  onSelect={() => handleSelect(doc)}
                  onView={() => handleView(doc)}
                />
              ))}
            </div>
          </main>
        </div>

        {/* Always Visible Document Preview Panel */}
        <aside className='bulletin-preview-panel'>
          <div className='bulletin-preview-content'>
            <div className='bulletin-preview-body'>
              {selectedDocument.date && (
                <p className='bulletin-preview-date'>{selectedDocument.date}</p>
              )}
              <h2 className='bulletin-preview-title'>
                {selectedDocument.title}
              </h2>
              <p className='bulletin-preview-description'>
                {selectedDocument.description}
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* Modal for document preview */}
      {isModalOpen && (
        <DocumentModal
          selected={{
            title: selectedDocument.title,
            date: selectedDocument.date ?? '',
            memoSrc: selectedDocument.url ?? selectedDocument.memoSrc ?? '',
          }}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </section>
  );
}
