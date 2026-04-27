import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export default async function fetchInventory() {
  const { data } = await axios.get(`${API_URL}/inventory`);

  return data.map((item: any) => {
    const { is_available, ...rest } = item;
    return {
      ...rest,
      status: item.is_available ? "In Stock" : "Out of Stock",
    };
  });
}
