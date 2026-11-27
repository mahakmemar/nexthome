// Runs once when the server starts. The work is Node.js-only (simulate mode), so it is loaded
// only in the Node.js runtime, as the Next.js docs recommend.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation-node");
  }
}
