import './actionbar.css';

type ActionbarSource = 'announcement' | 'document';

interface ActionbarProps {
  items: number;
  selectedIds: string[];
  source: ActionbarSource;
}

const Actionbar = ({ items, selectedIds, source }: ActionbarProps) => {
  const handleDelete = () => {
    // TODO: connect to API
    console.log(`[${source}] Delete:`, selectedIds);
    // fetch(`/api/${source}/delete/bulk`, {
    //   method: 'DELETE',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ ids: selectedIds }),
    // });
  };

  const handleMove = () => {
    // TODO: connect to API
    console.log(`[${source}] Move:`, selectedIds);
    // fetch(`/api/${source}/move`, {
    //   method: 'PATCH',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ ids: selectedIds }),
    // });
  };

  const handleArchive = () => {
    // TODO: connect to API
    console.log(`[${source}] Archive:`, selectedIds);
    // fetch(`/api/${source}/archive`, {
    //   method: 'PATCH',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ ids: selectedIds }),
    // });
  };

  const handleApprove = () => {
    // TODO: connect to API
    console.log(`[${source}] Approve:`, selectedIds);
    // fetch(`/api/${source}/approve`, {
    //   method: 'PATCH',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ ids: selectedIds }),
    // });
  };

  return (
    <div className='actionbar-container'>
      <div className='items-selected'>
        <span className='selected-count'>{items}</span> items selected
      </div>

      <div className='actionbar-divider' />

      <button className='actionbar-btn btn-delete' onClick={handleDelete}>
        <img src='./remove.png' alt='delete' className='btn-img' />
        Delete Selected
      </button>

      <button className='actionbar-btn btn-move' onClick={handleMove}>
        <img src='./folder.png' alt='move' className='btn-img' />
        Move
      </button>

      <button className='actionbar-btn btn-archive' onClick={handleArchive}>
        <img src='./archive.png' alt='archive' className='btn-img' />
        Archive
      </button>

      <button className='actionbar-btn btn-approve' onClick={handleApprove}>
        <img src='./check.png' alt='approve' className='btn-img' />
        Approve
      </button>
    </div>
  );
};

export default Actionbar;
