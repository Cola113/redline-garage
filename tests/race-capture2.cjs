// Launch the race for real v2: longer waits + button discovery
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto("http://localhost:3100/", { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(9000);

  await page.getByText("点火上道", { exact: false }).first().click();
  await page.waitForTimeout(6000);
  await page.screenshot({ path: "C:/Users/lenovo/AppData/Local/Temp/r0-staging.png" });

  // dump candidate buttons
  const texts = await page.evaluate(() =>
    Array.from(document.querySelectorAll("button"))
      .map((b) => (b.textContent || "").trim().slice(0, 24))
      .filter((t) => t.length > 0)
  );
  console.log("buttons:", JSON.stringify(texts));

  const launch = page.locator("button", { hasText: "发车" }).first();
  if (await launch.count()) {
    await launch.click();
    console.log("launched");
    await page.waitForTimeout(3500);
    await page.screenshot({ path: "C:/Users/lenovo/AppData/Local/Temp/r1-launch.png" });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: "C:/Users/lenovo/AppData/Local/Temp/r2-mid.png" });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: "C:/Users/lenovo/AppData/Local/Temp/r3-late.png" });
    for (let i = 0; i < 14; i++) {
      await page.waitForTimeout(2500);
      if (await page.getByText("回车库", { exact: false }).count() > 0) break;
    }
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "C:/Users/lenovo/AppData/Local/Temp/r4-result.png" });
    console.log("done");
  } else {
    console.log(" STILL NO LAUNCH BTN");
  }
  await browser.close();
})();