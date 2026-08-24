"use client"

import { useEffect, useRef, useState } from "react"
import { useActionState } from "react"

import {
  ArrowCounterClockwise,
  CalendarBlank,
  CheckCircle,
  FloppyDisk,
  ImageSquare,
  NotePencil,
  Plus,
  Trash,
} from "@phosphor-icons/react"

import {
  addMonthAttachment,
  deleteMonthAttachment,
  setMonthReportStatus,
  upsertMonthDetails,
  upsertPlannerEntry,
} from "@/lib/actions/planner"
import type { PlannerEntry, PlannerMonthAttachment, ReportStatus } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

const FIELDS: { name: keyof PlannerFields; label: string }[] = [
  { name: "atividades_manha", label: "Atividades realizadas pela manhã" },
  { name: "atividades_tarde", label: "Atividades realizadas à tarde" },
]

const MONTH_DETAIL_FIELDS: { name: keyof MonthDetailFields; label: string }[] = [
  { name: "planejamento", label: "Planejamento" },
  { name: "licoes_aprendidas", label: "Lições aprendidas" },
  { name: "proximos_passos", label: "Próximos passos" },
]

type PlannerFields = Pick<PlannerEntry, "atividades_manha" | "atividades_tarde">

type MonthDetailFields = {
  planejamento: string | null
  licoes_aprendidas: string | null
  proximos_passos: string | null
}

type MonthAttachmentWithUrl = PlannerMonthAttachment & { imageUrl: string | null }

function pad(n: number) {
  return String(n).padStart(2, "0")
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function PlannerCalendar({
  entriesByDate,
  monthStatus,
  monthDetails,
  attachments,
}: {
  entriesByDate: Record<string, PlannerEntry>
  monthStatus: ReportStatus
  monthDetails: MonthDetailFields
  attachments: MonthAttachmentWithUrl[]
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const isMonthReady = monthStatus === "ready"

  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const todayKey = toDateKey(today)

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstWeekday = new Date(year, month, 1).getDay()
  const monthLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(today)

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-1.5 text-sm font-medium text-foreground capitalize">
          <CalendarBlank className="size-4 text-primary" />
          {monthLabel}
        </h2>
        <MonthStatusControl monthStatus={monthStatus} />
      </div>
      {isMonthReady && (
        <p className="rounded-lg border border-dashed bg-accent/30 p-3 text-sm text-muted-foreground">
          O relatório deste mês foi marcado como pronto e já está disponível
          para os administradores. Os dias ficam bloqueados para edição —
          reabra o mês acima se precisar corrigir algo.
        </p>
      )}
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-muted-foreground">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>
      <div className="grid flex-1 grid-cols-7 gap-2">
        {cells.map((day, index) => {
          if (day === null) return <div key={`empty-${index}`} />

          const dateKey = toDateKey(new Date(year, month, day))
          const entry = entriesByDate[dateKey]
          const isToday = dateKey === todayKey

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => setSelectedDate(dateKey)}
              className={cn(
                "flex min-h-16 flex-col items-start gap-1 rounded-lg border bg-card p-2 text-left text-sm transition-colors hover:bg-accent/40",
                isToday && "border-primary"
              )}
            >
              <span
                className={cn(
                  "font-medium",
                  isToday && "text-primary"
                )}
              >
                {day}
              </span>
              {entry && <span className="size-1.5 rounded-full bg-primary" />}
            </button>
          )
        })}
      </div>

      <MonthDetailsForm monthDetails={monthDetails} locked={isMonthReady} />
      <MonthAttachments attachments={attachments} locked={isMonthReady} />

      <Dialog
        open={selectedDate !== null}
        onOpenChange={(open) => !open && setSelectedDate(null)}
      >
        <DialogContent className="sm:max-w-lg">
          {selectedDate && (
            <PlannerEntryForm
              key={selectedDate}
              dateKey={selectedDate}
              entry={entriesByDate[selectedDate]}
              locked={isMonthReady}
              onSuccess={() => setSelectedDate(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PlannerEntryForm({
  dateKey,
  entry,
  locked,
  onSuccess,
}: {
  dateKey: string
  entry?: PlannerEntry
  locked: boolean
  onSuccess: () => void
}) {
  const [state, formAction, pending] = useActionState(
    upsertPlannerEntry,
    undefined
  )
  const wasPending = useRef(false)

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      onSuccess()
    }
    wasPending.current = pending
  }, [pending, state, onSuccess])

  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dateKey}T00:00:00Z`))

  return (
    <>
      <DialogHeader>
        <DialogTitle className="capitalize">{formattedDate}</DialogTitle>
        <DialogDescription>
          {locked
            ? "O relatório do mês já foi enviado — reabra o mês para editar este dia."
            : "Registre o que aconteceu nesse dia."}
        </DialogDescription>
      </DialogHeader>
      <form action={formAction}>
        <input type="hidden" name="entry_date" value={dateKey} />
        <FieldGroup>
          {FIELDS.map(({ name, label }) => (
            <Field key={name}>
              <FieldLabel htmlFor={name}>{label}</FieldLabel>
              <Textarea
                id={name}
                name={name}
                defaultValue={entry?.[name] ?? ""}
                disabled={locked}
              />
            </Field>
          ))}
          {!locked && (
            <Field>
              <FieldError
                errors={state?.error ? [{ message: state.error }] : undefined}
              />
              <Button type="submit" disabled={pending}>
                <FloppyDisk data-icon="inline-start" />
                {pending ? "Salvando..." : "Salvar"}
              </Button>
            </Field>
          )}
        </FieldGroup>
      </form>
    </>
  )
}

function MonthStatusControl({ monthStatus }: { monthStatus: ReportStatus }) {
  const [, formAction, pending] = useActionState(
    setMonthReportStatus,
    undefined
  )
  const isReady = monthStatus === "ready"

  return (
    <form action={formAction}>
      <input type="hidden" name="status" value={isReady ? "draft" : "ready"} />
      <Button type="submit" variant={isReady ? "outline" : "default"} disabled={pending}>
        {isReady ? (
          <ArrowCounterClockwise data-icon="inline-start" />
        ) : (
          <CheckCircle data-icon="inline-start" />
        )}
        {pending
          ? "Salvando..."
          : isReady
            ? "Mês entregue — reabrir"
            : "Marcar mês como pronto"}
      </Button>
    </form>
  )
}

function MonthDetailsForm({
  monthDetails,
  locked,
}: {
  monthDetails: MonthDetailFields
  locked: boolean
}) {
  const [state, formAction, pending] = useActionState(
    upsertMonthDetails,
    undefined
  )

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <h3 className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        <NotePencil className="size-4 text-primary" />
        Resumo do mês
      </h3>
      <form action={formAction}>
        <FieldGroup>
          {MONTH_DETAIL_FIELDS.map(({ name, label }) => (
            <Field key={name}>
              <FieldLabel htmlFor={name}>{label}</FieldLabel>
              <Textarea
                id={name}
                name={name}
                defaultValue={monthDetails[name] ?? ""}
                disabled={locked}
              />
            </Field>
          ))}
          {!locked && (
            <Field>
              <FieldError
                errors={state?.error ? [{ message: state.error }] : undefined}
              />
              <Button type="submit" disabled={pending}>
                <FloppyDisk data-icon="inline-start" />
                {pending ? "Salvando..." : "Salvar"}
              </Button>
            </Field>
          )}
        </FieldGroup>
      </form>
    </div>
  )
}

function MonthAttachments({
  attachments,
  locked,
}: {
  attachments: MonthAttachmentWithUrl[]
  locked: boolean
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <h3 className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        <ImageSquare className="size-4 text-primary" />
        Imagens do mês
      </h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
            {!locked && (
              <DeleteAttachmentButton attachmentId={attachment.id} />
            )}
          </div>
        ))}
        {!attachments.length && (
          <p className="col-span-full text-sm text-muted-foreground">
            Nenhuma imagem anexada neste mês.
          </p>
        )}
      </div>
      {!locked && <AddAttachmentForm />}
    </div>
  )
}

function AddAttachmentForm() {
  const [state, formAction, pending] = useActionState(
    addMonthAttachment,
    undefined
  )
  const formRef = useRef<HTMLFormElement>(null)
  const wasPending = useRef(false)

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      formRef.current?.reset()
    }
    wasPending.current = pending
  }, [pending, state])

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-2 border-t pt-3"
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="image">Imagem</FieldLabel>
          <Input id="image" name="image" type="file" accept="image/*" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="caption">Legenda</FieldLabel>
          <Textarea id="caption" name="caption" />
        </Field>
        <Field>
          <FieldError
            errors={state?.error ? [{ message: state.error }] : undefined}
          />
          <Button type="submit" disabled={pending}>
            <Plus data-icon="inline-start" />
            {pending ? "Enviando..." : "Adicionar imagem"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}

function DeleteAttachmentButton({ attachmentId }: { attachmentId: string }) {
  const [, formAction, pending] = useActionState(
    deleteMonthAttachment,
    undefined
  )

  return (
    <form action={formAction}>
      <input type="hidden" name="attachment_id" value={attachmentId} />
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        <Trash data-icon="inline-start" />
        {pending ? "Removendo..." : "Remover"}
      </Button>
    </form>
  )
}
