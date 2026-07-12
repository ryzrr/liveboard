import puppeteer from "puppeteer-core";
import { existsSync } from "node:fs";

// Resolve a Chrome/Edge binary: CHROME_PATH env wins, else probe common locations.
const CANDIDATES = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);
const CHROME = CANDIDATES.find((p) => existsSync(p));
if (!CHROME) {
  console.error("No Chrome/Edge binary found. Set CHROME_PATH to your browser executable.");
  process.exit(1);
}

const BASE = process.env.BASE || "http://localhost:3000";
const OUT = process.env.OUT || "scripts/.landing.png";
const W = Number(process.env.W || 1512);
const H = Number(process.env.H || 982);
const FULL = process.env.FULL === "1";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  defaultViewport: { width: W, height: H, deviceScaleFactor: 2 },
  args: ["--hide-scrollbars", "--force-color-profile=srgb"],
});
const page = await browser.newPage();
await page.goto(BASE, { waitUntil: "networkidle2" });
await sleep(2500); // let entrance animations settle
if (FULL) {
  // scroll through to trigger in-view animations, then back to top
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 350));
    }
    window.scrollTo(0, 0);
  });
  await sleep(800);
}
await page.screenshot({ path: OUT, fullPage: FULL });
await browser.close();
console.log("saved", OUT);
