import axios from "axios";

export default async function fetchCommittees() {
  const { data } = await axios.get("http://localhost:3000/api/v1/committees");

  console.log(data);

  return data;
}

await fetchCommittees();
