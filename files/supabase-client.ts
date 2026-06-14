import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Returns a memoised browser-side Supabase client.
 * Uses NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY — no auth session management.
 * Every visitor gets the same anon-level public access.
 */
export function getSupabaseClient() {
  if (!client) {
    client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
  }
  return client;
}
