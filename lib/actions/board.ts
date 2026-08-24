"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { Profile } from "@/lib/types"

export type BoardActionState = { error?: string } | undefined

async function requireAdminProfile() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Não autenticado" as const }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single<Pick<Profile, "full_name" | "role">>()

  if (!profile || (profile.role !== "MASTER" && profile.role !== "ADM")) {
    return { error: "Você não tem permissão para publicar no mural" as const }
  }

  return { supabase, user, profile }
}

export async function createPost(
  _prevState: BoardActionState,
  formData: FormData
): Promise<BoardActionState> {
  const admin = await requireAdminProfile()
  if ("error" in admin) return { error: admin.error }
  const { supabase, user, profile } = admin

  const caption = (formData.get("caption") as string) || null
  const image = formData.get("image") as File | null

  let imagePath: string | null = null
  if (image && image.size > 0) {
    imagePath = `${crypto.randomUUID()}-${image.name}`
    const { error: uploadError } = await supabase.storage
      .from("board-images")
      .upload(imagePath, image)
    if (uploadError) return { error: uploadError.message }
  }

  const { error } = await supabase.from("board_posts").insert({
    author_id: user.id,
    author_name: profile.full_name,
    caption,
    image_path: imagePath,
  })

  if (error) return { error: error.message }

  revalidatePath("/home")
  return undefined
}

export async function updatePost(
  _prevState: BoardActionState,
  formData: FormData
): Promise<BoardActionState> {
  const admin = await requireAdminProfile()
  if ("error" in admin) return { error: admin.error }
  const { supabase } = admin

  const postId = formData.get("post_id") as string
  const caption = (formData.get("caption") as string) || null
  const image = formData.get("image") as File | null

  const update: { caption: string | null; image_path?: string; updated_at: string } = {
    caption,
    updated_at: new Date().toISOString(),
  }

  if (image && image.size > 0) {
    const { data: existingPost } = await supabase
      .from("board_posts")
      .select("image_path")
      .eq("id", postId)
      .single<{ image_path: string | null }>()

    const imagePath = `${crypto.randomUUID()}-${image.name}`
    const { error: uploadError } = await supabase.storage
      .from("board-images")
      .upload(imagePath, image)
    if (uploadError) return { error: uploadError.message }

    update.image_path = imagePath

    if (existingPost?.image_path) {
      await supabase.storage.from("board-images").remove([existingPost.image_path])
    }
  }

  const { error } = await supabase
    .from("board_posts")
    .update(update)
    .eq("id", postId)

  if (error) return { error: error.message }

  revalidatePath("/home")
  return undefined
}

export async function createComment(
  _prevState: BoardActionState,
  formData: FormData
): Promise<BoardActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Não autenticado" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single<Pick<Profile, "full_name">>()

  if (!profile) return { error: "Perfil não encontrado" }

  const postId = formData.get("post_id") as string
  const body = formData.get("body") as string

  if (!body?.trim()) return { error: "Escreva um comentário" }

  const { error } = await supabase.from("board_comments").insert({
    post_id: postId,
    author_id: user.id,
    author_name: profile.full_name,
    body,
  })

  if (error) return { error: error.message }

  revalidatePath("/home")
  return undefined
}
