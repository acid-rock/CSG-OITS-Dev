import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Leaflet's default icon resolves its image paths at runtime, which breaks under
// a bundler. Point it at the assets Vite emits (served same-origin) instead.
// Icon.Default also prepends an auto-detected imagePath to these URLs, doubling
// the path under a bundler — drop that override so our resolved URLs are used verbatim.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface GeofenceMapProps {
  lat: number;
  lng: number;
  radiusM: number;
}

/**
 * Renders the office geofence (center marker + allowed-radius circle) with
 * Leaflet directly in the React tree. Replaces the former srcDoc-iframe map,
 * which loaded Leaflet from a CDN and ran an inline script — both blocked by
 * the production CSP. Tiles come from OpenStreetMap (allowed via img-src).
 */
export default function GeofenceMap({ lat, lng, radiusM }: GeofenceMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  // Init once on mount.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
      zoomControl: true,
    }).setView([lat, lng], 17);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
    }).addTo(map);

    markerRef.current = L.marker([lat, lng]).addTo(map);
    circleRef.current = L.circle([lat, lng], {
      radius: radiusM,
      color: '#4f6fd1',
      fillColor: '#4f6fd1',
      fillOpacity: 0.12,
      weight: 2,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
    };
    // Mount-only; subsequent prop changes are handled by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-center / resize when coords or radius change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setView([lat, lng], map.getZoom());
    markerRef.current?.setLatLng([lat, lng]);
    circleRef.current?.setLatLng([lat, lng]);
    circleRef.current?.setRadius(radiusM);
  }, [lat, lng, radiusM]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
