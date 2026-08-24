// One-off bootstrap script: creates the single MASTER account for the system.
// Usage: npm run seed:master
//
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the
// environment (loaded from .env.local via `node --env-file`).

import { randomBytes } from "node:crypto"
import { createClient } from "@supabase/supabase-js"

const MASTER_EMAIL = "rafaelfufcg@gmail.com"
const MASTER_NAME = "Rafael Medeiros"

function generatePassword() {
  return randomBytes(18).toString("base64url")
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
    )
    process.exit(1)
  }

  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: existingMaster, error: existingMasterError } = await admin
    .from("profiles")
    .select("id, email")
    .eq("role", "MASTER")
    .maybeSingle()

  if (existingMasterError) {
    console.error("Failed to check for an existing MASTER:", existingMasterError.message)
    process.exit(1)
  }

  if (existingMaster) {
    console.error(
      `A MASTER account already exists (${existingMaster.email}). Aborting.`
    )
    process.exit(1)
  }

  const password = generatePassword()

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: MASTER_EMAIL,
    password,
    email_confirm: true,
    user_metadata: { full_name: MASTER_NAME },
  })

  if (createError) {
    console.error("Failed to create the auth user:", createError.message)
    process.exit(1)
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    full_name: MASTER_NAME,
    email: MASTER_EMAIL,
    role: "MASTER",
    must_change_password: true,
    created_by: null,
  })

  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id)
    console.error("Failed to create the profile:", profileError.message)
    process.exit(1)
  }

  console.log("MASTER account created.")
  console.log(`Email:    ${MASTER_EMAIL}`)
  console.log(`Password: ${password}`)
  console.log("This password must be changed on first login.")
}

main()
