import { redirect } from "next/navigation"

import { CreateUserForm } from "@/components/create-user-form"
import { createClient } from "@/lib/supabase/server"
import type { Profile, UserRole } from "@/lib/types"

const ASSIGNABLE_ROLES: Record<UserRole, UserRole[]> = {
  MASTER: ["ADM", "COLABORADOR"],
  ADM: ["COLABORADOR"],
  COLABORADOR: [],
}

const ROLE_LABELS: Record<UserRole, string> = {
  MASTER: "Master",
  ADM: "Administrador",
  COLABORADOR: "Colaborador",
}

export default async function UsuariosPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<Pick<Profile, "role">>()

  const assignableRoles = profile ? ASSIGNABLE_ROLES[profile.role] : []
  if (!assignableRoles.length) redirect("/home")

  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .neq("role", "MASTER")
    .order("created_at", { ascending: false })

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Usuários</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie as contas de administradores e colaboradores do sistema.
        </p>
        <ul className="mt-4 flex flex-col gap-2">
          {(users as Profile[] | null)?.map((u) => (
            <li
              key={u.id}
              className="flex items-center justify-between rounded-lg border bg-card p-3 transition-colors hover:bg-accent/40"
            >
              <div>
                <p className="font-medium">{u.full_name}</p>
                <p className="text-sm text-muted-foreground">{u.email}</p>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {ROLE_LABELS[u.role]}
              </span>
            </li>
          ))}
          {!users?.length && (
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Nenhum usuário ainda.
            </p>
          )}
        </ul>
      </div>
      <CreateUserForm assignableRoles={assignableRoles} />
    </div>
  )
}
