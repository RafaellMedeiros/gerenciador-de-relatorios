import { redirect } from "next/navigation"

import { UserCircle } from "@phosphor-icons/react/ssr"

import { EditProfileForm } from "@/components/edit-profile-form"
import { createClient } from "@/lib/supabase/server"
import type { Profile } from "@/lib/types"

export default async function PerfilPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>()

  if (!profile) redirect("/login")

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-8">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground">
          <UserCircle className="size-5 text-primary" />
          Meu Perfil
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mantenha seus dados atualizados — essas informações são usadas nos
          relatórios.
        </p>
      </div>
      <EditProfileForm profile={profile} />
    </div>
  )
}
