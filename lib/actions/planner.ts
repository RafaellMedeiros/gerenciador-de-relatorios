"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export type UpsertPlannerEntryState = { error?: string } | undefined

const PLANNER_FIELDS = ["atividades_manha", "atividades_tarde"] as const

const MONTH_DETAIL_FIELDS = [
  "planejamento",
  "licoes_aprendidas",
  "proximos_passos",
] as const

function isCurrentMonth(entryDate: string) {
  const now = new Date()
  const [year, month] = entryDate.split("-").map(Number)
  return year === now.getFullYear() && month === now.getMonth() + 1
}

export async function upsertPlannerEntry(
  _prevState: UpsertPlannerEntryState,
  formData: FormData
): Promise<UpsertPlannerEntryState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Não autenticado" }

  const entryDate = formData.get("entry_date") as string
  if (!entryDate || !isCurrentMonth(entryDate)) {
    return { error: "Só é possível editar dias do mês corrente" }
  }

  const fields = Object.fromEntries(
    PLANNER_FIELDS.map((field) => [field, (formData.get(field) as string) || null])
  )

  const { error } = await supabase.from("planner_entries").upsert(
    {
      user_id: user.id,
      entry_date: entryDate,
      ...fields,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,entry_date" }
  )

  if (error) return { error: error.message }

  revalidatePath("/planner")
  return undefined
}

export type SetMonthReportStatusState = { error?: string } | undefined

function currentPeriod() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
}

export async function setMonthReportStatus(
  _prevState: SetMonthReportStatusState,
  formData: FormData
): Promise<SetMonthReportStatusState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Não autenticado" }

  const status = formData.get("status") === "ready" ? "ready" : "draft"

  const { error } = await supabase.from("planner_month_reports").upsert(
    {
      user_id: user.id,
      period: currentPeriod(),
      status,
      marked_ready_at: status === "ready" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,period" }
  )

  if (error) return { error: error.message }

  revalidatePath("/planner")
  revalidatePath("/reports")
  return undefined
}

export type UpsertMonthDetailsState = { error?: string } | undefined

export async function upsertMonthDetails(
  _prevState: UpsertMonthDetailsState,
  formData: FormData
): Promise<UpsertMonthDetailsState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Não autenticado" }

  const fields = Object.fromEntries(
    MONTH_DETAIL_FIELDS.map((field) => [field, (formData.get(field) as string) || null])
  )

  const { error } = await supabase.from("planner_month_reports").upsert(
    {
      user_id: user.id,
      period: currentPeriod(),
      ...fields,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,period" }
  )

  if (error) return { error: error.message }

  revalidatePath("/planner")
  revalidatePath("/reports")
  return undefined
}

export type MonthAttachmentActionState = { error?: string } | undefined

export async function addMonthAttachment(
  _prevState: MonthAttachmentActionState,
  formData: FormData
): Promise<MonthAttachmentActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Não autenticado" }

  const image = formData.get("image") as File | null
  if (!image || image.size === 0) return { error: "Selecione uma imagem" }

  const caption = (formData.get("caption") as string) || null
  const period = currentPeriod()
  const imagePath = `${user.id}/${period}/${crypto.randomUUID()}-${image.name}`

  const { error: uploadError } = await supabase.storage
    .from("planner-attachments")
    .upload(imagePath, image)
  if (uploadError) return { error: uploadError.message }

  const { error } = await supabase.from("planner_month_attachments").insert({
    user_id: user.id,
    period,
    image_path: imagePath,
    caption,
  })

  if (error) return { error: error.message }

  revalidatePath("/planner")
  return undefined
}

export async function deleteMonthAttachment(
  _prevState: MonthAttachmentActionState,
  formData: FormData
): Promise<MonthAttachmentActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Não autenticado" }

  const attachmentId = formData.get("attachment_id") as string

  const { data: attachment } = await supabase
    .from("planner_month_attachments")
    .select("image_path, user_id")
    .eq("id", attachmentId)
    .single<{ image_path: string; user_id: string }>()

  if (!attachment || attachment.user_id !== user.id) {
    return { error: "Anexo não encontrado" }
  }

  const { error } = await supabase
    .from("planner_month_attachments")
    .delete()
    .eq("id", attachmentId)

  if (error) return { error: error.message }

  await supabase.storage.from("planner-attachments").remove([attachment.image_path])

  revalidatePath("/planner")
  return undefined
}
