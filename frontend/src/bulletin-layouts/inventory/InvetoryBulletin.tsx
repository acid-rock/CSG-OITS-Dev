import './InventoryBulletin.css';
import { inventoryConfig } from '../../admin/panel/inventory/inventoryData';
import { useState } from 'react';
import DocumentModal from '../../components/document-modal/DocumentModal';
import documents from '../../config/documentsConfig';
import type { DocumentItem } from '../documents/BulletinDocuments';

const InventoryBulletin = () => {
  const [openLetter, setOpenLetter] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem>(
    documents[0]
  );

  return (
    <div className='inventory-bulletin-container'>
      <div className='inventory-header'>
        <h1>Inventory</h1>
        <p>
          Access the latest announcements and proceedings of the Central Student
          Government.
        </p>
      </div>
      <div className='letter-container'>
        {openLetter && (
          <DocumentModal
            selected={{
              title: selectedDocument.title,
              date: selectedDocument.date ?? '',
              memoSrc: selectedDocument.url ?? selectedDocument.memoSrc ?? '',
            }}
            forType='letter'
            onClose={() => setOpenLetter(false)}
          />
        )}
      </div>
      <div className='inventory-main-content'>
        <table>
          <thead>
            <tr className='table-header-black'>
              <th>Equipment</th>
              <th>Quantity</th>
              <th>Status</th>
            </tr>
          </thead>
          {inventoryConfig.map((data) => (
            <tbody>
              <tr>
                <td>
                  <img src={data.image} alt='' className='item-image' />
                  <p>{data.name}</p>
                </td>
                <td>{data.quantity}</td>
                {data.status ? (
                  <td style={{ color: 'green' }}>Available</td>
                ) : (
                  <td style={{ color: 'red' }}>Unavailable</td>
                )}
              </tr>
            </tbody>
          ))}
        </table>
      </div>
    </div>
  );
};

export default InventoryBulletin;

{
  /*add the css for table*/
}
