import "./SettingsForm.css";
import { useState, useRef } from "react";
import ConfimationModal from "../../modals/confirmationModal/ConfimationModal";

interface SettingsFormProps {
  setEdit: (open: boolean) => void;
}

const SettingsForm = ({ setEdit }: SettingsFormProps) => {
  const [confirmModal, setConfirmModal] = useState(false);
  const [systemName, setSystemName] = useState("Online Transparency System");
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = () => {
    // TODO: send systemName + preview (base64 or file) to backend
    console.log("Saving:", { systemName, preview });
    setConfirmModal(false);
    setEdit(false);
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
