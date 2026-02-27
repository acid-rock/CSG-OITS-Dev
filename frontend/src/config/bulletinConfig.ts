import axios from "axios";

export default async function fetchBulletinData() {
  const { data } = await axios.get(
    "http://localhost:3000/api/v1/announcements/",
  );

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

await fetchBulletinData();
