// Started by Playwright for the normal-mode checks: a production build in normal mode on port
// 3000, with its own empty database. Same one-app-on-3000 rule as the simulate tests.
import { spawn } from "node:child_process";

const busy = await fetch("http://localhost:3000/").then(() => true, () => false);
if (busy) {
  console.error("\nPort 3000 is already in use. Stop the app running there, then run the normal-mode tests again.\n");
  process.exit(1);
}
const env = {
  ...process.env,
  DATABASE_URL: "file:./e2e-normal.db",
  CRON_SECRET: "e2e-cron-secret",
  SIMULATE: "",
  NEXT_DIST_DIR: ".next-e2e-normal",
};
const child = spawn("npx prisma db push && npx next build && npx next start -p 3000", { shell: true, stdio: "inherit", env });
child.on("exit", (code) => process.exit(code ?? 1));
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => child.kill(sig));
