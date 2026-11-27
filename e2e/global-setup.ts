// Runs once before the tests. The tests need the app in simulate mode on port 3000. If the
// normal app is running there instead, stop with a clear message rather than fail every test.
export default async function globalSetup() {
  const res = await fetch("http://localhost:3000/api/sim/state").catch(() => null);
  if (!res || res.status !== 200) {
    throw new Error(
      "The app on port 3000 is not in simulate mode. Stop the normal app and run `npm run dev:simulate` " +
        "(or let Playwright start it by leaving port 3000 free).",
    );
  }
}
