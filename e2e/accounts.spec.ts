import { expect, test } from "@playwright/test";
import { EMAILS, SIM_PASSWORD, loadScenario } from "./sim";

test.beforeEach(async ({ request }) => {
  await loadScenario(request, "booked-ads");
});

test("sign up creates an account and logs you in @desktop", async ({ page }) => {
  await page.goto("/signup");
  await page.getByLabel("Email").fill("new.person@sim.test");
  await page.getByPlaceholder("At least 8 characters").fill("longenough1");
  await page.getByLabel("Repeat password").fill("longenough1");
  await page.getByRole("button", { name: "SIGN UP" }).click();
  await expect(page.getByRole("heading", { name: "You're all set" })).toBeVisible();
  await expect(page.getByText("Your account has been created with new.person@sim.test and you are signed in.")).toBeVisible();
  await page.getByRole("link", { name: "Go to home" }).click();
  await page.goto("/account");
  await expect(page.getByRole("heading", { name: "new.person" })).toBeVisible();
  await expect(page.getByText("new.person@sim.test")).toBeVisible();
});

test("sign up explains what is wrong", async ({ page }) => {
  await page.goto("/signup");
  const email = page.getByLabel("Email");
  // The error message sits inside the field's label, so find the box by its placeholder.
  const password = page.getByPlaceholder("At least 8 characters");
  const repeat = page.getByLabel("Repeat password");
  const submit = page.getByRole("button", { name: "SIGN UP" });

  await email.fill("someone@sim.test");
  await password.fill("short");
  await repeat.fill("short");
  await submit.click();
  await expect(page.getByText("Password must be at least 8 characters")).toBeVisible();

  await password.fill("longenough1");
  await repeat.fill("different1");
  await submit.click();
  await expect(page.getByText("Passwords do not match")).toBeVisible();

  await email.fill(EMAILS.poster);
  await repeat.fill("longenough1");
  await submit.click();
  await expect(page.getByText("An account with this email already exists")).toBeVisible();
});

test("log in, a wrong password, and log out", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(EMAILS.buyer);
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "LOG IN" }).click();
  await expect(page.getByRole("alert").filter({ hasText: /./ })).toBeVisible();
  await expect(page).toHaveURL(/\/login/);

  await page.getByLabel("Password").fill(SIM_PASSWORD);
  await page.getByRole("button", { name: "LOG IN" }).click();
  await page.waitForURL("/");
  await page.goto("/account");
  await expect(page.getByRole("heading", { name: "Bea Buyer" })).toBeVisible();

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page.getByRole("heading", { name: "You're not logged in" })).toBeVisible();
});

test("picking up while logged out comes back to the same ad and time after logging in", async ({ page, request }) => {
  const { ads } = await loadScenario(request, "booked-ads");
  await page.goto(`/ads/${ads.open}`);
  await page.getByRole("radio", { name: "14:00–15:00" }).click();
  await page.getByRole("button", { name: "PICK UP" }).click();
  await expect(page.getByText("Log in or sign up to pick this up")).toBeVisible();

  await page.getByRole("link", { name: "Log in" }).click();
  await page.getByLabel("Email").fill(EMAILS.buyer);
  await page.getByLabel("Password").fill(SIM_PASSWORD);
  await page.getByRole("button", { name: "LOG IN" }).click();

  await page.waitForURL(new RegExp(`/ads/${ads.open}`));
  await expect(page.getByRole("radio", { name: "14:00–15:00" })).toHaveAttribute("aria-checked", "true");
  await page.getByRole("button", { name: "PICK UP" }).click();
  await expect(page.getByText("You have booked Today 14:00–15:00 to pick up this item.")).toBeVisible();
});

test("a login link can't send you to another website", async ({ page }) => {
  await page.goto("/login?next=//evil.example.com/steal");
  await page.getByLabel("Email").fill(EMAILS.buyer);
  await page.getByLabel("Password").fill(SIM_PASSWORD);
  await page.getByRole("button", { name: "LOG IN" }).click();
  await page.waitForURL("http://localhost:3000/");
  expect(new URL(page.url()).host).toBe("localhost:3000");
});

test("Google and Facebook sign-in say they aren't set up yet", async ({ page }) => {
  for (const provider of ["Google", "Facebook"]) {
    await page.goto("/login");
    await page.getByRole("link", { name: `Continue with ${provider}` }).click();
    await expect(page.getByText("That sign-in option isn't set up yet. Use your email and password for now.")).toBeVisible();
  }
});
