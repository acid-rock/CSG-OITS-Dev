import DocumentCard from '../../components/document-card/Document-card';
import Typography from '../../components/typography/Typography';
import './document.css';
import Button from '../../components/button/Button';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import documents from '../../config/documentsConfig.ts';
import DocumentModal from '../../components/document-modal/DocumentModal.tsx';

type DocumentItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  date?: string;
  url?: string;
  memoSrc?: string;
};

export default function Document() {
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleView = (doc: DocumentItem) => {
    setSelectedDoc(doc);
    setIsModalOpen(true);
  };

  return (
    <div className='document-container'>
      <div className='document-layout'>
        <div className='document-texts'>
          <Typography size='text-md' color='text-dark'>
            Comprehensive Document Library
          </Typography>
          <Typography size='text-sm' color='text-ghost'>
            This is where the documents
          </Typography>
        </div>

        <div className='document-grid'>
          {documents.slice(0, 4).map((docu) => (
            <DocumentCard
              key={docu.id}
              id={docu.id}
              title={docu.title}
              description={docu.description}
              date={docu.date}
              variant='default'
              onSelect={() => {}} // no preview panel on this page
              onView={() => handleView(docu)}
            />
          ))}
        </div>

        <div className='view-btn'>
          <Button variant='primary'>
            <Link
              to='/bulletin'
              style={{ textDecoration: 'none', color: 'white' }}
            >
              VIEW ALL
            </Link>
          </Button>
        </div>
      </div>

      {isModalOpen && selectedDoc && (
        <DocumentModal
          selected={{
            title: selectedDoc.title,
            date: selectedDoc.date ?? '',
            memoSrc: selectedDoc.url ?? selectedDoc.memoSrc ?? '',
          }}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedDoc(null);
          }}
        />
      )}
    </div>
  );
}
