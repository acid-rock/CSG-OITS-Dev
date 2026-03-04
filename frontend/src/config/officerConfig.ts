import axios from "axios";

export default async function fetchOfficers() {
  const { data } = await axios.get("http://localhost:3000/api/v1/officers");

  return data;
}

console.log(await fetchOfficers());
