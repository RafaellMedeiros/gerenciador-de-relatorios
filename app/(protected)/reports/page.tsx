import { redirect } from "next/navigation"

import { FileText } from "@phosphor-icons/react/ssr"

import { ReportsList } from "@/components/reports-list"
import { createClient } from "@/lib/supabase/server"
import type {
  ColaboradorReportSummary,
  MonthReportProgressRow,
  PlannerEntry,
  PlannerMonthAttachment,
  PlannerMonthReport,
  Profile,
} from "@/lib/types"

function currentPeriod() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
}

function lastDayOfPeriod(period: string) {
  const [year, month] = period.split("-").map(Number)
  const last = new Date(Date.UTC(year, month, 0))
  return last.toISOString().slice(0, 10)
}

export default async function ReportsPage() {
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

  if (profile?.role === "COLABORADOR") redirect("/home")

  const period = currentPeriod()

  const { data: progress, error: progressError } = await supabase.rpc(
    "month_report_progress",
    { p_period: period }
  )

  const progressRows = (progress as MonthReportProgressRow[] | null) ?? []
  const readyUserIds = progressRows
    .filter((row) => row.status === "ready")
    .map((row) => row.user_id)

  const [{ data: reports }, { data: entries }, { data: attachments }] =
    readyUserIds.length
      ? await Promise.all([
          supabase
            .from("planner_month_reports")
            .select("*")
            .eq("period", period)
            .in("user_id", readyUserIds),
          supabase
            .from("planner_entries")
            .select("*")
            .in("user_id", readyUserIds)
            .gte("entry_date", period)
            .lte("entry_date", lastDayOfPeriod(period))
            .order("entry_date", { ascending: true }),
          supabase
            .from("planner_month_attachments")
            .select("*")
            .eq("period", period)
            .in("user_id", readyUserIds)
            .order("created_at", { ascending: true }),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }]

  const reportByUserId = new Map(
    ((reports as PlannerMonthReport[] | null) ?? []).map((r) => [r.user_id, r])
  )

  const entriesByUserId = new Map<string, PlannerEntry[]>()
  for (const entry of (entries as PlannerEntry[] | null) ?? []) {
    const list = entriesByUserId.get(entry.user_id) ?? []
    list.push(entry)
    entriesByUserId.set(entry.user_id, list)
  }

  const signedAttachments = await Promise.all(
    ((attachments as PlannerMonthAttachment[] | null) ?? []).map(
      async (attachment) => {
        const { data: signed } = await supabase.storage
          .from("planner-attachments")
          .createSignedUrl(attachment.image_path, 3600)
        return { ...attachment, imageUrl: signed?.signedUrl ?? null }
      }
    )
  )
  const attachmentsByUserId = new Map<string, typeof signedAttachments>()
  for (const attachment of signedAttachments) {
    const list = attachmentsByUserId.get(attachment.user_id) ?? []
    list.push(attachment)
    attachmentsByUserId.set(attachment.user_id, list)
  }

  const summaries: ColaboradorReportSummary[] = progressRows.map((row) => ({
    userId: row.user_id,
    fullName: row.full_name,
    status: row.status,
    statusDate: row.marked_ready_at ?? row.last_activity_at,
    report: reportByUserId.get(row.user_id) ?? null,
    entries: entriesByUserId.get(row.user_id) ?? [],
    attachments: attachmentsByUserId.get(row.user_id) ?? [],
  }))

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground">
          <FileText className="size-5 text-primary" />
          Relatórios
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Status do relatório mensal de cada colaborador. Clique em um nome
          para ver os detalhes.
        </p>
      </div>
      {progressError ? (
        <p className="rounded-lg border border-dashed p-4 text-sm text-destructive">
          Não foi possível carregar o status dos colaboradores (
          {progressError.message}). Verifique se a migração
          supabase/migration_report_progress.sql foi aplicada no banco.
        </p>
      ) : (
        <ReportsList summaries={summaries} />
      )}
    </div>
  )
}
