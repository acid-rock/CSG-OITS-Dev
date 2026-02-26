import './whitelistform.css';
import { useState } from 'react';

interface whitelistProps {
  close: () => void;
}

const WhitelistForm = ({ close }: whitelistProps) => {
  const [name, setName] = useState<string>();

  const handleSubmit = () => {
    if (!name) return;
    //* send the entered Gmail address to the backend server via a POST request.
  };

  return (
    <div onClick={close} className='whitelist-overlay'>
      <div
        className='whitelist-form-container'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='input-container'>
          <input
            type='text'
            placeholder='example@gmail.com...'
            onChange={(e) => setName(e.target.value)}
          />
          <button type='button' onClick={handleSubmit}>
            Submit
          </button>
        </div>
        <div className='name-container'></div>
      </div>
    </div>
  );
};

export default WhitelistForm;
