import { useState } from 'react';
import './auditlog.css';
import FilterSelect from '../../components/filter/Filter';

interface AuditEntry {
  user: string;
  role: 'Admin' | 'Super Admin';
  imageName: string;
  fileName: string;
  description: string;
  date: string; // ISO string for accurate filtering & sorting
}

const auditData: AuditEntry[] = [
  {
    user: 'Juan Dela Cruz',
    role: 'Admin',
    imageName: 'image1.png',
    fileName: 'Budget_Report_Q1.pdf',
    description: 'Uploaded new budget report',
    date: '2026-01-28T14:15:00',
  },
  {
    user: 'Maria Santos',
    role: 'Super Admin',
    imageName: 'image2.png',
    fileName: 'Announcement_Feb.docx',
    description: 'Deleted outdated announcement',
    date: '2026-01-27T09:42:00',
  },
  {
    user: 'Pedro Reyes',
    role: 'Admin',
    imageName: 'image3.png',
    fileName: 'Policy_Update.pdf',
    description: 'Edited policy document',
    date: '2026-01-26T16:05:00',
  },
  {
    user: 'Ana Lopez',
    role: 'Admin',
    imageName: 'image4.png',
    fileName: 'Memo_March.pdf',
    description: 'Uploaded memo for March',
    date: '2026-01-25T11:30:00',
  },
  {
    user: 'Ana Lopez',
    role: 'Admin',
    imageName: 'image4.png',
    fileName: 'Memo_March.pdf',
    description: 'Uploaded memo for March',
    date: '2026-01-25T11:30:00',
  },
  {
    user: 'Ana Lopez',
    role: 'Admin',
    imageName: 'image4.png',
    fileName: 'Memo_March.pdf',
    description: 'Uploaded memo for March',
    date: '2026-01-25T11:30:00',
  },
  {
    user: 'Ana Lopez',
    role: 'Admin',
    imageName: 'image4.png',
    fileName: 'Memo_March.pdf',
    description: 'Uploaded memo for March',
    date: '2026-01-25T11:30:00',
  },
  {
    user: 'Jose Ramos',
    role: 'Super Admin',
    imageName: 'image5.png',
    fileName: 'Whitelist_Update.xlsx',
    description: 'Removed user from whitelist',
    date: '2026-01-24T08:00:00',
  },
];

const filterOptions = ['All', 'Today', 'This Week', 'This Month'];
const sortOptions = [
  'Name (A-Z)',
  'Name (Z-A)',
  'Date (Newest)',
  'Date (Oldest)',
];

const formatDateTime = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

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

const Audit = () => {
  const [spinning, setSpinning] = useState(false);
  const [active, setActive] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [sort, setSort] = useState<string>('');

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

  const filtered = auditData
    .filter((entry) => filterByDate(entry.date, filter))
    .sort((a, b) => {
      if (sort === 'Name (A-Z)') return a.fileName.localeCompare(b.fileName);
      if (sort === 'Name (Z-A)') return b.fileName.localeCompare(a.fileName);
      if (sort === 'Date (Newest)')
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sort === 'Date (Oldest)')
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      return 0;
    });

  return (
    <div className='audit-container'>
      <div className='audit-header'>
        <span>Audit Log</span>
      </div>

      <div className='audit-toolbar'>
        <span className='audit-file-count'>{auditData.length} Entries</span>
        <div className='audit-toolbar-actions'>
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
            className='audit-action-btn'
            title='Refresh'
            onClick={handleRefresh}
          >
            <img
              src='/refresh.png'
              alt='refresh'
              className={`refresh-img${spinning ? ' audit-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      <div className='audit-file-table'>
        <table>
          <colgroup>
            <col className='audit-col-user' />
            <col className='audit-col-image' />
            <col className='audit-col-filename' />
            <col className='audit-col-description' />
            <col className='audit-col-date' />
          </colgroup>
          <thead>
            <tr className='audit-table-header-light'>
              <th>User / Admin</th>
              <th>Image</th>
              <th>File Name</th>
              <th>Description</th>
              <th>Date & Time</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry, idx) => (
              <tr
                key={idx}
                className={`audit-table-row ${active.includes(entry.fileName) ? 'audit-active' : ''}`}
                onClick={() => handleActive(entry.fileName)}
              >
                <td>
                  <div className='audit-user-cell'>
                    <span className='audit-user-name'>{entry.user}</span>
                    <span
                      className={`audit-role-badge audit-role-${entry.role === 'Super Admin' ? 'super' : 'admin'}`}
                    >
                      {entry.role}
                    </span>
                  </div>
                </td>
                <td>{entry.imageName}</td>
                <td>{entry.fileName}</td>
                <td>{entry.description}</td>
                <td className='audit-datetime'>{formatDateTime(entry.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Audit;
