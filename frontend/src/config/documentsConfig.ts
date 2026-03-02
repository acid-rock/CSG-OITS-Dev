import axios from "axios";

export default async function fetchDocuments() {
  const { data } = await axios.get("http://localhost:3000/api/v1/documents");

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
  console.log(dataWithFormattedDates);

  return dataWithFormattedDates;
}

await fetchDocuments();
