import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export default async function fetchBulletinData() {
  const { data } = await axios.get(`${API_URL}/announcements/`);

  return data;
}
