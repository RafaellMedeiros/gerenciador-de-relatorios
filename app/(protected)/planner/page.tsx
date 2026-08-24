import { redirect } from "next/navigation"

import { PlannerCalendar } from "@/components/planner-calendar"
import { createClient } from "@/lib/supabase/server"
import type {
  PlannerEntry,
  PlannerMonthAttachment,
  PlannerMonthReport,
  Profile,
} from "@/lib/types"

function pad(n: number) {
  return String(n).padStart(2, "0")
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export default async function PlannerPage() {
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

  if (profile?.role !== "COLABORADOR") redirect("/home")

  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const [{ data: entries }, { data: monthReport }, { data: attachments }] =
    await Promise.all([
      supabase
        .from("planner_entries")
        .select("*")
        .gte("entry_date", toDateKey(firstDay))
        .lte("entry_date", toDateKey(lastDay)),
      supabase
        .from("planner_month_reports")
        .select("*")
        .eq("period", toDateKey(firstDay))
        .maybeSingle<PlannerMonthReport>(),
      supabase
        .from("planner_month_attachments")
        .select("*")
        .eq("period", toDateKey(firstDay))
        .order("created_at", { ascending: true }),
    ])

  const entriesByDate = Object.fromEntries(
    ((entries as PlannerEntry[] | null) ?? []).map((entry) => [
      entry.entry_date,
      entry,
    ])
  )

  const attachmentsWithUrl = await Promise.all(
    ((attachments as PlannerMonthAttachment[] | null) ?? []).map(
      async (attachment) => {
        const { data: signed } = await supabase.storage
          .from("planner-attachments")
          .createSignedUrl(attachment.image_path, 3600)
        return { ...attachment, imageUrl: signed?.signedUrl ?? null }
      }
    )
  )

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Planner</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Clique em um dia do mês para registrar suas atividades.
        </p>
      </div>
      <PlannerCalendar
        entriesByDate={entriesByDate}
        monthStatus={monthReport?.status ?? "draft"}
        monthDetails={{
          planejamento: monthReport?.planejamento ?? null,
          licoes_aprendidas: monthReport?.licoes_aprendidas ?? null,
          proximos_passos: monthReport?.proximos_passos ?? null,
        }}
        attachments={attachmentsWithUrl}
      />
    </div>
  )
}
