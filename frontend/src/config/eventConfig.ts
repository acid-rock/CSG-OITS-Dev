import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL;

export default async function fetchEvents() {
  const { data } = await axios.get(`${API_URL}/events`);

  console.log(data);
  return data;
}
