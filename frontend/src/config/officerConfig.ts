import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

interface OfficerItem {
  id: string;
  created_at: string;
  full_name: string;
  position: string | string[];
  avatar: string;
  type: string;
  socials?: string;
  year_serving: string;
  student_number?: string;
  committee?: number;
  is_committee_official: boolean;
}

interface PaginatedOfficers {
  data: OfficerItem[];
  total: number;
  page: number;
  limit: number;
}

// Without pagination params: returns a flat array (backward compatible with Root-layout).
// With pagination params: returns { data, total, page, limit }.
export default async function fetchOfficers(
  page?: number,
  limit?: number,
  term?: string,
): Promise<OfficerItem[] | PaginatedOfficers> {
  const params: Record<string, string | number> = {};
  if (page !== undefined) params.page = page;
  if (limit !== undefined) params.limit = limit;
  if (term) params.term = term;

  const { data } = await axios.get(`${API_URL}/officers`, {
    params: Object.keys(params).length > 0 ? params : undefined,
  });

  if (page !== undefined || limit !== undefined) {
    return {
      data: data.data,
      total: data.total,
      page: data.page,
      limit: data.limit,
    };
  }

  return data as OfficerItem[];
}
