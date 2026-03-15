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

  const scroll = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className='document-container'>
      <div className='document-layout'>
        <div className='document-texts'>
          <Typography size='text-md' color='text-white'>
            Comprehensive Document Library
          </Typography>
          <Typography size='text-sm' color='text-white'>
            Explore our comprehensive library of official documents, memos, and
            reports.
          </Typography>
        </div>

        <div className='document-grid'>
          {documents.slice(0, 4).map((docu) => (
            <DocumentCard
              key={docu.id}
              id={docu.id}
              category={docu.category}
              title={docu.title}
              description={docu.description}
              term={docu.term}
              date={docu.date}
              variant='default'
              onSelect={() => {}}
              onView={() => handleView(docu)}
            />
          ))}
        </div>

        <div className='view-btn'>
          <Button variant='primary'>
            <Link
              to='/bulletin'
              style={{ textDecoration: 'none', color: 'white' }}
              onClick={scroll}
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
