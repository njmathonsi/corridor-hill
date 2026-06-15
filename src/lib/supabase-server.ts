import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
 
/**
 * Server-side Supabase client.
 * No auth — uses the publishable key with public row-level access.
 * Untyped client to avoid strict schema mismatches during build.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
 
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — cookie writes are ignored safely
          }
        },
      },
    }
  );
}
