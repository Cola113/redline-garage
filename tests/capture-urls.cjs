// List failing request URLs + screenshot
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on("response", (r) => {
    if (r.status() >= 400) console.log(`[${r.status()}] ${r.url().slice(0, 200)}`);
  });
  await page.goto("http://localhost:3100/", { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(12000);
  await page.screenshot({ path: "C:/Users/lenovo/AppData/Local/Temp/rg-check2.png" });
  console.log("done");
  await browser.close();
})();