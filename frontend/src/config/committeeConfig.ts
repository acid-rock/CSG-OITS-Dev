import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;

export interface Committee {
  id: string;            // UUID — never parse as number
  name: string;
  status: 'active' | 'archived';
  chair_name: string | null;
  cover_image_path: string | null;
  cover_image_url: string | null;  // resolved by backend from committees bucket
  deleted_at: string | null;
}

export default async function fetchCommittees(): Promise<Committee[]> {
  const { data } = await axios.get(`${API_URL}/committees`);
  return data;
}
