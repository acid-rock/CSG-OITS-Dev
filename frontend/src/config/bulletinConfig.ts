import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export default async function fetchBulletinData() {
  const { data } = await axios.get(`${API_URL}/announcements/`);

  const dataWithFormattedDates = data.map((d: any) => {
    const date = new Date(d.date);
    return {
      ...d,
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };
  });

  return dataWithFormattedDates;
}
