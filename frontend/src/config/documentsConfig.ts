import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL;

export default async function fetchDocuments() {
  const { data } = await axios.get(`${API_URL}/documents/`);

  const dataWithCategories = data.map((d: any) => {
    return {
      ...d,
      category: d.category
        .toLowerCase()
        .replace(/-/g, " ")
        .replace(/\b\w/g, (char: string) => char.toUpperCase()),
      date: d.createdAt,
    };
  });

  return dataWithCategories;
}
