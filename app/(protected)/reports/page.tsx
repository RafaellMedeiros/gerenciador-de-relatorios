import { redirect } from "next/navigation"

import { CalendarBlank, CheckCircle, FileText } from "@phosphor-icons/react/ssr"

import { createClient } from "@/lib/supabase/server"
import type {
  PlannerEntry,
  PlannerMonthAttachment,
  PlannerMonthReport,
  Profile,
} from "@/lib/types"

const FIELDS: { name: keyof PlannerEntry; label: string }[] = [
  { name: "atividades_manha", label: "Atividades realizadas pela manhã" },
  { name: "atividades_tarde", label: "Atividades realizadas à tarde" },
]

const MONTH_DETAIL_FIELDS: { name: keyof PlannerMonthReport; label: string }[] = [
  { name: "planejamento", label: "Planejamento" },
  { name: "licoes_aprendidas", label: "Lições aprendidas" },
  { name: "proximos_passos", label: "Próximos passos" },
]

function formatMonth(period: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${period}T00:00:00Z`))
}

function formatDay(dateKey: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${dateKey}T00:00:00Z`))
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

  const { data: monthReports } = await supabase
    .from("planner_month_reports")
    .select("*")
    .eq("status", "ready")
    .order("period", { ascending: false })

  const readyReports = (monthReports as PlannerMonthReport[] | null) ?? []

  const authorIds = [...new Set(readyReports.map((report) => report.user_id))]
  const { data: authors } = authorIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", authorIds)
    : { data: [] }

  const authorNameById = new Map(
    (authors as Pick<Profile, "id" | "full_name">[] | null ?? []).map(
      (author) => [author.id, author.full_name]
    )
  )

  const entriesByReportId = new Map<string, PlannerEntry[]>()
  const attachmentsByReportId = new Map<
    string,
    (PlannerMonthAttachment & { imageUrl: string | null })[]
  >()
  await Promise.all(
    readyReports.map(async (report) => {
      const [{ data: entries }, { data: attachments }] = await Promise.all([
        supabase
          .from("planner_entries")
          .select("*")
          .eq("user_id", report.user_id)
          .gte("entry_date", report.period)
          .lte("entry_date", lastDayOfPeriod(report.period))
          .order("entry_date", { ascending: true }),
        supabase
          .from("planner_month_attachments")
          .select("*")
          .eq("user_id", report.user_id)
          .eq("period", report.period)
          .order("created_at", { ascending: true }),
      ])

      entriesByReportId.set(report.id, (entries as PlannerEntry[] | null) ?? [])

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
      attachmentsByReportId.set(report.id, attachmentsWithUrl)
    })
  )

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground">
          <FileText className="size-5 text-primary" />
          Relatórios
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Relatórios mensais que os colaboradores marcaram como prontos.
        </p>
      </div>
      <ul className="flex flex-col gap-4">
        {readyReports.map((report) => {
          const entries = entriesByReportId.get(report.id) ?? []
          const attachments = attachmentsByReportId.get(report.id) ?? []
          return (
            <li key={report.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-medium text-foreground">
                  Relatório de {authorNameById.get(report.user_id) ?? "Usuário"}
                </p>
                <p className="flex items-center gap-1 text-xs capitalize text-muted-foreground">
                  <CalendarBlank className="size-3.5" />
                  {formatMonth(report.period)}
                </p>
              </div>
              <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-green-600">
                <CheckCircle className="size-3.5" weight="fill" />
                Pronto
              </p>

              <dl className="mt-3 flex flex-col gap-2 border-t pt-3">
                {MONTH_DETAIL_FIELDS.map(({ name, label }) =>
                  report[name] ? (
                    <div key={name}>
                      <dt className="text-xs text-muted-foreground">{label}</dt>
                      <dd className="text-sm text-foreground whitespace-pre-wrap">
                        {report[name] as string}
                      </dd>
                    </div>
                  ) : null
                )}
              </dl>

              {attachments.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-3 border-t pt-3 sm:grid-cols-3">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="flex flex-col gap-1.5">
                      {attachment.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={attachment.imageUrl}
                          alt=""
                          className="aspect-square w-full rounded-lg object-cover"
                        />
                      )}
                      {attachment.caption && (
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                          {attachment.caption}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 flex flex-col gap-3 border-t pt-3">
                {entries.map((entry) => (
                  <div key={entry.id}>
                    <p className="text-xs font-medium text-foreground">
                      Dia {formatDay(entry.entry_date)}
                    </p>
                    <dl className="mt-1 flex flex-col gap-1">
                      {FIELDS.map(({ name, label }) =>
                        entry[name] ? (
                          <div key={name}>
                            <dt className="text-xs text-muted-foreground">
                              {label}
                            </dt>
                            <dd className="text-sm text-foreground whitespace-pre-wrap">
                              {entry[name] as string}
                            </dd>
                          </div>
                        ) : null
                      )}
                    </dl>
                  </div>
                ))}
                {!entries.length && (
                  <p className="text-sm text-muted-foreground">
                    Nenhum dia preenchido neste mês.
                  </p>
                )}
              </div>
            </li>
          )
        })}
        {!readyReports.length && (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Nenhum relatório disponível ainda.
          </p>
        )}
      </ul>
    </div>
  )
}
