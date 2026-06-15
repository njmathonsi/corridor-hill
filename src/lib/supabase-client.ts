import { createBrowserClient } from "@supabase/ssr";
 
let client: ReturnType<typeof createBrowserClient> | null = null;
 
/**
 * Returns a memoised browser-side Supabase client.
 * Uses NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY — no auth session management.
 * Every visitor gets the same anon-level public access.
 */
export function getSupabaseClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
  }
  return client;
}
 
