import './actionbar.css';
import { useState } from 'react';
import axios from 'axios';
import ConfimationModal from '../modals/confirmationModal/ConfimationModal';

const API_URL = import.meta.env.VITE_API_URL as string;

type ActionbarSource = 'announcement' | 'document' | 'event' | 'officer';

interface ActionbarProps {
  items: number;
  selectedIds: string[];
  source: ActionbarSource;
  onSuccess?: () => void;
}

const deleteEndpointMap: Record<ActionbarSource, string> = {
  announcement: `${API_URL}/announcements/delete`,
  document: `${API_URL}/documents/delete`,
  event: `${API_URL}/events/delete`,
  officer: `${API_URL}/officers/delete`,
};

const archiveEndpointMap: Record<ActionbarSource, string> = {
  announcement: `${API_URL}/announcements/archive`,
  document: `${API_URL}/documents/archive`,
  event: `${API_URL}/events/archive`,
  officer: `${API_URL}/officers/archive`,
};

const Actionbar = ({ items, selectedIds, source, onSuccess }: ActionbarProps) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);

  const executeDelete = async () => {
    const endpoint = deleteEndpointMap[source];
    try {
      if (source === 'officer') {
        await axios.delete(endpoint, { data: { ids: selectedIds }, withCredentials: true });
      } else if (source === 'event') {
        for (const id of selectedIds) {
          await axios.delete(endpoint, { data: { id }, withCredentials: true });
        }
      } else {
        const body = selectedIds.map((id) => ({ id }));
        await axios.delete(endpoint, { data: body, withCredentials: true });
      }
      onSuccess?.();
    } catch (err) {
      console.error(`[Actionbar] Bulk delete failed for ${source}:`, err);
    }
  };

  const handleArchive = async () => {
    const endpoint = archiveEndpointMap[source];
    setArchiveError(null);
    try {
      await axios.post(endpoint, { ids: selectedIds }, { withCredentials: true });
      onSuccess?.();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Archive failed.';
      setArchiveError(msg);
      console.error(`[Actionbar] Bulk archive failed for ${source}:`, err);
    }
  };

  return (
    <>
      <div className='actionbar-container'>
        <div className='items-selected'>
          <span className='selected-count'>{items}</span> items selected
        </div>

        <div className='actionbar-divider' />

        {archiveError && (
          <span style={{ fontSize: '0.8rem', color: '#dc2626' }}>{archiveError}</span>
        )}

        <button className='actionbar-btn btn-delete' onClick={() => setShowConfirm(true)}>
          <img src='./remove.png' alt='delete' className='btn-img' />
          Delete Selected
        </button>

        <button className='actionbar-btn btn-archive' onClick={handleArchive}>
          <img src='./archive.png' alt='archive' className='btn-img' />
          Archive
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
