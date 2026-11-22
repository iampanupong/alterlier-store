// Grants the admin role: `pnpm auth:make-admin <email>`. Idempotent.
// Pass `--revoke` to demote back to customer. Takes effect on the next request,
// because requireAdmin() reads the role from the database.

import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { user } from "./auth-schema";

async function main() {
  const args = process.argv.slice(2);
  const revoke = args.includes("--revoke");
  const email = args.find((a) => !a.startsWith("--"))?.trim().toLowerCase();
  if (!email) {
    console.error("Usage: pnpm auth:make-admin <email> [--revoke]");
    process.exit(1);
  }

  const role = revoke ? "customer" : "admin";
  const rows = await db
    .update(user)
    .set({ role })
    .where(eq(user.email, email))
    .returning({ email: user.email });

  if (rows.length === 0) {
    console.error(`No user with email ${email}. Sign up first.`);
    process.exit(1);
  }
  console.log(`${email} is now ${role}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
