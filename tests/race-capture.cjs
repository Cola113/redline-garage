// Launch the race for real: staging -> launch button -> mid-race + result screenshots
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(`[pageerror] ${String(e).slice(0, 150)}`));

  await page.goto("http://localhost:3100/", { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(8000);

  // enter staging
  await page.getByText("点火上道", { exact: false }).first().click();
  await page.waitForTimeout(3000);

  // click launch
  const launch = page.getByText("点完圣诞树发车", { exact: false }).first();
  if (await launch.count()) { await launch.click(); console.log("launched"); }
  else { console.log("LAUNCH BTN NOT FOUND"); }

  // capture countdown/launch
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "C:/Users/lenovo/AppData/Local/Temp/r1-launch.png" });
  // mid-race
  await page.waitForTimeout(5000);
  await page.screenshot({ path: "C:/Users/lenovo/AppData/Local/Temp/r2-mid.png" });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: "C:/Users/lenovo/AppData/Local/Temp/r3-late.png" });
  // wait for result screen (回车库 button appears)
  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(2500);
    if (await page.getByText("回车库", { exact: false }).count() > 0) break;
  }
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "C:/Users/lenovo/AppData/Local/Temp/r4-result.png" });
  console.log("race screenshots done");
  const ls = await page.evaluate(() => (localStorage.getItem("redline_garage_leaderboard_v1") || "").slice(0, 400));
  console.log("leaderboard:", ls);
  console.log("errors:", errors.slice(0, 5).join(" | ") || "(none)");
  await browser.close();
})();