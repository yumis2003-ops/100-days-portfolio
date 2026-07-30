#!/usr/bin/env node
/**
 * data/apps.json のURLを順に開いて public/shots/<slug>.webp に保存する。
 *
 *   npm run shots                 # 全件撮り直す
 *   npm run shots:missing         # まだ無いものだけ撮る（普段はこっち）
 *   node scripts/shots.mjs --only slug-a,slug-b
 */
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "shots");

const VIEWPORT = { width: 1280, height: 800 };
const CONCURRENCY = 4;
/** アニメーションやフォント読み込みが落ち着くまでの待ち時間(ms) */
const SETTLE_MS = 2500;
/** カードに載せる幅。元の1280pxのままだと合計が重すぎる。 */
const OUTPUT_WIDTH = 900;
const WEBP_QUALITY = 78;

const args = process.argv.slice(2);
const missingOnly = args.includes("--missing-only");
const onlyArg = args.find((a) => a.startsWith("--only"));
const only = onlyArg
  ? new Set(
      (onlyArg.includes("=")
        ? onlyArg.split("=")[1]
        : args[args.indexOf(onlyArg) + 1] ?? ""
      )
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    )
  : null;

const apps = JSON.parse(
  await fs.readFile(path.join(ROOT, "data", "apps.json"), "utf8")
);

await fs.mkdir(OUT_DIR, { recursive: true });
const existing = new Set(await fs.readdir(OUT_DIR));

let targets = apps.filter((a) => a.url);
if (only) targets = targets.filter((a) => only.has(a.slug));
if (missingOnly) targets = targets.filter((a) => !existing.has(`${a.slug}.webp`));

if (targets.length === 0) {
  console.log("撮る対象がありません。");
  process.exit(0);
}

console.log(`${targets.length}件のスクリーンショットを取得します...\n`);

const browser = await chromium.launch();
const failures = [];
let done = 0;

async function capture(app) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
    colorScheme: "dark",
    // 動きの激しいアプリでも同じ絵が撮れるようにアニメーションを止める
    reducedMotion: "reduce",
  });
  const page = await context.newPage();

  try {
    await page.goto(app.url, { waitUntil: "networkidle", timeout: 45_000 });
  } catch {
    // networkidle まで行かないアプリ（常時通信・requestAnimationFrame等）は
    // DOM が出ていれば撮ってしまう
    try {
      await page.waitForLoadState("domcontentloaded", { timeout: 15_000 });
    } catch {
      /* それでもダメなら下の screenshot が投げる */
    }
  }

  try {
    await page.waitForTimeout(SETTLE_MS);
    const png = await page.screenshot({ animations: "disabled" });
    await sharp(png)
      .resize({ width: OUTPUT_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toFile(path.join(OUT_DIR, `${app.slug}.webp`));
    done += 1;
    console.log(`  ✓ [${done}/${targets.length}] Day ${app.day} ${app.slug}`);
  } catch (err) {
    failures.push({ slug: app.slug, url: app.url, error: String(err).split("\n")[0] });
    console.log(`  ✗ Day ${app.day} ${app.slug} — ${String(err).split("\n")[0]}`);
  } finally {
    await context.close();
  }
}

// 同時実行数を CONCURRENCY で抑えつつ全件流す
const queue = [...targets];
await Promise.all(
  Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    while (queue.length) {
      const app = queue.shift();
      if (app) await capture(app);
    }
  })
);

await browser.close();

console.log(`\n完了: ${done}件成功 / ${failures.length}件失敗`);
if (failures.length) {
  console.log("\n失敗した分:");
  for (const f of failures) console.log(`  ${f.slug}  ${f.url}\n    ${f.error}`);
  process.exitCode = 1;
}
