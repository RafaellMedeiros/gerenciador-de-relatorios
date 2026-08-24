import { createClient } from "@supabase/supabase-js"

/**
 * Privileged client authenticated with the service_role key — bypasses RLS.
 * Only use from server actions after verifying the caller's role; never
 * import this from client components.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
