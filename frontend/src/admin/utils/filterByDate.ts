export function filterByDate(date: string, filter: string): boolean {
  if (!filter || filter === "All") return true;
  const fileDate = new Date(date);
  const now = new Date();
  if (filter === "Today") return fileDate.toDateString() === now.toDateString();
  if (filter === "This Week") {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return fileDate >= startOfWeek;
  }
  if (filter === "This Month") {
    return (
      fileDate.getMonth() === now.getMonth() &&
      fileDate.getFullYear() === now.getFullYear()
    );
  }
  return true;
}
