import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Admin Client
 * Khusus server-side untuk operasi webhook, background cron, atau tindakan Owner.
 * JANGAN PERNAH diekspos ke client component / browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
