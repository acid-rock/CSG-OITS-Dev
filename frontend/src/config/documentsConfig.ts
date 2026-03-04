import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL;

export default async function fetchDocuments() {
  const { data } = await axios.get(`${API_URL}/documents`);

  const dataWithFormattedDates = data.map((d: any) => {
    const date = new Date(d.createdAt);
    return {
      ...d,
      category: d.category
        .toLowerCase()
        .replace(/-/g, " ")
        .replace(/\b\w/g, (char: string) => char.toUpperCase()),
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };
  });

  return dataWithFormattedDates;
}
