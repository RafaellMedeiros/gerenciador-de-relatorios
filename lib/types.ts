export type UserRole = "MASTER" | "ADM" | "COLABORADOR"

export interface Profile {
  id: string
  full_name: string
  email: string
  regional_health_department: string | null
  phone: string | null
  role: UserRole
  must_change_password: boolean
  created_by: string | null
  created_at: string
}

export interface BoardComment {
  id: string
  post_id: string
  author_id: string
  author_name: string
  body: string
  created_at: string
}

export interface BoardPost {
  id: string
  author_id: string
  author_name: string
  caption: string | null
  image_path: string | null
  created_at: string
  updated_at: string
}

export interface PlannerEntry {
  id: string
  user_id: string
  entry_date: string
  atividades_manha: string | null
  atividades_tarde: string | null
  created_at: string
  updated_at: string
}

export type ReportStatus = "draft" | "ready"

// The report unit is the whole month, not a single day: a COLABORADOR
// flips this to "ready" once for the current month, which is what makes
// that month's planner entries visible to ADM/MASTER on /reports.
export interface PlannerMonthReport {
  id: string
  user_id: string
  period: string // first day of the month, e.g. "2026-08-01"
  status: ReportStatus
  marked_ready_at: string | null
  planejamento: string | null
  licoes_aprendidas: string | null
  proximos_passos: string | null
  created_at: string
  updated_at: string
}

// Images attached to the month as a whole (not tied to a single day), each
// with an optional caption.
export interface PlannerMonthAttachment {
  id: string
  user_id: string
  period: string // first day of the month, e.g. "2026-08-01"
  image_path: string
  caption: string | null
  created_at: string
}

// Per-colaborador status for the current month, as returned by the
// month_report_progress() database function — see supabase/schema.sql.
export type ColaboradorReportStatus = "not_started" | "started" | "ready"

export interface MonthReportProgressRow {
  user_id: string
  full_name: string
  status: ColaboradorReportStatus
  marked_ready_at: string | null
  last_activity_at: string | null
}

// Everything the Relatórios screen needs for one colaborador's row + modal.
// entries/attachments/report stay empty unless status is "ready" — RLS only
// exposes that content once the month report is marked ready.
export interface ColaboradorReportSummary {
  userId: string
  fullName: string
  status: ColaboradorReportStatus
  statusDate: string | null
  report: PlannerMonthReport | null
  entries: PlannerEntry[]
  attachments: (PlannerMonthAttachment & { imageUrl: string | null })[]
}
