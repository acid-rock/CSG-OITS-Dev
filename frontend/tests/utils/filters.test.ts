import { describe, it, expect } from "vitest";

// Pure filter logic — mirrors what admin announcement/document panels do inline.
// Tests are independent of component rendering.

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  category: string;
  term_year: string;
}

const announcements: AnnouncementItem[] = [
  {
    id: "1",
    title: "CSG Meeting",
    content: "Meeting notes",
    category: "CSG Updates",
    term_year: "AY 2025-2026",
  },
  {
    id: "2",
    title: "Class Suspension",
    content: "No classes",
    category: "Class Advisories",
    term_year: "AY 2025-2026",
  },
  {
    id: "3",
    title: "Exam Schedule",
    content: "Finals week",
    category: "Examinations",
    term_year: "AY 2024-2025",
  },
];

function filterAnnouncements(
  items: AnnouncementItem[],
  search: string,
  category: string,
  term: string,
): AnnouncementItem[] {
  return items.filter((a) => {
    const matchesSearch =
      !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !category || a.category === category;
    const matchesTerm = !term || a.term_year === term;
    return matchesSearch && matchesCategory && matchesTerm;
  });
}

describe("announcement client-side filter logic", () => {
  it("returns all items when no filters are active", () => {
    expect(filterAnnouncements(announcements, "", "", "")).toHaveLength(3);
  });

  it("filters by search query against title", () => {
    const result = filterAnnouncements(announcements, "Meeting", "", "");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("filters by search query against content", () => {
    const result = filterAnnouncements(announcements, "Finals", "", "");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("3");
  });

  it("search is case-insensitive", () => {
    expect(filterAnnouncements(announcements, "MEETING", "", "")).toHaveLength(
      1,
    );
    expect(filterAnnouncements(announcements, "meeting", "", "")).toHaveLength(
      1,
    );
  });

  it("filters by category", () => {
    const result = filterAnnouncements(
      announcements,
      "",
      "Class Advisories",
      "",
    );
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe("Class Advisories");
  });

  it("filters by term year", () => {
    const result = filterAnnouncements(announcements, "", "", "AY 2024-2025");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("3");
  });

  it("applies search AND category AND term as AND logic", () => {
    const result = filterAnnouncements(
      announcements,
      "Meeting",
      "CSG Updates",
      "AY 2025-2026",
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("returns empty array when no items match", () => {
    const result = filterAnnouncements(announcements, "nonexistent", "", "");
    expect(result).toHaveLength(0);
  });
});
