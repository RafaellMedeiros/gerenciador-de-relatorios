"use client"

import { useState } from "react"

import { CheckCircle, Circle, Clock } from "@phosphor-icons/react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { ColaboradorReportStatus, ColaboradorReportSummary } from "@/lib/types"
import { cn } from "@/lib/utils"

const FIELDS = [
  { name: "atividades_manha", label: "Atividades realizadas pela manhã" },
  { name: "atividades_tarde", label: "Atividades realizadas à tarde" },
] as const

const MONTH_DETAIL_FIELDS = [
  { name: "planejamento", label: "Planejamento" },
  { name: "licoes_aprendidas", label: "Lições aprendidas" },
  { name: "proximos_passos", label: "Próximos passos" },
] as const

const STATUS_CONFIG: Record<
  ColaboradorReportStatus,
  { label: string; className: string; icon: typeof CheckCircle }
> = {
  ready: { label: "Pronto", className: "text-green-600", icon: CheckCircle },
  started: { label: "Em andamento", className: "text-amber-600", icon: Clock },
  not_started: {
    label: "Não iniciado",
    className: "text-muted-foreground",
    icon: Circle,
  },
}

const GROUPS: { status: ColaboradorReportStatus; title: string }[] = [
  { status: "ready", title: "Prontos" },
  { status: "started", title: "Em andamento" },
  { status: "not_started", title: "Não iniciados" },
]

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso))
}

function formatDay(dateKey: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${dateKey}T00:00:00Z`))
}

export function ReportsList({
  summaries,
}: {
  summaries: ColaboradorReportSummary[]
}) {
  const [selected, setSelected] = useState<ColaboradorReportSummary | null>(null)

  return (
    <>
      <div className="flex flex-col gap-6">
        {GROUPS.map((group) => {
          const items = summaries.filter((s) => s.status === group.status)
          if (!items.length) return null

          return (
            <section key={group.status}>
              <h2 className="mb-2 text-sm font-medium text-muted-foreground">
                {group.title} ({items.length})
              </h2>
              <ul className="flex flex-col gap-2">
                {items.map((item) => {
                  const config = STATUS_CONFIG[item.status]
                  const Icon = config.icon
                  return (
                    <li key={item.userId}>
                      <button
                        type="button"
                        onClick={() => setSelected(item)}
                        className="flex w-full items-center justify-between gap-3 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-accent/40"
                      >
                        <div>
                          <p className="font-medium text-foreground">
                            {item.fullName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.statusDate
                              ? formatDateTime(item.statusDate)
                              : "Sem atividade registrada"}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "flex shrink-0 items-center gap-1 text-xs font-medium",
                            config.className
                          )}
                        >
                          <Icon className="size-3.5" weight="fill" />
                          {config.label}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
        {!summaries.length && (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Nenhum colaborador cadastrado ainda.
          </p>
        )}
      </div>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.fullName}</DialogTitle>
                <DialogDescription>
                  {STATUS_CONFIG[selected.status].label}
                  {selected.statusDate
                    ? ` · ${formatDateTime(selected.statusDate)}`
                    : ""}
                </DialogDescription>
              </DialogHeader>

              {selected.status !== "ready" ? (
                <p className="text-sm text-muted-foreground">
                  {selected.status === "started"
                    ? "O colaborador ainda não marcou o relatório deste mês como pronto."
                    : "Nenhuma atividade registrada neste mês ainda."}
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {MONTH_DETAIL_FIELDS.map(({ name, label }) =>
                    selected.report?.[name] ? (
                      <div key={name}>
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-sm whitespace-pre-wrap text-foreground">
                          {selected.report[name]}
                        </p>
                      </div>
                    ) : null
                  )}

                  {selected.attachments.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 border-t pt-3 sm:grid-cols-3">
                      {selected.attachments.map((attachment) => (
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

                  <div className="flex flex-col gap-3 border-t pt-3">
                    {selected.entries.map((entry) => (
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
                                <dd className="text-sm whitespace-pre-wrap text-foreground">
                                  {entry[name]}
                                </dd>
                              </div>
                            ) : null
                          )}
                        </dl>
                      </div>
                    ))}
                    {!selected.entries.length && (
                      <p className="text-sm text-muted-foreground">
                        Nenhum dia preenchido neste mês.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
