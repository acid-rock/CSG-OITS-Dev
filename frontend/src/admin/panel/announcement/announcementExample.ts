import axios from "axios";

export type Announcement = {
  id: string;
  imgUrl: string;
  title: string;
  content: string;
  date: Date;
};

export async function getAnnouncements() {
  const { data } = await axios.get(
    "http://localhost:5050/api/v1/announcements/",
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
