import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export interface Organization {
  id: string;
  name: string;
  description: string | null;
  logo_path: string | null;
  logo_url: string | null;
  facebook_link: string | null;
  created_at: string;
  org_type: "academic" | "non-academic" | "spu" | "rotc" | null;
  /** UUID of parent organization. null = top-level org. */
  parent_id: string | null;
}

export async function fetchOrganizations(): Promise<Organization[]> {
  const { data } = await axios.get<Organization[]>(`${API_URL}/organizations/`);
  return data;
}
