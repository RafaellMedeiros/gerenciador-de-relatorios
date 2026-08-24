"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export type UpdateProfileState =
  | { error?: string; success?: boolean }
  | undefined

export async function updateProfile(
  _prevState: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Não autenticado" }

  const fullName = (formData.get("full_name") as string).trim()
  const regionalHealthDepartment = (
    formData.get("regional_health_department") as string
  ).trim()
  const phone = (formData.get("phone") as string).trim()

  if (!fullName) return { error: "Informe o nome completo" }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      regional_health_department: regionalHealthDepartment || null,
      phone: phone || null,
    })
    .eq("id", user.id)

  if (error) return { error: error.message }

  revalidatePath("/", "layout")
  return { success: true }
}
