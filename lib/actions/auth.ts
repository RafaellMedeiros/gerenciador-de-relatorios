"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

export type ChangePasswordState = { error?: string } | undefined

export async function changePassword(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Não autenticado" }

  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirm_password") as string

  if (password !== confirmPassword) {
    return { error: "As senhas não coincidem" }
  }

  const { error: updateError } = await supabase.auth.updateUser({ password })
  if (updateError) return { error: updateError.message }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ must_change_password: false })
    .eq("id", user.id)

  if (profileError) return { error: profileError.message }

  redirect("/home")
}
