/**
 * LogbookPage — router entry point for /logbook
 *
 * Delegates to the correct component based on the ?action= query param:
 *   ?action=checkout  → LogbookCheckoutKiosk (full-screen kiosk display)
 *   everything else   → LogbookCheckin       (mobile QR check-in flow)
 */
import { useSearchParams } from 'react-router-dom';
import LogbookCheckin from './LogbookCheckin';
import LogbookCheckoutKiosk from './LogbookCheckoutKiosk';

export default function LogbookPage() {
  const [sp] = useSearchParams();
  if (sp.get('action') === 'checkout') {
    return <LogbookCheckoutKiosk />;
  }
  return <LogbookCheckin />;
}
