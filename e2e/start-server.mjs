// Started by Playwright when no simulate-mode app answers on port 3000.
// Port 3000 is only ever used by one app at a time. If something else is already on it (usually
// the normal app), say so plainly instead of building and then failing with "address in use".
import { spawn } from "node:child_process";

const busy = await fetch("http://localhost:3000/").then(() => true, () => false);
if (busy) {
  console.error(
    "\nPort 3000 is already in use by an app that is not in simulate mode (usually the normal app).\n" +
      "Stop it first, then run the tests again. Playwright will build and start simulate mode on 3000.\n",
  );
  process.exit(1);
}
const child = spawn("npm run build:simulate && npm run start:simulate", { shell: true, stdio: "inherit" });
child.on("exit", (code) => process.exit(code ?? 1));
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => child.kill(sig));
