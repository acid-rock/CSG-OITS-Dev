import "./SettingsForm.css";
import { useState, useRef, useEffect } from "react";
import ConfimationModal from "../../modals/confirmationModal/ConfimationModal";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL as string;

interface SettingsData {
  system_name: string;
  logo_url: string | null;
  access_paused: boolean;
}

interface SettingsFormProps {
  setEdit: (open: boolean) => void;
}

const SettingsForm = ({ setEdit }: SettingsFormProps) => {
  const [confirmModal, setConfirmModal] = useState(false);
  const [systemName, setSystemName] = useState("Online Transparency System");
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    axios
      .get<SettingsData>(`${API_URL}/settings`, { withCredentials: true })
      .then(({ data }) => {
        setSystemName(data.system_name ?? "Online Transparency System");
        if (data.logo_url) setPreview(data.logo_url);
      })
      .catch(() => {
        // Use defaults silently on fetch error
      });
  }, []);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      await axios.post(
        `${API_URL}/settings`,
        { system_name: systemName, logo_url: preview, access_paused: false },
        { withCredentials: true },
      );
      setSuccessMessage("Settings saved.");
      setConfirmModal(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save settings.";
      setErrorMessage(message);
      setConfirmModal(false);
    }
  };

  return (
    <div className="settings-form-container">
      <div className="settings-form-header">
        <span>Edit General Settings</span>
        <button
          type="button"
          className="settings-form-close"
          onClick={() => setEdit(false)}
          title="Close"
        >
          ✕
        </button>
      </div>

      {successMessage && (
        <p style={{ color: "green", padding: "0.5rem 1rem" }}>
          {successMessage}
        </p>
      )}
      {errorMessage && (
        <p style={{ color: "red", padding: "0.5rem 1rem" }}>{errorMessage}</p>
      )}

      <form onSubmit={(e) => e.preventDefault()}>
        <div className="form-group">
          <label htmlFor="system-name">System Name</label>
          <input
            type="text"
            id="system-name"
            name="system-name"
            value={systemName}
            onChange={(e) => setSystemName(e.target.value)}
            placeholder="Enter system name"
          />
        </div>

        <div className="image-upload">
          <label>System Logo</label>
          <div
            className={`image-preview${preview ? " has-image" : ""}`}
            onClick={handleImageClick}
            title="Click to upload image"
          >
            {preview ? (
              <>
                <img id="previewImage" alt="Preview" src={preview} />
                <button
                  type="button"
                  className="remove-image-btn"
                  onClick={handleRemoveImage}
                  title="Remove image"
                >
                  ✕
                </button>
              </>
            ) : (
              <div className="image-placeholder">
                <div className="upload-icon">📁</div>
                <div className="upload-text">
                  <strong>Click to upload</strong> or drag and drop
                  <br />
                  PNG, JPG up to 10MB
                </div>
              </div>
            )}
          </div>
          {fileName && (
            <span className="file-name-label">Selected: {fileName}</span>
          )}
          <input
            type="file"
            id="fileInput"
            accept="image/*"
            ref={fileInputRef}
            name="file"
            onChange={handleFileChange}
            className="file-input-hidden"
            aria-label="Upload system logo"
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-cancel"
            onClick={() => setEdit(false)}
          >
            Cancel
          </button>
          <button
            className="btn btn-submit"
            type="button"
            onClick={() => setConfirmModal(true)}
            disabled={!systemName.trim()}
          >
            Save
          </button>
        </div>
      </form>

      {confirmModal && (
        <ConfimationModal
          onClose={() => setConfirmModal(false)}
          onConfirm={handleSubmit}
        />
      )}
    </div>
  );
};

export default SettingsForm;
