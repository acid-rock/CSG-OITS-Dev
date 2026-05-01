import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

interface DocumentItem {
  id: string;
  createdAt: string;
  name: string;
  description: string;
  category: string;
  url: string;
  thumbnail: string;
}

interface PaginatedDocuments {
  data: DocumentItem[];
  total: number;
  page: number;
  limit: number;
}

function formatDoc(d: DocumentItem) {
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
}

// Without pagination params: returns a flat array (backward compatible with Root-layout).
// With pagination params: returns { data, total, page, limit }.
export default async function fetchDocuments(
  page?: number,
  limit?: number,
): Promise<DocumentItem[] | PaginatedDocuments> {
  const params: Record<string, number> = {};
  if (page !== undefined) params.page = page;
  if (limit !== undefined) params.limit = limit;

  const { data } = await axios.get(`${API_URL}/documents`, {
    params: Object.keys(params).length > 0 ? params : undefined,
  });

  if (page !== undefined || limit !== undefined) {
    // Paginated response: { data: [...], total, page, limit }
    return {
      data: data.data.map(formatDoc),
      total: data.total,
      page: data.page,
      limit: data.limit,
    };
  }

  // Flat array response (non-paginated)
  return (data as DocumentItem[]).map(formatDoc);
}
