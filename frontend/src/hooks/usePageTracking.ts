import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    fetch(`${API_URL}/metrics/page-track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path: location.pathname }),
    });
  }, [location.pathname]);
}
