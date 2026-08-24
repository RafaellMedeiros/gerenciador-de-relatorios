import { CircleUserRound, HeartPulse } from "lucide-react"

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
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <HeartPulse className="size-4.5" />
            </span>
            <span className="text-sm font-medium text-foreground">
              Gerenciador de Relatórios
            </span>
          </div>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <a href="/home" className="hover:text-foreground">
              Home
            </a>
            {canManageUsers && (
              <a href="/reports" className="hover:text-foreground">
                Relatórios
              </a>
            )}
            {role === "COLABORADOR" && (
              <a href="/planner" className="hover:text-foreground">
                Planner
              </a>
            )}
            {canManageUsers && (
              <a href="/usuarios" className="hover:text-foreground">
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
              <CircleUserRound className="size-4.5 text-primary" />
              {fullName}
            </a>
          )}
          <form action={logout}>
            <Button variant="outline" type="submit">
              Sair
            </Button>
          </form>
        </div>
      </div>
    </header>
  )
}
