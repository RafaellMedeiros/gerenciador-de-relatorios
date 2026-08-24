"use client"

import { useActionState } from "react"

import { UserPlus } from "@phosphor-icons/react"

import { createUser } from "@/lib/actions/users"
import type { UserRole } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const ROLE_LABELS: Record<UserRole, string> = {
  MASTER: "Master",
  ADM: "Administrador",
  COLABORADOR: "Colaborador",
}

export function CreateUserForm({
  assignableRoles,
}: {
  assignableRoles: UserRole[]
}) {
  const [state, formAction, pending] = useActionState(createUser, undefined)
  const fixedRole = assignableRoles.length === 1 ? assignableRoles[0] : null

  return (
    <form action={formAction} className="max-w-sm">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="full_name">Nome</FieldLabel>
          <Input id="full_name" name="full_name" type="text" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">E-mail</FieldLabel>
          <Input id="email" name="email" type="email" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Senha provisória</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            minLength={6}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="role">Papel</FieldLabel>
          {fixedRole ? (
            <>
              <Input value={ROLE_LABELS[fixedRole]} disabled />
              <input type="hidden" name="role" value={fixedRole} />
            </>
          ) : (
            <Select name="role" required>
              <SelectTrigger id="role" className="w-full">
                <SelectValue placeholder="Selecione o papel" />
              </SelectTrigger>
              <SelectContent>
                {assignableRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Field>
        <Field>
          <FieldError
            errors={state?.error ? [{ message: state.error }] : undefined}
          />
          <Button type="submit" disabled={pending}>
            <UserPlus data-icon="inline-start" />
            {pending ? "Criando..." : "Criar usuário"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
