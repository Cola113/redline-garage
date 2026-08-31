// Full gameplay walkthrough: garage -> tuning -> staging -> drag -> result, screenshots each stage
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(`[pageerror] ${String(e).slice(0, 200)}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`[console.error] ${m.text().slice(0, 150)}`);
  });

  await page.goto("http://localhost:3100/", { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(8000);
  await page.screenshot({ path: "C:/Users/lenovo/AppData/Local/Temp/w1-garage.png" });
  console.log("1/5 garage captured");

  // tuning view
  const tuneBtn = page.getByText("调参", { exact: false }).first();
  if (await tuneBtn.count()) {
    await tuneBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "C:/Users/lenovo/AppData/Local/Temp/w2-tuning.png" });
    console.log("2/5 tuning captured");
  } else console.log("2/5 调参 button NOT FOUND");

  // back to garage then staging (点火上道)
  const backBtn = page.getByText("进站改装", { exact: false }).first();
  if (await backBtn.count()) { await backBtn.click(); await page.waitForTimeout(1500); }
  const ignite = page.getByText("点火上道", { exact: false }).first();
  if (await ignite.count()) {
    await ignite.click();
    await page.waitForTimeout(4000);
    await page.screenshot({ path: "C:/Users/lenovo/AppData/Local/Temp/w3-staging.png" });
    console.log("3/5 staging captured");
    // wait through countdown + launch; capture mid-race at ~8s and ~14s
    await page.waitForTimeout(9000);
    await page.screenshot({ path: "C:/Users/lenovo/AppData/Local/Temp/w4-drag-mid.png" });
    await page.waitForTimeout(6000);
    await page.screenshot({ path: "C:/Users/lenovo/AppData/Local/Temp/w5-drag-late.png" });
    // result screen appears ~1.2s after 402m crossing (auto race); wait up to 25s more
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(2500);
      const res = await page.getByText("回车库", { exact: false }).count();
      if (res > 0) break;
    }
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "C:/Users/lenovo/AppData/Local/Temp/w6-result.png" });
    console.log("4+5/5 drag + result captured");
  } else console.log("3/5 点火上道 NOT FOUND");

  // localStorage records
  const ls = await page.evaluate(() => {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      out[k] = (localStorage.getItem(k) || "").slice(0, 220);
    }
    return out;
  });
  console.log("=== localStorage keys ===");
  for (const [k, v] of Object.entries(ls)) console.log(k, "=>", v.slice(0, 200));

  console.log("=== page errors ===");
  console.log(errors.slice(0, 8).join("\n") || "(none)");
  await browser.close();
})();