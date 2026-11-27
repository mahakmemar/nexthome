// Simulate mode must refuse to start on the real database. Starts the simulate build on port
// 3000 pointed at a non-simulate database and expects it to stop with an error.
// Needs a simulate build (.next-sim) and port 3000 free.
import { spawn } from "node:child_process";

const busy = await fetch("http://localhost:3000/").then(() => true, () => false);
if (busy) {
  console.error("Port 3000 is in use. Stop the app running there first.");
  process.exit(1);
}
const env = { ...process.env, SIMULATE: "1", DATABASE_URL: "file:./dev.db", NEXT_DIST_DIR: ".next-sim" };
const child = spawn("npx", ["next", "start", "-p", "3000"], { env, stdio: ["ignore", "pipe", "pipe"] });
let output = "";
child.stdout.on("data", (d) => (output += d));
child.stderr.on("data", (d) => (output += d));
const timer = setTimeout(() => {
  child.kill("SIGTERM");
  console.error("FAIL: simulate mode kept running on the real database.\n" + output);
  process.exit(1);
}, 30_000);
child.on("exit", (code) => {
  clearTimeout(timer);
  if (code !== 0 && output.includes("SIMULATE=1 needs a separate database")) {
    console.log("PASS: simulate mode refused to start on the real database (exit code " + code + ").");
    process.exit(0);
  }
  console.error(`FAIL: expected the guard message and a non-zero exit, got exit ${code}.\n` + output);
  process.exit(1);
});
