import './actionbar.css';
import { useState } from 'react';
import axios from 'axios';
import ConfimationModal from '../modals/confirmationModal/ConfimationModal';

const API_URL = import.meta.env.VITE_API_URL as string;

type ActionbarSource = 'announcement' | 'document' | 'event';

interface ActionbarProps {
  items: number;
  selectedIds: string[];
  source: ActionbarSource;
  onSuccess?: () => void;
}

const endpointMap: Record<ActionbarSource, string> = {
  announcement: `${API_URL}/announcements/delete`,
  document: `${API_URL}/documents/delete`,
  event: `${API_URL}/events/delete`,
};

const Actionbar = ({ items, selectedIds, source, onSuccess }: ActionbarProps) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const executeDelete = async () => {
    const endpoint = endpointMap[source];
    try {
      if (source === 'event') {
        // Events delete endpoint accepts single {id} — loop through selections
        for (const id of selectedIds) {
          await axios.delete(endpoint, { data: { id }, withCredentials: true });
        }
      } else {
        // Announcements and documents accept array body [{id}]
        const body = selectedIds.map((id) => ({ id }));
        await axios.delete(endpoint, { data: body, withCredentials: true });
      }
      onSuccess?.();
    } catch (err) {
      console.error(`[Actionbar] Bulk delete failed for ${source}:`, err);
    }
  };

  const handleDelete = () => {
    setShowConfirm(true);
  };

  const handleMove = () => {
    // TODO: implement move operation
  };

  const handleArchive = () => {
    // TODO: implement archive operation
  };

  const handleApprove = () => {
    // TODO: implement approve operation
  };

  return (
    <>
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

      {showConfirm && (
        <ConfimationModal
          onClose={() => setShowConfirm(false)}
          onConfirm={() => {
            setShowConfirm(false);
            executeDelete();
          }}
        />
      )}
    </>
  );
};

export default Actionbar;
