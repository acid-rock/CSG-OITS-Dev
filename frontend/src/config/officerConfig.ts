import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export interface CommitteeMembership {
  id: string;
  officer_id: string;
  committee_id: string;
  role_title: string;
  is_official: boolean;
  created_at?: string;
  /** Joined from committees table */
  committees?: { id: string; name: string };
}

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
  committee?: string | null;  // UUID FK → committees.id (primary committee, legacy)
  is_committee_official: boolean;
  status?: string;
  committee_memberships?: CommitteeMembership[];
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
  status?: string,
): Promise<OfficerItem[] | PaginatedOfficers> {
  const params: Record<string, string | number> = {};
  if (page !== undefined) params.page = page;
  if (limit !== undefined) params.limit = limit;
  if (term) params.term = term;
  if (status) params.status = status;

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
