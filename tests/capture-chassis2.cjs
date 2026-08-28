// Click 2nd chassis "装载" then screenshot (tests chassis switching + variant bodies)
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto("http://localhost:3100/", { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(9000);
  // find all 装载 buttons, click the first one (switches to 2nd chassis)
  const btns = page.getByText("装载", { exact: true });
  const n = await btns.count();
  console.log("装载 buttons:", n);
  if (n > 0) {
    await btns.first().click();
    await page.waitForTimeout(2500);
    await page.screenshot({ path: "C:/Users/lenovo/AppData/Local/Temp/rg-chassis2.png" });
    console.log("chassis2 captured");
  }
  await browser.close();
})();