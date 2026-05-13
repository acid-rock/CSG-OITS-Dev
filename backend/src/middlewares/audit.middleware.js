import { supabase } from '../lib/supabaseClient.js';

export function auditLogger(action) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = function(body) {
      // Log only on success (2xx responses)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user?.sub ?? null;
        // Fire-and-forget — don't block the response
        supabase.from('audit_logs').insert({
          action: action ?? null,
          created_by: userId,
          ip_address: req.ip,
          created_at: new Date().toISOString(),
        }).then(({ error }) => {
          if (error) console.error('Audit log insert failed:', error.message);
        });
      }
      return originalJson(body);
    };
    next();
  };
}
