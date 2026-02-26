import { useState } from 'react';
import './auditlog.css';
import { announcementConfig } from '../announcement/announcementExample';
import FilterSelect from '../../components/filter/Filter';

const filterOptions = ['All', 'Today', 'This Week', 'This Month'];

const Audit = () => {
  const [spinning, setSpinning] = useState(false);
  const [filter, setFilter] = useState<string>('');
  const [sort, setSort] = useState<string>('');

  const handleRefresh = () => {
    setSpinning(true);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  return (
    <div className='audit-container'>
      <div className='audit-header'>
        <span>Audit Log</span>
      </div>

      <div className='audit-file-table'>
        <table>
          <thead>
            {/* Row 1: Toolbar */}
            <tr className='audit-table-header-black'>
              <th colSpan={4} className='audit-table-head'>
                <div className='audit-toolbar-content'>
                  <div style={{ visibility: 'hidden' }}>Spacer</div> 
                  <div className='audit-table-actions'>
                    <FilterSelect
                      options={filterOptions}
                      value={filter}
                      onChange={setFilter}
                      label='Filter'
                    />
                    <FilterSelect
                      options={filterOptions}
                      value={sort}
                      onChange={setSort}
                      label='Sort'
                    />
                    <button
                      className='audit-action-btn'
                      title='Refresh'
                      onClick={handleRefresh}
                    >
                      <img
                        src='/refresh.png'
                        alt='refresh'
                        className={spinning ? 'audit-spin' : ''}
                      />
                    </button>
                  </div>
                </div>
              </th>
            </tr>
            {/* Row 2: Column Titles */}
            <tr className='audit-column-titles'>
              <th>User / Admin</th>
              <th>Action</th>
              <th>Target / Details</th>
              <th>Date & Time</th>
            </tr>
          </thead>
          <tbody>
            {announcementConfig.map((file, idx) => (
              <tr key={idx}>
                <td>{file.userName || 'Admin'}</td>
                <td>{file.imageName || 'System Action'}</td>
                <td>{file.fileName || 'Details'}</td>
                <td>{file.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Audit;