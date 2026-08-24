"use client"

import { useActionState } from "react"

import { updateProfile } from "@/lib/actions/profile"
import type { Profile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function EditProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction, pending] = useActionState(
    updateProfile,
    undefined
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados pessoais</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="full_name">Nome Completo</FieldLabel>
              <Input
                id="full_name"
                name="full_name"
                type="text"
                defaultValue={profile.full_name}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="regional_health_department">
                Gerência Regional de Saúde
              </FieldLabel>
              <Input
                id="regional_health_department"
                name="regional_health_department"
                type="text"
                defaultValue={profile.regional_health_department ?? ""}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">E-mail</FieldLabel>
              <Input id="email" type="email" value={profile.email} disabled />
              <FieldDescription>
                Seu e-mail de login. Para alterá-lo, contate um administrador.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="phone">Celular (Whatsapp)</FieldLabel>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={profile.phone ?? ""}
              />
            </Field>
            <Field>
              <FieldError
                errors={state?.error ? [{ message: state.error }] : undefined}
              />
              {state?.success && (
                <p className="text-sm font-normal text-primary">
                  Perfil atualizado com sucesso.
                </p>
              )}
              <Button type="submit" disabled={pending}>
                {pending ? "Salvando..." : "Salvar alterações"}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
