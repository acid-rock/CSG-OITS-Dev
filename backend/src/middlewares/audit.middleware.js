export function auditLogger(action) {
  return async (req, res, next) => {
    if (res.statusCode < 400) {
      console.log(req.user?.sub, typeof req.user?.sub);
      await req.supabase.rpc("set_audit_context", {
        user_id: req.user?.sub,
        ip_address: req.ip,
        user_agent: req.headers["user-agent"],
      });
    }
    next();
  };
}
