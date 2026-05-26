import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../splash-screen/splash-screen.css';
import './queue-screen.css';

const API = import.meta.env.VITE_API_URL as string;
const POLL_INTERVAL_MS = 15_000;

interface QueueScreenProps {
  initialPosition: number;
  onAllowed: (token: string) => void;
}

export default function QueueScreen({ initialPosition, onAllowed }: QueueScreenProps) {
  const [position, setPosition] = useState(initialPosition);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onAllowedRef = useRef(onAllowed);
  onAllowedRef.current = onAllowed;

  const tryJoin = async () => {
    try {
      const { data } = await axios.post(`${API}/access/join`);
      if (data.allowed) {
        if (timerRef.current) clearInterval(timerRef.current);
        onAllowedRef.current(data.token as string);
      } else {
        setPosition(data.position as number);
      }
    } catch {
      /* keep polling — backend may be momentarily unreachable */
    }
  };

  useEffect(() => {
    timerRef.current = setInterval(tryJoin, POLL_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="splash-overlay">
      <div className="splash-content queue-content">
        <img src="/CSG_logo.svg" alt="CSG Logo" className="splash-logo" />

        <div className="splash-row queue-row">
          <span className="splash-spinner" aria-hidden="true" />
          <p className="splash-label queue-label">
            You are <strong className="queue-position">{position}</strong> in line to access the
            CSG&nbsp;OITS, please wait a moment.
          </p>
        </div>

        <p className="queue-sublabel">Checking for an open slot every 15 seconds…</p>
      </div>
    </div>
  );
}
