import {
  CalendarBlank,
  FileText,
  Heartbeat,
  SignOut,
  UserCircle,
  Users,
} from "@phosphor-icons/react/ssr"

import { logout } from "@/lib/actions/auth"
import type { UserRole } from "@/lib/types"
import { Button } from "@/components/ui/button"

export function SiteHeader({
  role,
  fullName,
}: {
  role?: UserRole
  fullName?: string
}) {
  const canManageUsers = role === "MASTER" || role === "ADM"

  return (
    <header className="border-b bg-card px-6 py-3.5">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <div className="flex items-center gap-6">
          <a
            href="/home"
            className="flex items-center gap-2.5"
            title="Sistema Integrado de Gestão em Saúde"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Heartbeat className="size-4.5" weight="fill" />
            </span>
            <span className="text-sm font-medium text-foreground">
              SIGESS
            </span>
          </a>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            {canManageUsers && (
              <a href="/reports" className="flex items-center gap-1.5 hover:text-foreground">
                <FileText className="size-4" />
                Relatórios
              </a>
            )}
            {role === "COLABORADOR" && (
              <a href="/planner" className="flex items-center gap-1.5 hover:text-foreground">
                <CalendarBlank className="size-4" />
                Planner
              </a>
            )}
            {canManageUsers && (
              <a href="/usuarios" className="flex items-center gap-1.5 hover:text-foreground">
                <Users className="size-4" />
                Usuários
              </a>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {fullName && (
            <a
              href="/perfil"
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/40"
            >
              <UserCircle className="size-4.5 text-primary" />
              {fullName}
            </a>
          )}
          <form action={logout}>
            <Button variant="outline" type="submit">
              <SignOut data-icon="inline-start" />
              Sair
            </Button>
          </form>
        </div>
      </div>
    </header>
  )
}
