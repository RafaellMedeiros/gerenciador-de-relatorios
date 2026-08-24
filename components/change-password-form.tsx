"use client"

import { useActionState } from "react"

import { FloppyDisk, LockKeyOpen } from "@phosphor-icons/react"

import { changePassword } from "@/lib/actions/auth"
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

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, undefined)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LockKeyOpen className="size-4.5 text-primary" />
          Defina sua nova senha
        </CardTitle>
        <CardDescription>
          Esta é sua senha provisória. Defina uma nova senha para continuar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="password">Nova senha</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={6}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm_password">
                Confirme a nova senha
              </FieldLabel>
              <Input
                id="confirm_password"
                name="confirm_password"
                type="password"
                minLength={6}
                required
              />
            </Field>
            <Field>
              <FieldError
                errors={state?.error ? [{ message: state.error }] : undefined}
              />
              <Button type="submit" disabled={pending}>
                <FloppyDisk data-icon="inline-start" />
                {pending ? "Salvando..." : "Salvar senha"}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
