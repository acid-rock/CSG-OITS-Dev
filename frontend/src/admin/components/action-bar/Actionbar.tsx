import axios from "axios";
import "./actionbar.css";

type ActionbarSource = "announcement" | "document";

interface ActionbarProps {
  items: number;
  selectedIds: string[];
  source: ActionbarSource;
  isArchived?: boolean;
}

const API_URL = import.meta.env.VITE_API_URL;

const url = (source: string) => {
  switch (source) {
    case "announcement":
      return {
        archive: `${API_URL}/announcements/archive`,
        unarchive: `${API_URL}/announcements/unarchive`,
        delete: `${API_URL}/announcements/delete`,
      };
    case "document":
      return {
        archive: `${API_URL}/documents/archive`,
        unarchive: `${API_URL}/documents/unarchive`,
        delete: `${API_URL}/documents/delete`,
      };
    default:
      throw new Error("Invalid source type");
  }
};

const Actionbar = ({
  items,
  selectedIds,
  source,
  isArchived = false,
}: ActionbarProps) => {
  const handleDelete = async () => {
    const response = await axios.delete(url(source).delete, {
      data: [selectedIds],
    });
    if (response.status === 200) {
      window.location.reload();
    }
  };

  const handleArchiveToggle = async () => {
    const endpoint = isArchived ? url(source).unarchive : url(source).archive;

    const response = await axios.post(endpoint, {
      ids: selectedIds,
    });
    if (response.status === 200) {
      window.location.reload();
    }
  };

  return (
    <div className="actionbar-container">
      <div className="items-selected">
        <span className="selected-count">{items}</span> items selected
      </div>

      <div className="actionbar-divider" />

      <button className="actionbar-btn btn-delete" onClick={handleDelete}>
        <img src="./remove.png" alt="delete" className="btn-img" />
        Delete Selected
      </button>

      <button
        className="actionbar-btn btn-archive"
        onClick={handleArchiveToggle}
      >
        <img src="./archive.png" alt="archive" className="btn-img" />
        {isArchived ? "Un-archive" : "Archive"}
      </button>
    </div>
  );
};

export default Actionbar;
