import axios from "axios";

export default async function fetchDocuments() {
  const { data } = await axios.get("http://localhost:3000/api/v1/documents");

  return data;
}

await fetchDocuments();
