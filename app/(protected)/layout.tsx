import { SiteHeader } from "@/components/site-header"
import { createClient } from "@/lib/supabase/server"
import type { Profile } from "@/lib/types"

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let role: Profile["role"] | undefined
  let fullName: string | undefined
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single<Pick<Profile, "role" | "full_name">>()
    role = profile?.role
    fullName = profile?.full_name
  }

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader role={role} fullName={fullName} />
      <main className="flex-1 p-6 md:p-10">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  )
}
