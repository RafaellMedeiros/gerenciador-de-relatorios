import { ChangePasswordForm } from "@/components/change-password-form"

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-[radial-gradient(circle_at_top,var(--accent)_0%,var(--background)_60%)] p-6 md:p-10">
      <div className="w-full max-w-sm">
        <ChangePasswordForm />
      </div>
    </div>
  )
}
