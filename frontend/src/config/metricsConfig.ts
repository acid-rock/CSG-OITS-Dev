import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL;

export async function fetchMetrics() {
  const response = await axios.get(`${API_URL}/metrics/page-views`);
  console.log(response.data);
  if (response.status === 200) {
    return response.data;
  }
}

export async function fetchSizeUsed() {
  const response = await axios.get(`${API_URL}/metrics/file-sizes`);
  if (response.status === 200) {
    console.log(response.data);
    return response.data;
  }
}

export default { fetchMetrics, fetchSizeUsed };
