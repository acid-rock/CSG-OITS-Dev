import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL as string;

interface Committee {
  id: number;
  name: string;
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
    committee?: number | null;
    is_committee_official?: boolean;
  };
  setOpen: (open: boolean) => void;
  onSuccess?: () => void;
}

const OfficerForm = ({
  id,
  initialData = {},
  setOpen,
  onSuccess,
}: OfficerFormProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [committees, setCommittees] = useState<Committee[]>([]);

  const [fullName, setFullName] = useState(initialData.full_name ?? '');
  const [position, setPosition] = useState(initialData.position ?? '');
  const [type, setType] = useState(initialData.type ?? 'executive');
  const [socials, setSocials] = useState(initialData.socials ?? '');
  const [yearServing, setYearServing] = useState(initialData.year_serving ?? '');
  const [studentNumber, setStudentNumber] = useState(initialData.student_number ?? '');
  const [committee, setCommittee] = useState<string>(
    initialData.committee != null ? String(initialData.committee) : '',
  );
  const [isCommitteeOfficial, setIsCommitteeOfficial] = useState(
    initialData.is_committee_official ?? false,
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get<Committee[]>(`${API_URL}/committees`, { withCredentials: true })
      .then(({ data }) => setCommittees(data))
      .catch(() => {});
  }, []);

  // Auto-fill yearServing from active term if not editing
  useEffect(() => {
    if (!initialData.year_serving) {
      axios
        .get(`${API_URL}/settings/term`, { withCredentials: true })
        .then(({ data }) => { if (data?.value) setYearServing(data.value); })
        .catch(() => {});
    }
  }, []);

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
    formData.append('full_name', fullName);
    formData.append('position', position);
    formData.append('type', type);
    formData.append('socials', socials);
    formData.append('year_serving', yearServing);
    formData.append('student_number', studentNumber);
    formData.append('committee', committee);
    formData.append('is_committee_official', String(isCommitteeOfficial));
    if (id) formData.append('id', id);
    if (avatarFile) formData.append('avatar', avatarFile);

    try {
      const endpoint = id
        ? `${API_URL}/officers/edit`
        : `${API_URL}/officers/add`;
      await axios.post(endpoint, formData, { withCredentials: true });
      onSuccess?.();
      setOpen(false);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? (err instanceof Error ? err.message : 'Failed to save officer.');
      if (status === 409) {
        setError(msg);
      } else {
        setError('Failed to add officer. Please try again.');
      }
    }
  };

  return (
    <div className='form-container'>
      <div className='form-header'>
        <h2>{id ? 'Edit Officer' : 'Add Officer'}</h2>
      </div>

      {error && <p style={{ color: 'red', padding: '0 1rem' }}>{error}</p>}

      <form className='form-layout' onSubmit={handleSubmit}>
        <div className='form-fields'>
          <div className='form-group'>
            <label htmlFor='full_name'>Full Name *</label>
            <input
              type='text'
              id='full_name'
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder='Juan Dela Cruz'
              required
            />
          </div>

          <div className='form-group'>
            <label htmlFor='position'>Position *</label>
            <input
              type='text'
              id='position'
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder='President'
              required
            />
          </div>

          <div className='form-group'>
            <label htmlFor='type'>Type *</label>
            <select
              id='type'
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value='executive'>Executive</option>
              <option value='board'>Board Member</option>
              <option value='adviser'>Adviser</option>
              <option value='member'>Member</option>
              <option value='former'>Former</option>
            </select>
          </div>

          <div className='form-group'>
            <label htmlFor='committee'>Committee</label>
            <select
              id='committee'
              value={committee}
              onChange={(e) => setCommittee(e.target.value)}
            >
              <option value=''>— None —</option>
              {committees.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className='form-group'>
            <label htmlFor='socials'>Facebook URL</label>
            <input
              type='url'
              id='socials'
              value={socials}
              onChange={(e) => setSocials(e.target.value)}
              placeholder='https://facebook.com/...'
            />
          </div>

          <div className='form-group'>
            <label htmlFor='year_serving'>
              Term (S.Y.){type === 'former' ? ' *' : ''}
            </label>
            <input
              type='text'
              id='year_serving'
              value={yearServing}
              onChange={(e) => setYearServing(e.target.value)}
              placeholder='e.g. 2025-2026'
              required={type === 'former'}
            />
            {type === 'former' && (
              <span style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.2rem' }}>
                Required for former officers — used to group in archived view.
              </span>
            )}
          </div>

          <div className='form-group'>
            <label htmlFor='student_number'>Student Number</label>
            <input
              type='text'
              id='student_number'
              value={studentNumber}
              onChange={(e) => setStudentNumber(e.target.value)}
              placeholder='2021-XXXXX'
            />
          </div>

          <div className='form-group' style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type='checkbox'
              id='is_committee_official'
              checked={isCommitteeOfficial}
              onChange={(e) => setIsCommitteeOfficial(e.target.checked)}
            />
            <label htmlFor='is_committee_official' style={{ marginBottom: 0 }}>
              Committee Official (Chair/Vice)
            </label>
          </div>
        </div>

        <div className='image-upload'>
          <label>Avatar (optional)</label>
          <div
            className={`image-preview${avatarPreview ? ' has-image' : ''}`}
            onClick={() => fileInputRef.current?.click()}
          >
            {avatarPreview ? (
              <img id='previewImage' alt='Avatar preview' src={avatarPreview} />
            ) : (
              <div className='image-placeholder'>
                <div className='upload-icon'>📁</div>
                <div className='upload-text'>
                  <strong>Click to upload</strong>
                  <br />
                  PNG, JPG
                </div>
              </div>
            )}
          </div>
          <input
            type='file'
            ref={fileInputRef}
            accept='image/*'
            onChange={handleAvatarChange}
            className='file-input-hidden'
          />
        </div>

        <div className='form-actions'>
          <button type='button' className='btn btn-cancel' onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button type='submit' className='btn btn-submit'>
            {id ? 'Update' : 'Add'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OfficerForm;
