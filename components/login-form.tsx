"use client"

import { useActionState, useState } from "react"

import { Eye, EyeSlash, Heartbeat, LockKey, SignIn } from "@phosphor-icons/react"

import { login } from "@/app/login/actions"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [state, formAction, pending] = useActionState(login, undefined)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-1.5 text-center">
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Heartbeat className="size-6" weight="fill" />
        </span>
        <span className="text-lg font-semibold text-foreground">SIGESS</span>
        <span className="text-sm text-muted-foreground">
          Sistema Integrado de Gestão em Saúde
        </span>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LockKey className="size-4.5 text-primary" />
            Acesse sua conta
          </CardTitle>
          <CardDescription>
            Informe seu e-mail e senha para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">E-mail</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  autoFocus
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Senha</FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    className="pr-8"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? (
                      <EyeSlash className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </Field>
              <Field>
                <FieldError
                  errors={state?.error ? [{ message: state.error }] : undefined}
                />
                <Button type="submit" disabled={pending}>
                  <SignIn data-icon="inline-start" />
                  {pending ? "Entrando..." : "Entrar"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
