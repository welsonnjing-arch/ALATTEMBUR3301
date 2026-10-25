import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

interface CookieItem {
  name: string;
  value: string;
  options?: Record<string, unknown>;
}

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieItem[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
            );
          } catch {
            // Dipanggil dari Server Component, aman diabaikan jika ada middleware refresh sesi.
          }
        },
      },
    }
  );
}
