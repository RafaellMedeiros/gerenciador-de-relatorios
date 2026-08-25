"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export type AuthActionState = { error?: string } | undefined

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "Invalid login credentials": "E-mail ou senha inválidos.",
  "Email not confirmed": "E-mail ainda não confirmado.",
  "Too many requests": "Muitas tentativas. Aguarde um momento e tente novamente.",
}

export async function login(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  })

  if (error) {
    return {
      error:
        AUTH_ERROR_MESSAGES[error.message] ??
        "Não foi possível entrar. Tente novamente.",
    }
  }

  redirect("/home")
}
