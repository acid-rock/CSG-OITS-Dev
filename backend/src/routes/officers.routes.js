import { Router } from "express";
import { anonSupabase } from "../lib/supabaseClient.js";
const router = Router();

router.get("/", async (req, res) => {
  const { data, error } = await anonSupabase
    .from("officers")
    .select()
    .order("created_at", { ascending: true });

  if (error) return res.status(400).json({ message: error.message });

  const payload = data.map((officer) => {
    let avatar = "";
    if (officer.avatar === null) {
      return officer;
    } else {
      avatar = anonSupabase.storage
        .from("officers")
        .getPublicUrl(officer.avatar).data.publicUrl;
    }

    return {
      id: officer.id,
      created_at: officer.created_at,
      full_name: officer.full_name,
      position: officer.position,
      avatar: avatar,
      type: officer.type,
      socials: officer.socials,
      year_serving: officer.year_serving,
      student_number: officer.student_number,
      committee: officer.committee,
      is_committee_official: officer.is_committee_official,
    };
  });

  return res.status(200).json(payload);
});

export default router;
