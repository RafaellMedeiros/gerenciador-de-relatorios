"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Profile, UserRole } from "@/lib/types"

export type CreateUserState = { error?: string } | undefined

const ROLES_A_CREATOR_CAN_ASSIGN: Record<UserRole, UserRole[]> = {
  MASTER: ["ADM", "COLABORADOR"],
  ADM: ["COLABORADOR"],
  COLABORADOR: [],
}

export async function createUser(
  _prevState: CreateUserState,
  formData: FormData
): Promise<CreateUserState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Não autenticado" }

  const { data: creatorProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<Pick<Profile, "role">>()

  if (!creatorProfile) return { error: "Perfil não encontrado" }

  const fullName = formData.get("full_name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const role = formData.get("role") as UserRole

  const allowedRoles = ROLES_A_CREATOR_CAN_ASSIGN[creatorProfile.role]
  if (!allowedRoles.includes(role)) {
    return { error: "Você não tem permissão para criar esse tipo de usuário" }
  }

  const admin = createAdminClient()

  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

  if (createError) return { error: createError.message }

  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    full_name: fullName,
    email,
    role,
    must_change_password: true,
    created_by: user.id,
  })

  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id)
    return { error: profileError.message }
  }

  revalidatePath("/usuarios")
  return undefined
}
