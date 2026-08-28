// Capture console + page errors + screenshot after full load
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning")
      errors.push(`[${m.type()}] ${m.text().slice(0, 300)}`);
  });
  page.on("pageerror", (e) => errors.push(`[pageerror] ${String(e).slice(0, 400)}`));
  await page.goto("http://localhost:3100/", { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(12000);
  await page.screenshot({ path: process.env.OUT || "C:/Users/lenovo/AppData/Local/Temp/rg-check.png" });
  console.log("=== ERRORS ===");
  console.log(errors.slice(0, 15).join("\n") || "(none)");
  await browser.close();
})();