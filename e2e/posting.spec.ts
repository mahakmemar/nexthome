import { expect, test, type Page } from "@playwright/test";
import { BASE_URL, loadScenario, pageAs, setClock } from "./sim";
import { jpegWithGps, pngOver5MB, pngPhoto } from "./images";
import sharp from "sharp";

const cont = (page: Page) => page.getByRole("button", { name: "CONTINUE" }).click();

/** Walks the 10-step wizard. Stops before publishing. */
async function fillWizard(page: Page, title: string) {
  await page.goto("/post");
  await page.getByRole("button", { name: "Give away" }).click();
  await page.getByRole("button", { name: "Furniture" }).click();

  await page.getByRole("button", { name: "14:00–15:00" }).click();
  await page.getByRole("button", { name: "16:00–17:00" }).click();
  await expect(page.getByText("Your times")).toBeVisible();
  await cont(page);

  await page.getByRole("combobox").fill("800 Robson");
  await page.getByRole("option", { name: /800 Robson Street/ }).click();
  await cont(page);

  await page.getByRole("button", { name: "Outside" }).click();
  await cont(page);

  await page.getByPlaceholder(/E\.g\. cardboards/).fill(title);
  await page.getByPlaceholder(/Add important information/).fill("Two drawers, about 20 kg.");
  await page.getByRole("button", { name: "M", exact: true }).click();
  await cont(page);

  await page.locator('input[type="file"]').setInputFiles({ name: "dresser.png", mimeType: "image/png", buffer: await pngPhoto() });
  await expect(page.getByRole("img", { name: "Photo 1" })).toBeVisible();
  await cont(page);

  await page.getByRole("button", { name: "OK, I UNDERSTAND" }).click();
  await page.getByLabel(/Your price/).fill("40");
  await cont(page);
}

test("posting an ad through all 10 steps puts it on Home and in My ads @desktop", async ({ browser, request }, testInfo) => {
  await loadScenario(request, "empty");
  const viewport = testInfo.project.use.viewport ?? null;
  const poster = await pageAs(browser, "poster", viewport);

  await fillWizard(poster, "Oak dresser");
  await expect(poster.getByText("800 Robson Street").first()).toBeVisible();
  // Publishing needs the poster to confirm what is being picked up.
  const publish = poster.getByRole("button", { name: "PUBLISH AD" });
  await expect(publish).toBeDisabled();
  await poster.getByRole("checkbox", { name: /I confirm that what is being picked up/ }).check();
  await publish.click();

  await poster.waitForURL(/\/ads\//);
  await expect(poster.getByRole("heading", { name: "Oak dresser" })).toBeVisible();
  await expect(poster.getByText("CAD 40")).toBeVisible();

  await poster.goto("/");
  await expect(poster.getByText("Oak dresser")).toBeVisible();
  await poster.goto("/my-ads");
  await expect(poster.getByRole("region", { name: /Posted by you/ }).or(poster.locator("section").first())).toContainText("Oak dresser");

  // It belongs to the logged-in poster, not to another account.
  const buyer = await pageAs(browser, "buyer", viewport);
  await buyer.goto("/my-ads");
  await expect(buyer.getByText("You haven't posted any ads yet.")).toBeVisible();
});

test("time slot rules: past hours, 'as soon as possible', the 5-slot limit and the 14-day window", async ({ browser, request }) => {
  await loadScenario(request, "empty");
  await setClock(request, "2026-12-05T20:30");
  const poster = await pageAs(browser, "poster");
  await poster.goto("/post");
  await poster.getByRole("button", { name: "Give away" }).click();
  await poster.getByRole("button", { name: "Furniture" }).click();

  // 20:30: earlier hours today are over, 21:00 is still open.
  await expect(poster.getByRole("button", { name: "19:00–20:00" })).toBeDisabled();
  await expect(poster.getByRole("button", { name: "21:00–22:00" })).toBeEnabled();

  // 14 days to choose from, today included.
  await expect(poster.getByRole("group", { name: "Pick a date" }).getByRole("button")).toHaveCount(14);

  // "As soon as possible" replaces dated slots, and picking a time replaces it again.
  await poster.getByRole("button", { name: "21:00–22:00" }).click();
  await poster.getByRole("button", { name: "As soon as possible" }).click();
  await expect(poster.getByRole("button", { name: "As soon as possible" })).toHaveAttribute("aria-pressed", "true");
  await expect(poster.getByRole("button", { name: "21:00–22:00" })).toHaveAttribute("aria-pressed", "false");

  // At most 5 dated slots.
  const dates = poster.getByRole("group", { name: "Pick a date" }).getByRole("button");
  await dates.nth(1).click();
  for (const hour of ["07", "08", "09", "10", "11"]) {
    await poster.getByRole("button", { name: `${hour}:00–${String(Number(hour) + 1).padStart(2, "0")}:00` }).click();
  }
  await expect(poster.getByText("You've reached the limit. Remove a time to pick a different one.")).toBeVisible();
  await expect(poster.getByRole("button", { name: "12:00–13:00" })).toBeDisabled();
  await expect(poster.getByRole("button", { name: "As soon as possible" })).toHaveAttribute("aria-pressed", "false");
});

test("photos: wrong type, too big and more than 5 are refused", async ({ browser, request }) => {
  await loadScenario(request, "empty");
  const poster = await pageAs(browser, "poster");
  await poster.goto("/post");
  await poster.getByRole("button", { name: "Give away" }).click();
  await poster.getByRole("button", { name: "Furniture" }).click();
  await poster.getByRole("button", { name: "As soon as possible" }).click();
  await cont(poster);
  await poster.getByRole("combobox").fill("800 Robson");
  await poster.getByRole("option", { name: /800 Robson Street/ }).click();
  await cont(poster);
  await cont(poster);
  await poster.getByPlaceholder(/E\.g\. cardboards/).fill("Chair");
  await cont(poster);

  const input = poster.locator('input[type="file"]');
  await expect(poster.getByText("Add at least one photo to continue.")).toBeVisible();
  await expect(poster.getByRole("button", { name: "CONTINUE" })).toBeDisabled();

  await input.setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("not a photo") });
  await expect(poster.getByText("notes.txt: use a JPEG, PNG or WebP photo.")).toBeVisible();

  await input.setInputFiles({ name: "huge.png", mimeType: "image/png", buffer: await pngOver5MB() });
  await expect(poster.getByText("huge.png: too big. Use a photo under 5 MB.")).toBeVisible();

  const six = await Promise.all([1, 2, 3, 4, 5, 6].map(async (n) => ({ name: `p${n}.png`, mimeType: "image/png", buffer: await pngPhoto(`#${n}0${n}0${n}0`) })));
  await input.setInputFiles(six);
  await expect(poster.getByText("You can add up to 5 photos. Some were skipped.")).toBeVisible();
  await expect(poster.getByRole("img", { name: /^Photo \d$/ })).toHaveCount(5);
});

test("an uploaded photo has its GPS location removed", async ({ browser, request }) => {
  await loadScenario(request, "empty");
  const poster = await pageAs(browser, "poster");
  const original = await jpegWithGps();
  expect((await sharp(original).metadata()).exif, "the test photo should start with GPS data").toBeTruthy();

  const res = await poster.request.post("/api/uploads", {
    multipart: { file: { name: "phone.jpg", mimeType: "image/jpeg", buffer: original } },
  });
  expect(res.ok()).toBeTruthy();
  const { url } = await res.json();
  const stored = await (await poster.request.get(`${BASE_URL}${url}`)).body();
  const meta = await sharp(stored).metadata();
  expect(meta.exif).toBeUndefined();
  expect(meta.format).toBe("webp");
});

test("required details block CONTINUE until they are filled in", async ({ browser, request }) => {
  await loadScenario(request, "empty");
  const poster = await pageAs(browser, "poster");
  await poster.goto("/post");
  await poster.getByRole("button", { name: "Give away" }).click();
  await poster.getByRole("button", { name: "Furniture" }).click();
  await expect(poster.getByRole("button", { name: "CONTINUE" })).toBeDisabled();
  await poster.getByRole("button", { name: "Anytime" }).click();
  await cont(poster);

  await expect(poster.getByRole("button", { name: "CONTINUE" })).toBeDisabled();
  await poster.getByRole("combobox").fill("800 Robson");
  await poster.getByRole("option", { name: /800 Robson Street/ }).click();
  await cont(poster);
  await cont(poster);

  await expect(poster.getByRole("button", { name: "CONTINUE" })).toBeDisabled();
  await poster.getByPlaceholder(/E\.g\. cardboards/).fill("Lamp");
  await expect(poster.getByRole("button", { name: "CONTINUE" })).toBeEnabled();
});
