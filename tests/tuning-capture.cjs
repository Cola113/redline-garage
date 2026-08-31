// Capture the new tuning panel
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto("http://localhost:3100/", { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(9000);
  await page.getByText("调参", { exact: false }).first().click();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "C:/Users/lenovo/AppData/Local/Temp/t7-tuning.png" });
  console.log("tuning captured");
  await browser.close();
})();