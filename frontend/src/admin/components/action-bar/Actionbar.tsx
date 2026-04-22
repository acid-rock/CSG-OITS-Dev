import axios from 'axios';
import './actionbar.css';

type ActionbarSource = 'announcement' | 'document';

interface ActionbarProps {
  items: number;
  selectedIds: string[];
  source: ActionbarSource;
}

const API_URL = import.meta.env.VITE_API_URL;

const url = (source: string) => {
  switch (source) {
    case "announcement":
      return `${API_URL}/announcements/delete`;
    case "document":
      return `${API_URL}/documents/delete`;
    default:
      throw new Error("Invalid source type");
  }
}

const Actionbar = ({ items, selectedIds, source }: ActionbarProps) => {

  const handleDelete = async () => {
    const response = await axios.delete(url(source), { data: [selectedIds] });
    if (response.status === 200) {
      window.location.reload();
    }
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

      <button className='actionbar-btn btn-archive' onClick={handleArchive}>
        <img src='./archive.png' alt='archive' className='btn-img' />
        Archive
      </button>
    </div>
  );
};

export default Actionbar;
