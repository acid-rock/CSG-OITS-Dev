import React, { useRef, useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL as string;

interface Committee {
  id: string; // UUID — committees.id is UUID, not integer
  name: string;
}

interface Membership {
  id: string;
  officer_id: string;
  committee_id: string;
  role_title: string;
  is_official: boolean;
  created_at?: string;
  committees?: { id: string; name: string };
}

interface OfficerFormProps {
  id?: string | null;
  initialData?: {
    full_name?: string;
    position?: string;
    type?: string;
    socials?: string;
    year_serving?: string;
    student_number?: string;
    committee?: string | null;
    is_committee_official?: boolean;
  };
  /** Active term from Settings — auto-fills year_serving for new officers */
  activeTerm?: string;
  setOpen: (open: boolean) => void;
  onSuccess?: () => void;
}

const OfficerForm = ({
  id,
  initialData = {},
  activeTerm = '',
  setOpen,
  onSuccess,
}: OfficerFormProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [committees, setCommittees] = useState<Committee[]>([]);

  const [fullName, setFullName] = useState(initialData.full_name ?? "");
  const [position, setPosition] = useState(initialData.position ?? "");
  const [type, setType] = useState(initialData.type ?? "executive");
  const [socials, setSocials] = useState(initialData.socials ?? "");
  // year_serving: officer's existing term (edit) OR active term from Settings (new)
  // Not a free-text input — change the global term in Settings → General
  const yearServing = initialData.year_serving ?? activeTerm;
  const [studentNumber, setStudentNumber] = useState(
    initialData.student_number ?? "",
  );
  const [committee, setCommittee] = useState<string>(
    initialData.committee != null ? String(initialData.committee) : "",
  );
  const [isCommitteeOfficial, setIsCommitteeOfficial] = useState(
    initialData.is_committee_official ?? false,
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Committee memberships (edit mode only) ─────────────────────────────────
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [addingMembership, setAddingMembership] = useState(false);
  const [newCommitteeId, setNewCommitteeId] = useState('');
  const [newRoleTitle, setNewRoleTitle] = useState('');
  const [newIsOfficial, setNewIsOfficial] = useState(false);
  const [membershipError, setMembershipError] = useState<string | null>(null);
  const [membershipLoading, setMembershipLoading] = useState(false);

  useEffect(() => {
    axios
      .get<Committee[]>(`${API_URL}/committees`, { withCredentials: true })
      .then(({ data }) => setCommittees(data))
      .catch(() => {});
  }, []);

  // Fetch existing memberships when editing
  useEffect(() => {
    if (!id) return;
    axios
      .get<Membership[]>(`${API_URL}/memberships`, {
        params: { officer_id: id },
        withCredentials: true,
      })
      .then(({ data }) => setMemberships(data))
      .catch(() => {});
  }, [id]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append("full_name", fullName);
    formData.append("position", position);
    formData.append("type", type);
    formData.append("socials", socials);
    formData.append("year_serving", yearServing);
    formData.append("student_number", studentNumber);
    formData.append("committee", committee);
    formData.append("is_committee_official", String(isCommitteeOfficial));
    if (id) formData.append("id", id);
    if (avatarFile) formData.append("avatar", avatarFile);

    try {
      const endpoint = id
        ? `${API_URL}/officers/edit`
        : `${API_URL}/officers/add`;
      await axios.post(endpoint, formData, { withCredentials: true });
      onSuccess?.();
      setOpen(false);
    } catch (err: unknown) {
      const d = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data;
      const msg = d?.error ?? d?.message ?? (err instanceof Error ? err.message : 'Failed to save officer.');
      setError(msg);
    }
  };

  // ── Add committee membership ──────────────────────────────────────────────
  const addMembership = async () => {
    if (!newCommitteeId || !newRoleTitle.trim()) {
      setMembershipError('Please select a committee and enter a role title.');
      return;
    }
    setMembershipLoading(true);
    setMembershipError(null);
    try {
      const { data } = await axios.post<Membership>(
        `${API_URL}/memberships/add`,
        {
          officer_id: id,
          committee_id: newCommitteeId,
          role_title: newRoleTitle.trim(),
          is_official: newIsOfficial,
        },
        { withCredentials: true },
      );
      setMemberships(prev => [...prev, data]);
      setAddingMembership(false);
      setNewCommitteeId('');
      setNewRoleTitle('');
      setNewIsOfficial(false);
    } catch (err: unknown) {
      const d = (err as { response?: { data?: { error?: string } } })?.response?.data;
      setMembershipError(d?.error ?? 'Failed to add membership.');
    } finally {
      setMembershipLoading(false);
    }
  };

  // ── Remove committee membership ───────────────────────────────────────────
  const removeMembership = async (membershipId: string) => {
    setMembershipError(null);
    try {
      await axios.delete(`${API_URL}/memberships/delete`, {
        data: { id: membershipId },
        withCredentials: true,
      });
      setMemberships(prev => prev.filter(m => m.id !== membershipId));
    } catch {
      setMembershipError('Failed to remove membership.');
    }
  };

  // ── Available committees (not yet assigned as a membership) ───────────────
  const availableCommittees = committees.filter(
    c => !memberships.some(m => m.committee_id === c.id),
  );

  return (
    <div className="form-container">
      <div className="form-header">
        <h2>{id ? "Edit Officer" : "Add Officer"}</h2>
      </div>

      {error && <p style={{ color: "red", padding: "0 1rem" }}>{error}</p>}

      <form className="form-layout" onSubmit={handleSubmit}>
        <div className="form-fields">
          <div className="form-group">
            <label htmlFor="full_name">Full Name *</label>
            <input
              type="text"
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Juan Dela Cruz"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="position">Position *</label>
            <input
              type="text"
              id="position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="President"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="type">Type *</label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="executive">Executive</option>
              <option value="board">Board Member</option>
              <option value="adviser">Adviser</option>
              <option value="member">Member</option>
              <option value="former">Former</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="committee">Primary Committee</label>
            <select
              id="committee"
              value={committee}
              onChange={(e) => setCommittee(e.target.value)}
            >
              <option value="">— None —</option>
              {committees.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
            <span style={{ fontSize: '0.73rem', color: '#9ca3af', marginTop: '0.2rem' }}>
              Legacy field — use <em>Committee Memberships</em> below for multi-committee roles.
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="socials">Facebook URL</label>
            <input
              type="url"
              id="socials"
              value={socials}
              onChange={(e) => setSocials(e.target.value)}
              placeholder="https://facebook.com/..."
            />
          </div>

          <div className="form-group">
            <label>Term (S.Y.)</label>
            {/* Read-only — change the active term in Settings → General System Settings */}
            <div style={{
              padding: '8px 12px',
              background: 'var(--color-surface, #f4f6fd)',
              border: '1.5px solid var(--color-border, #e2e8f0)',
              borderRadius: 8,
              fontSize: 13.5,
              fontFamily: "'JetBrains Mono', monospace",
              color: yearServing ? 'var(--color-text-primary)' : 'var(--color-text-hint)',
              userSelect: 'none',
            }}>
              {yearServing || 'Not set — configure in Settings → General System Settings'}
            </div>
            <span style={{ fontSize: '0.73rem', color: '#9ca3af', marginTop: '0.2rem' }}>
              Set the active term in <em>Settings → General System Settings</em>.
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="student_number">Student Number</label>
            <input
              type="text"
              id="student_number"
              value={studentNumber}
              onChange={(e) => setStudentNumber(e.target.value)}
              placeholder="2021-XXXXX"
            />
          </div>

          <div
            className="form-group"
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <input
              type="checkbox"
              id="is_committee_official"
              checked={isCommitteeOfficial}
              onChange={(e) => setIsCommitteeOfficial(e.target.checked)}
            />
            <label htmlFor="is_committee_official" style={{ marginBottom: 0 }}>
              Committee Official (Chair/Vice) — legacy
            </label>
          </div>

          {/* ── Committee Memberships (edit mode only) ──────────────────── */}
          {id && (
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Committee Memberships</label>
              <p style={{ fontSize: '0.73rem', color: '#9ca3af', margin: '0 0 8px' }}>
                Add this officer to one or more committees with a specific role.
                These appear in the committee modal on the public Officers page.
              </p>

              {/* Existing memberships list */}
              {memberships.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                  {memberships.map(m => (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 12px',
                        background: 'var(--color-surface, #f4f6fd)',
                        borderRadius: 8,
                        border: '1px solid var(--color-border-soft, #eef0f5)',
                      }}
                    >
                      <span style={{ flex: 1, fontWeight: 600, fontSize: 13, color: 'var(--color-text-primary)' }}>
                        {m.committees?.name ?? '—'}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                        {m.role_title}
                      </span>
                      {m.is_official && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                          background: 'rgba(79,111,209,0.10)', color: '#3b5fbc',
                          padding: '2px 8px', borderRadius: 999, whiteSpace: 'nowrap',
                        }}>
                          Official
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeMembership(m.id)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#ef4444', fontSize: 14, fontWeight: 700,
                          padding: '0 4px', lineHeight: 1,
                        }}
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 10 }}>
                  No committee memberships yet.
                </p>
              )}

              {membershipError && (
                <p style={{ color: 'red', fontSize: 12, marginBottom: 8 }}>{membershipError}</p>
              )}

              {/* Add membership inline form */}
              {addingMembership ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: 10,
                  padding: '14px', marginTop: 4,
                  background: 'var(--color-surface-deep, #eef1fb)',
                  borderRadius: 10,
                  border: '1px solid var(--color-border, #e2e8f0)',
                }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                      Committee *
                    </label>
                    <select
                      value={newCommitteeId}
                      onChange={e => setNewCommitteeId(e.target.value)}
                      style={{ width: '100%', marginTop: 4 }}
                    >
                      <option value="">— Select committee —</option>
                      {availableCommittees.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    {availableCommittees.length === 0 && (
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>
                        All active committees already assigned.
                      </span>
                    )}
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                      Role Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Chairperson, Records Officer, Member"
                      value={newRoleTitle}
                      onChange={e => setNewRoleTitle(e.target.value)}
                      style={{ width: '100%', marginTop: 4 }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      id="new_is_official"
                      checked={newIsOfficial}
                      onChange={e => setNewIsOfficial(e.target.checked)}
                    />
                    <label htmlFor="new_is_official" style={{ fontSize: 13, marginBottom: 0 }}>
                      Official (Chairperson / Vice-Chairperson)
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="btn btn-submit"
                      style={{ flex: 1 }}
                      onClick={addMembership}
                      disabled={membershipLoading}
                    >
                      {membershipLoading ? 'Adding…' : 'Add Membership'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-cancel"
                      style={{ flex: 1 }}
                      onClick={() => {
                        setAddingMembership(false);
                        setMembershipError(null);
                        setNewCommitteeId('');
                        setNewRoleTitle('');
                        setNewIsOfficial(false);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-submit"
                  style={{ width: '100%', justifyContent: 'center', fontSize: 13, marginTop: 4 }}
                  onClick={() => setAddingMembership(true)}
                >
                  + Add Committee Membership
                </button>
              )}
            </div>
          )}

          {!id && (
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Committee Memberships</label>
              <p style={{ fontSize: 13, color: '#9ca3af', padding: '10px', background: 'var(--color-surface)', borderRadius: 8, border: '1px dashed var(--color-border)' }}>
                Save the officer first, then open the edit form to assign committee memberships.
              </p>
            </div>
          )}
        </div>

        <div className="image-upload">
          <label>Avatar (optional)</label>
          <div
            className={`image-preview${avatarPreview ? " has-image" : ""}`}
            onClick={() => fileInputRef.current?.click()}
          >
            {avatarPreview ? (
              <img id="previewImage" alt="Avatar preview" src={avatarPreview} />
            ) : (
              <div className="image-placeholder">
                <div className="upload-icon">📁</div>
                <div className="upload-text">
                  <strong>Click to upload</strong>
                  <br />
                  PNG, JPG
                </div>
              </div>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleAvatarChange}
            className="file-input-hidden"
          />
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
            {id ? "Update" : "Add"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OfficerForm;
