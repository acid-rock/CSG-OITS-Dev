import React, { useRef, useState } from "react";
import "./form.css";
import type { Box } from "../pdf-selector-components/pdf-selector";
import PdfSelector from "../pdf-selector-components/pdf-selector";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL as string;

// TASK 5: extended forType to include 'event'
interface FormProps {
  forType: "announcement" | "document" | "event";
  id?: string | null;
  initialTitle?: string;
  initialDescription?: string;
  initialDate?: string;
  initialType?: string;   // pre-populate type select for document edits
  initialImages?: string[]; // current image URLs shown as previews in event edit mode
  setOpen: (open: boolean) => void;
  onSuccess?: () => void; // called after a successful API submission
}

const Form = ({
  forType,
  id,
  initialTitle = "",
  initialDescription = "",
  initialDate = "",
  initialType = "",
  initialImages = [],
  setOpen,
  onSuccess,
}: FormProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [showPdfSelector, setShowPdfSelector] = useState(false);

  const [pdf, setPdf] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [selectedBoxes, setSelectedBoxes] = useState<Box[]>([]);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [date, setDate] = useState(initialDate);
  const [eventImages, setEventImages] = useState<File[]>([]);
  // For event edit mode: one optional replacement per slot (0, 1, 2)
  const [replaceImages, setReplaceImages] = useState<[File | null, File | null, File | null]>([null, null, null]);
  // Stores the selected image file for announcement add/edit (non-PDF images are not stored in `pdf`)
  const [announcementImage, setAnnouncementImage] = useState<File | null>(null);
  const [type, setType] = useState(initialType);
  const [term, setTerm] = useState("");

  // Helpers
  const undoHandler = () => {
    setSelectedBoxes((prev) => prev.slice(0, -1));
  };

  const typeChangeHandler = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setType(event.target.value);
  };

  // TASK 1: correct endpoint paths using VITE_API_URL
  const getUrl = (): string => {
    if (forType === "announcement") {
      return id
        ? `${API_URL}/announcements/edit`
        : `${API_URL}/announcements/add`;
    }
    if (forType === "document") {
      return id ? `${API_URL}/documents/edit` : `${API_URL}/documents/add`;
    }
    // event
    return id ? `${API_URL}/events/edit` : `${API_URL}/events/add`;
  };

  // TASK 1: replaced fetch with axios + withCredentials; made async
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();

    // Common fields
    formData.append("title", title);
    formData.append("description", description);

    if (forType === "announcement") {
      // Backend expects 'content' not 'description'
      formData.append("content", description);
    }

    if (forType === "document") {
      // Backend expects 'name' not 'title' and requires 'type'
      formData.append("name", title);
      formData.append("type", type);
      if (term) formData.append("term", term);
      if (pdf) {
        formData.append("file", pdf);
        formData.append("boxes", JSON.stringify(selectedBoxes));
      }
    }

    if (forType === "event") {
      // Backend expects 'name' not 'title', and 'date_happened'
      formData.append("name", title);
      formData.append("date_happened", date);

      if (id) {
        // Edit mode: send individual slot replacements as image_0 / image_1 / image_2
        replaceImages.forEach((file, i) => {
          if (file) formData.append(`image_${i}`, file);
        });
      } else {
        // Add mode: send all images under the 'images' field
        eventImages.forEach((img) => formData.append("images", img));
      }
    }

    // Bug 1 fix: use announcementImage (non-PDF file) not pdf (PDF file)
    if (forType === "announcement" && announcementImage) {
      formData.append("image", announcementImage);
    }

    // Include id for edit operations
    if (id) {
      formData.append("id", id);
    }

    await axios.post(getUrl(), formData, { withCredentials: true });
    onSuccess?.();
    setOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === "application/pdf") {
        setPreview(file.name);
        setPdf(file);
        setPdfUrl(URL.createObjectURL(file));
        if (forType === "document") {
          setShowPdfSelector(true);
        }
      } else {
        // Image file (announcement cover photo, etc.)
        setAnnouncementImage(file);
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(file);
        setPdf(null);
        setPdfUrl(null);
        setShowPdfSelector(false);
      }
    } else {
      setPreview(null);
      setPdf(null);
      setPdfUrl(null);
      setAnnouncementImage(null);
      setShowPdfSelector(false);
    }
  };

  // TASK 5: event-specific multi-image handler
  const handleEventImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 3);
    setEventImages(files);
    if (files.length > 0) setPreview(files[0].name);
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="form-container">
      <div className="form-header">
        <h2>{id ? "Update File" : "Add New File"}</h2>
      </div>

      {/* PDF Selector Modal — documents only */}
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

      <form className="form-layout" onSubmit={handleSubmit}>
        <div className="form-fields">
          <div className="form-group">
            <label htmlFor="title">
              {forType === "event" ? "Event Name" : "Title"}
            </label>
            <input
              type="text"
              id="title"
              placeholder={
                forType === "event" ? "Leadership Summit" : "System Maintenance"
              }
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          {forType === "document" && (
            <div className="form-group">
              <label htmlFor="term">Term (S.Y.)</label>
              <input
                type="text"
                id="term"
                placeholder="e.g. S.Y. 2024-2025"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
              />
            </div>
          )}
          {forType === "document" && (
            <div className="form-group">
              <label htmlFor="type">Type</label>
              <select value={type} onChange={typeChangeHandler}>
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
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              placeholder={
                forType === "event"
                  ? "Annual leadership summit for CSG officers..."
                  : "Scheduled maintenance for system updates..."
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>
          {/* TASK 5: date field for events only */}
          {forType === "event" && (
            <div className="form-group">
              <label htmlFor="date">Date</label>
              <input
                type="date"
                id="date"
                name="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="image-upload">
          <label>
            {forType === "announcement"
              ? "Image"
              : forType === "event"
                ? "Photos (up to 3)"
                : "File"}
          </label>
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
                    : forType === "event"
                      ? "PNG, JPG (up to 3 images)"
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

          {/* Event edit mode: 3 individual replacement slots */}
          {forType === "event" && id ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.5rem" }}>
              {([0, 1, 2] as const).map((i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                    Replace Image {i + 1} (optional)
                  </label>
                  {initialImages[i] && !replaceImages[i] && (
                    <img
                      src={initialImages[i]}
                      alt={`Current image ${i + 1}`}
                      style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 4, border: "1px solid #e5e7eb" }}
                    />
                  )}
                  {replaceImages[i] && (
                    <img
                      src={URL.createObjectURL(replaceImages[i]!)}
                      alt={`New image ${i + 1}`}
                      style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 4, border: "2px solid #3b82f6" }}
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    title={`Replace image slot ${i + 1}`}
                    style={{ fontSize: "0.85rem" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      setReplaceImages((prev) => {
                        const next = [...prev] as [File | null, File | null, File | null];
                        next[i] = file;
                        return next;
                      });
                    }}
                  />
                </div>
              ))}
            </div>
          ) : forType === "event" ? (
            /* Event add mode: single multi-image input */
            <input
              type="file"
              ref={fileInputRef}
              title="Select up to 3 photos"
              accept="image/*"
              multiple
              onChange={handleEventImagesChange}
              className="file-input-hidden"
            />
          ) : (
            <input
              type="file"
              ref={fileInputRef}
              title="Select a file to upload"
              accept={
                forType === "announcement" ? "image/*" : "application/pdf"
              }
              onChange={handleFileChange}
              className="file-input-hidden"
            />
          )}
        </div>

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
