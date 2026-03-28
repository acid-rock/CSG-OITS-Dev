import { useState } from 'react';
import './Eventpanel.css';
import { eventData } from './EventExample';
import FilterSelect from '../../components/filter/Filter';
import Form from '../../components/form/Form';
import DeleteModal from '../../components/modals/deleteModal/DeleteModal';
import Actionbar from '../../components/action-bar/Actionbar';

const filterOptions = ['All', 'Today', 'This Week', 'This Month'];
const sortOptions = [
  'Name (A-Z)',
  'Name (Z-A)',
  'Date (Newest)',
  'Date (Oldest)',
];

const filterByDate = (date: string, filter: string): boolean => {
  if (!filter || filter === 'All') return true;
  const fileDate = new Date(date);
  const now = new Date();
  if (filter === 'Today') return fileDate.toDateString() === now.toDateString();
  if (filter === 'This Week') {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return fileDate >= startOfWeek;
  }
  if (filter === 'This Month') {
    return (
      fileDate.getMonth() === now.getMonth() &&
      fileDate.getFullYear() === now.getFullYear()
    );
  }
  return true;
};

type eventData = {
  fileName: string;
  description: string;
  selectedImages: string[];
  date: string;
};

const Eventpanel = () => {
  const [openModalForm, setOpenModalForm] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);

  //filter and selection of events
  const [active, setActive] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [sort, setSort] = useState<string>('');

  //for modal data
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [images, setEditImages] = useState<string[]>([]);

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

  const editData = (file: eventData) => {
    setId(file.fileName);
    setEditTitle(file.fileName);
    setEditDescription(file.description);
    setEditImages(file.selectedImages);
    setOpenModalForm(true);
  };

  return (
    <div className='events-container'>
      <div className='events-header'>
        <span>Events</span>
      </div>
      <div className='events-toolbar'>
        <span className='events-file-count'>{eventData.length} Files</span>
        <div className='events-toolbar-actions'>
          <FilterSelect
            options={filterOptions}
            value={filter}
            onChange={setFilter}
            label='Filter'
          />
          <FilterSelect
            options={sortOptions}
            value={sort}
            onChange={setSort}
            label='Sort'
          />
          <button
            className='events-action-btn events-refresh-btn'
            title='Refresh'
            onClick={handleRefresh}
          >
            <img
              src='/refresh.png'
              alt='refresh'
              className={spinning ? 'events-spin refresh-img' : 'refresh-img'}
            />
          </button>
          <button
            className='events-add-btn'
            onClick={() => {
              setId(null);
              setEditTitle('');
              setEditDescription('');
              setOpenModalForm(true);
            }}
          >
            Add Document
          </button>
        </div>
      </div>
      {active.length >= 3 && (
        <Actionbar
          items={active.length}
          selectedIds={active}
          source='announcement'
        />
      )}
      <div className='events-file-table'>
        <table>
          <colgroup>
            <col className='col-checkbox' />
            <col className='col-image' />
            <col className='col-filename' />
            <col className='col-description' />
            <col className='col-date' />
            <col className='col-actions' />
          </colgroup>
          <thead>
            <tr className='events-table-header-light'>
              <th>
                <input
                  type='checkbox'
                  title='Select All'
                  checked={active.length === eventData.length}
                  onChange={() => {
                    if (active.length === eventData.length) {
                      setActive([]);
                    } else {
                      setActive(eventData.map((file) => file.fileName));
                    }
                  }}
                />
              </th>
              <th>title</th>
              <th>Selected Images</th>
              <th>Description</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {eventData
              .filter((file) => filterByDate(file.date, filter))
              .sort((a, b) => {
                if (sort === 'Name (A-Z)')
                  return a.fileName.localeCompare(b.fileName);
                if (sort === 'Name (Z-A)')
                  return b.fileName.localeCompare(a.fileName);
                if (sort === 'Date (Newest)')
                  return (
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                  );
                if (sort === 'Date (Oldest)')
                  return (
                    new Date(a.date).getTime() - new Date(b.date).getTime()
                  );
                return 0;
              })
              .map((file, idx) => (
                <tr
                  key={idx}
                  className={`events-table-row ${active.includes(file.fileName) ? 'events-active' : ''}`}
                >
                  <td>
                    <input
                      className='checkbox'
                      type='checkbox'
                      title={`Select ${file.fileName}`}
                      checked={active.includes(file.fileName)}
                      onChange={() => handleActive(file.fileName)}
                    />
                  </td>
                  <td>{file.fileName}</td>
                  <td>{file.selectedImages.length}</td>
                  <td>{file.description}</td>
                  <td>{file.date}</td>
                  <td className='events-file-btn'>
                    <div className='events-file-btn-inner'>
                      <img
                        src='/bin.png'
                        alt='Delete'
                        onClick={() => {
                          setId(file.fileName);
                          setOpenDeleteModal(true);
                        }}
                      />
                      <img
                        src='/edit.png'
                        alt='Edit'
                        onClick={() => editData(file)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {openDeleteModal && (
        <div className='events-modal-position'>
          <DeleteModal
            isOpen={openDeleteModal}
            source='announcement'
            id={id}
            onClose={() => setOpenDeleteModal(false)}
            onConfirm={() => setActive((prev) => prev.filter((a) => a !== id))}
          />
        </div>
      )}

      {openModalForm && (
        //modal to edit the event by sending the state data selected//
        <div className='events-form-position'>
          <Form
            forType='events'
            id={id}
            Images={images}
            initialTitle={editTitle}
            initialDescription={editDescription}
            setOpen={setOpenModalForm}
          />
        </div>
      )}
    </div>
  );
};

export default Eventpanel;