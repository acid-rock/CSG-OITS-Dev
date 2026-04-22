import React, { useRef, useState, useEffect } from "react";
import "./form.css";
import type { Box } from "../pdf-selector-components/pdf-selector";
import PdfSelector from "../pdf-selector-components/pdf-selector";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

interface FormProps {
  forType: "announcement" | "document" | "events" | "inventory";
  id?: string | null;
  initialTitle?: string;
  Images?: string[];
  initialDescription?: string;
  initialCategory?: string;
  inventoryQuantity?: number;
  setOpen: (open: boolean) => void;
}

const Form = ({
  forType,
  id,
  initialTitle = "",
  Images,
  inventoryQuantity,
  initialDescription = "",
  initialCategory = "",
  setOpen,
}: FormProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<string>(
    initialCategory || "activity-proposal",
  );
  const [preview, setPreview] = useState<string | null>(null);
  const [showPdfSelector, setShowPdfSelector] = useState(false);
  const [pdf, setPdf] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [selectedBoxes, setSelectedBoxes] = useState<Box[]>([]);
  const [title, setTitle] = useState(
    initialTitle.split(".")[0].split("/")[1] || "",
  );
  const [description, setDescription] = useState(initialDescription);
  const [eventFiles, setEventFiles] = useState<File[]>([]);

  // Helpers
  const undoHandler = () => {
    setSelectedBoxes((prev) => prev.slice(0, -1));
  };
  const [quantity, setQuantity] = useState(inventoryQuantity || 0);
  const [status, setStatus] = useState("in-stock");

  useEffect(() => {
    const category = initialCategory
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (id && forType === "document" && initialCategory) {
      setType(category);
    }
  }, [id, forType, initialCategory]);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    const url = id ? `${API_URL}/documents/edit` : `${API_URL}/documents/add`;

    if (forType !== "inventory") {
    }

    if (forType === "inventory") {
    }

    if (forType === "events") {
    }

    if (pdf && forType === "document") {
      formData.append("name", title);
      formData.append("description", description);
      formData.append("boxes", JSON.stringify(selectedBoxes));
      formData.append("type", type);
      formData.append("file", pdf);

      console.log(formData.get("type"));

      const response = await axios.post(url, formData);
      if (response.status === 200) {
        setOpen(false);
        window.location.reload();
      }
    } else if (!pdf && forType === "document" && id) {
      const payload = {
        id: id,
        name: title,
        description,
        type,
      };

      const response = await axios.post(url, payload);
      if (response.status === 200) {
        setOpen(false);
        window.location.reload();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (forType === "events") {
      setEventFiles(Array.from(files));
      return;
    }

    const file = files[0];

    if (file) {
      if (file.type === "application/pdf") {
        setPreview(file.name);
        setPdf(file);
        setPdfUrl(URL.createObjectURL(file));
        setShowPdfSelector(true);
      } else {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => setPreview(reader.result as string);
        setPdf(null);
        setPdfUrl(null);
        setShowPdfSelector(false);
      }
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  function typeChangeHandler(
    e: React.ChangeEvent<HTMLSelectElement, HTMLSelectElement>,
  ): void {
    setType(e.target.value);
  }

  return (
    <div className="form-container">
      <div className="form-header">
        <h2>{id ? "Update File" : "Add New File"}</h2>
      </div>

      {forType === "document" && showPdfSelector && pdfUrl && (
        <div className="pdf-selector-overlay">
          <div className="pdf-selector-modal">
            <div className="pdf-selector-header">
              <h3>Select areas on PDF</h3>
              <div className="btn-container">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowPdfSelector(false);
                    // debug
                    console.log(selectedBoxes);
                  }}
                >
                  Done ({selectedBoxes.length} selected)
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={undoHandler}
                >
                  Undo last box
                </button>
              </div>
            </div>
            <div className="pdf-selector-body">
              <PdfSelector
                boxList={selectedBoxes}
                fileUrl={pdfUrl}
                onBoxesChange={setSelectedBoxes}
              />
            </div>
          </div>
        </div>
      )}

      <form
        className={`${!id ? "form-layout" : "display: flex"} ${forType === "inventory" ? "inventory-form" : ""}`}
        onSubmit={handleSubmit}
      >
        <div className="form-fields">
          <div className="form-group">
            <label htmlFor="title">
              {forType === "inventory" ? "Equipment Name" : "Name"}
            </label>
            <input
              type="text"
              id="title"
              placeholder="File name goes here..."
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {id && forType === "document" && (
            <div className="form-group">
              <label>Type</label>
              <select
                name="document"
                id="document-type"
                value={type}
                onChange={typeChangeHandler}
              >
                <option value="activity-proposal">Activity Proposal</option>
                <option value="resolution">Resolution</option>
                <option value="project-proposal">Project Proposal</option>
                <option value="accomplishment-report">
                  Accomplishment Report
                </option>
                <option value="financial-statement">Financial Statement</option>
                <option value="sponsorship-letter">Sponsorship Letter</option>
                <option value="excuse-letter">Excuse Letter</option>
                <option value="office-memorandum">Office Memorandum</option>
                <option value="minutes-of-the-meeting">
                  Minutes of the Meeting
                </option>
              </select>
            </div>
          )}

          {forType !== "inventory" && (
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                placeholder="Long name goes here..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>
          )}

          {forType === "inventory" && (
            <div className="inventory-fields">
              <div className="form-group">
                <label htmlFor="quantity">Quantity</label>
                <input
                  id="quantity"
                  type="number"
                  placeholder="0"
                  min={0}
                  value={quantity}
                  name="quantity"
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="inventory-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="inventory-select"
                >
                  <option value="in-stock">In Stock</option>
                  <option value="out-of-stock">Out of Stock</option>
                  <option value="low-stock">Low Stock</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {forType !== "inventory" && !id && (
          <div className="image-upload">
            <label>
              {forType === "announcement"
                ? "Image"
                : forType === "events"
                  ? "Images"
                  : "File"}
            </label>
            {forType === "events" ? (
              <div
                className={`image-preview${eventFiles.length > 0 ? " has-image" : ""}`}
                onClick={handleImageClick}
              >
                {eventFiles.length === 0 && !Images?.length ? (
                  <div className="image-placeholder">
                    <div className="upload-icon">📁</div>
                    <div className="upload-text">
                      <strong>Click to upload</strong>
                      <br />
                      PNG, JPG, JPEG (min. 5 images)
                    </div>
                  </div>
                ) : (
                  <div className="events-file-list">
                    {eventFiles.length > 0
                      ? eventFiles.map((file, i) => (
                          <div key={i} className="events-file-list-item">
                            <span className="events-file-name">
                              {file.name}
                            </span>
                          </div>
                        ))
                      : Images?.map((file, i) => (
                          <div key={i} className="events-file-list-item">
                            <span className="events-file-name">
                              {file.split("/").pop()}
                            </span>
                            <img
                              src="/asset/delete.png"
                              alt="delete"
                              className="delete-button-image"
                            />
                          </div>
                        ))}
                  </div>
                )}
              </div>
            ) : (
              <div
                className={`image-preview${preview ? " has-image" : ""}`}
                id="imagePreview"
                onClick={handleImageClick}
              >
                {!preview ? (
                  <div className="image-placeholder">
                    <div className="upload-icon">📁</div>
                    <div className="upload-text">
                      <strong>Click to upload</strong>
                      <br />
                      {forType === "announcement"
                        ? "PNG, JPG, JPEG"
                        : "PDF files"}
                    </div>
                  </div>
                ) : preview?.endsWith(".pdf") ? (
                  <div className="pdf-preview">
                    <div className="upload-icon">📄</div>
                    <div className="upload-text">{preview}</div>
                    {forType === "document" && (
                      <>
                        {selectedBoxes.length > 0 && (
                          <div className="pdf-selected-count">
                            ✓ {selectedBoxes.length} area(s) selected
                          </div>
                        )}
                        <button
                          type="button"
                          className="btn btn-edit-selections"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowPdfSelector(true);
                          }}
                        >
                          Edit selections
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <img id="previewImage" alt="Preview" src={preview} />
                )}
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              multiple={forType === "events"}
              title="Select a file to upload"
              accept={
                forType === "announcement"
                  ? "image/*"
                  : forType === "events"
                    ? "image/*"
                    : "application/pdf"
              }
              onChange={handleFileChange}
              className="file-input-hidden"
            />
            {forType === "events" && (
              <p className="form-file-hint">
                {Images?.length} image{Images?.length !== 1 ? "s" : ""} selected
              </p>
            )}

            <div className="document-type-selection">
              <label htmlFor="document-type">Document type:</label>
              <select
                name="document"
                id="document-type"
                value={type}
                onChange={typeChangeHandler}
              >
                <option value="activity-proposal">Activity Proposal</option>
                <option value="resolution">Resolution</option>
                <option value="project-proposal">Project Proposal</option>
                <option value="accomplishment-report">
                  Accomplishment Report
                </option>
                <option value="financial-statement">Financial Statement</option>
                <option value="sponsorship-letter">Sponsorship Letter</option>
                <option value="excuse-letter">Excuse Letter</option>
                <option value="office-memorandum">Office Memorandum</option>
                <option value="minutes-of-the-meeting">
                  Minutes of the Meeting
                </option>
              </select>
            </div>
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-cancel"
            onClick={() => setOpen(false)}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-submit">
            {id ? "Update" : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Form;
