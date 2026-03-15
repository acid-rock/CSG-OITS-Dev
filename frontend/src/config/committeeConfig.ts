import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;

export default async function fetchCommittees() {
  const { data } = await axios.get(`${API_URL}/committees`);

  return data;
}

await fetchCommittees();
