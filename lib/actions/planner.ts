"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export type UpsertPlannerEntryState = { error?: string } | undefined

const PLANNER_FIELDS = [
  "dificuldades",
  "atividades",
  "ensinamentos",
  "proximas_acoes",
  "visitas_realizadas",
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
