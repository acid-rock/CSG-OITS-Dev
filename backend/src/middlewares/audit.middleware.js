import { supabase } from "../lib/supabaseClient.js";

export function auditLogger(action) {
  return async (req, res, next) => {
    if (res.statusCode < 400) {
      await supabase.rpc("set_audit_context", {
        user_id: req.user?.sub,
        ip_address: req.ip,
        user_agent: req.headers["user-agent"],
      });
    }
    next();
  };
}
