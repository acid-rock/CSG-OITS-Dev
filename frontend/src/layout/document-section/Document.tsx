import DocumentCard from '../../components/document-card/Document-card';
import Typography from '../../components/typography/Typography';
import './document.css';
import Button from '../../components/button/Button';
import documents from '../../config/documentsConfig';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import Modal from '../../components/modal/Modal';

export default function Document() {
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleView = (doc: any) => {
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
          {documents.map((docu) => (
            <DocumentCard
              id={docu.id}
              title={docu.title}
              description={docu.description}
              date={docu.date}
              image={docu.image}
              variant='default'
              onClick={() => handleView(docu.id)}
            />
          ))}
        </div>
        <div className='view-btn'>
          <Button variant='primary'>
            <Link
              to='/bulletin'
              style={{
                textDecoration: 'none',
                color: 'white',
              }}
            >
              VIEW ALL
            </Link>
          </Button>
        </div>
      </div>
      {isModalOpen && selectedDoc && (
        <Modal
          isOpen={isModalOpen}
          setOpen={setIsModalOpen}
          imageSrc={selectedDoc.image}
          imageAlt={selectedDoc.title}
          date={selectedDoc.date}
          title={selectedDoc.title}
          description={selectedDoc.fullContent || selectedDoc.description} // Show full text
        />
      )}
    </div>
  );
}
