import { useState } from 'react';
import './document.css';
import { announcementConfig } from '../announcement/announcementExample';
import FilterSelect from '../../components/filter/Filter';
import Form from '../../components/form/Form';
import DeleteModal from '../../components/modals/deleteModal/DeleteModal';

const filterOptions = ['All', 'Today', 'This Week', 'This Month'];

const Documents = () => {
  const [spinning, setSpinning] = useState(false);
  const [active, setActive] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [sort, setSort] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleActive = (fileName: string) => {
    setActive((prev) =>
      prev.includes(fileName)
        ? prev.filter((name) => name !== fileName)
        : [...prev, fileName]
    );
  };

  const handleRefresh = () => {
    setSpinning(true);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  const handleDelete = (id: string) => {
    fetch(`/api/document/delete/${id}`, { method: 'DELETE' })
      .then((res) => res.json())
      .then(() => setIsModalOpen(false))
      .catch((err) => console.error('Delete error:', err));
  };

  return (
    <div className='docs-container'>
      <div className='docs-header'>
        <span>Documents</span>
      </div>

      <div className='docs-btn-container'>
        <span>{announcementConfig.length} Files</span>
        <button onClick={() => { setOpen(true); setId(null); }}>
          Add Document
        </button>
      </div>

      <div className='docs-file-table'>
        <table>
          <thead>

            <tr className='docs-table-header-black'>
              <th colSpan={6}>
                <div className='docs-toolbar-inner'>
                  <input
                    type='checkbox'
                    checked={active.length === announcementConfig.length}
                    onChange={() => {
                      if (active.length === announcementConfig.length) setActive([]);
                      else setActive(announcementConfig.map((file) => file.fileName));
                    }}
                  />
                  <div className='docs-table-actions'>
                    <FilterSelect options={filterOptions} value={filter} onChange={setFilter} label='Filter' />
                    <FilterSelect options={filterOptions} value={sort} onChange={setSort} label='Sort' />
                    <button className='docs-action-btn' onClick={handleRefresh}>
                      <img
                        src='/refresh.png'
                        alt='refresh'
                        className={spinning ? 'docs-spin' : ''}
                        style={{ width: 20, height: 20 }}
                      />
                    </button>
                  </div>
                </div>
              </th>
            </tr>
            {/* Row 2: Column Titles */}
            <tr className='docs-column-titles'>
              <th style={{ width: '60px' }}></th>
              <th>File Name</th>
              <th>Title</th>
              <th>Description</th>
              <th>Date & Time</th>
              <th style={{ width: '120px' }}></th>
            </tr>
          </thead>
          <tbody>
            {announcementConfig.map((file, idx) => (
              <tr key={idx} className={active.includes(file.fileName) ? 'docs-active' : ''}>
                <td>
                  <input
                    type='checkbox'
                    checked={active.includes(file.fileName)}
                    onChange={() => handleActive(file.fileName)}
                  />
                </td>
                <td>{file.imageName}</td>
                <td>{file.fileName}</td>
                <td className='docs-desc-cell'>{file.description}</td>
                <td>{file.date}</td>
                <td className='docs-file-btn'>
                  <img src='/bin.png' alt='delete' onClick={() => { setId(file.fileName); setIsModalOpen(true); }} />
                  <img src='/edit.png' alt='edit' onClick={() => { setOpen(true); setId(file.fileName); }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className='docs-form-position'>
          <Form forType='document' id={id} setOpen={setOpen} />
        </div>
      )}
      {isModalOpen && (
        <div className='docs-modal-position'>
          <DeleteModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={() => id && handleDelete(id)} />
        </div>
      )}
    </div>
  );
};

export default Documents;