import './InventoryBulletin.css';
import { inventoryConfig } from '../../admin/panel/inventory/inventoryData';
import { useState } from 'react';
import DocumentModal from '../../components/document-modal/DocumentModal';
import requestletter from '../../assets/proposal/proposal1.pdf';
import Typography from '../../components/typography/Typography';

const InventoryBulletin = () => {
  const [openLetter, setOpenLetter] = useState(false);
  const selectedDocument = {
    title: 'Request Letter',
    date: '2024-01-15',
    url: requestletter,
  };

  return (
    <div className='inventory-bulletin-container'>
      {/* Header */}
      <div className='about-text-layout'>
        <div className='about-texts'>
          <Typography size='text-md' color='text-dark'>
            Inventory
          </Typography>
          <Typography size='text-light' color='text-ghost'>
            Browse equipment available for borrowing
          </Typography>
        </div>
      </div>

      {/* Document Modal */}
      <div className='letter-container'>
        {openLetter && (
          <DocumentModal
            selected={{
              title: selectedDocument.title,
              date: selectedDocument.date ?? '',
              memoSrc: selectedDocument.url,
            }}
            forType='letter'
            onClose={() => setOpenLetter(false)}
          />
        )}
      </div>

      {/* Table wrapper */}
      <div className='inventory-main-content'>
        {/* Toolbar */}
        <div className='inventory-toolbar'>
          <p className='inventory-toolbar-label'>
            {inventoryConfig.length} items total
          </p>
          <button className='print-btn' onClick={() => setOpenLetter(true)}>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='15'
              height='15'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <polyline points='6 9 6 2 18 2 18 9' />
              <path d='M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2' />
              <rect x='6' y='14' width='12' height='8' />
            </svg>
            Print Request Letter
          </button>
        </div>

        <table>
          <thead>
            <tr>
              <th>Equipment</th>
              <th>Quantity</th>
              <th>Status</th>
            </tr>
          </thead>
          {inventoryConfig.map((data) => (
            <tbody key={data.id}>
              <tr>
                <td>
                  <div className='item-cell'>
                    <img src={data.image} alt='' className='item-image' />
                    <p className='item-name'>{data.name}</p>
                  </div>
                </td>
                <td>{data.quantity}</td>
                <td>
                  {data.status ? (
                    <span className='status-badge available'>
                      <span className='status-dot' />
                      Available
                    </span>
                  ) : (
                    <span className='status-badge unavailable'>
                      <span className='status-dot' />
                      Unavailable
                    </span>
                  )}
                </td>
              </tr>
            </tbody>
          ))}
        </table>
      </div>
    </div>
  );
};

export default InventoryBulletin;
