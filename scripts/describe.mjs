#!/usr/bin/env node
/**
 * description が空のアプリについて、本番ページのキャッチコピーを拾って埋める。
 *
 *   node scripts/describe.mjs           # 空のものだけ埋める
 *   node scripts/describe.mjs --force   # 全件を拾い直す（手で書いた文も上書きするので注意）
 *
 * 拾った文が気に入らなければ data/apps.json を直接書き換えてよい。
 * このスクリプトは既に文が入っているものには触らない。
 */
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = path.resolve(import.meta.dirname, "..");
const APPS_PATH = path.join(ROOT, "data", "apps.json");
const force = process.argv.includes("--force");
const CONCURRENCY = 4;

const apps = JSON.parse(await fs.readFile(APPS_PATH, "utf8"));
const targets = apps.filter((a) => a.url && (force || !a.description));

if (targets.length === 0) {
  console.log("説明文を埋める対象がありません。");
  process.exit(0);
}

console.log(`${targets.length}件の説明文を取得します...\n`);

const browser = await chromium.launch();

/**
 * ページ内から「タイトルの次に出てくる短い説明文」を探す。
 * h1 の直後の要素 → 明示的に説明らしいクラス → 最初のまとまった <p> の順。
 */
function extractTagline() {
  const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
  const ok = (s) =>
    s &&
    s.length >= 8 &&
    s.length <= 140 &&
    !/^(loading|読み込み|error|undefined|null)$/i.test(s) &&
    // ボタンだけ・記号だけの塊を弾く
    /[ぁ-んァ-ヶ一-龠a-zA-Z]{4,}/.test(s);

  const heading = document.querySelector("h1, header h2");
  const headingText = clean(heading?.textContent);

  const candidates = [];

  // 1) 見出しの直後の兄弟要素
  let sib = heading?.nextElementSibling;
  for (let i = 0; sib && i < 3; i++, sib = sib.nextElementSibling) {
    if (/^(SCRIPT|STYLE|NAV|BUTTON|FORM)$/.test(sib.tagName)) continue;
    candidates.push(clean(sib.textContent));
  }

  // 2) 説明用によく使われるクラス名
  for (const el of document.querySelectorAll(
    '[class*="subtitle" i],[class*="tagline" i],[class*="description" i],[class*="lead" i],[class*="hero"] p'
  )) {
    candidates.push(clean(el.textContent));
  }

  // 3) 最初のまとまった段落
  for (const p of [...document.querySelectorAll("p")].slice(0, 12)) {
    candidates.push(clean(p.textContent));
  }

  for (const c of candidates) {
    if (ok(c) && c !== headingText && !headingText.includes(c)) return c.slice(0, 140);
  }
  return null;
}

const found = [];
const missed = [];
let done = 0;

async function describe(app) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: "ja-JP",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  try {
    await page.goto(app.url, { waitUntil: "domcontentloaded", timeout: 40_000 });
    await page.waitForTimeout(1800);
    const text = await page.evaluate(extractTagline);
    done += 1;
    if (text) {
      app.description = text;
      found.push([app.day, app.slug, text]);
      console.log(`  ✓ [${done}/${targets.length}] Day ${app.day} ${app.slug}\n      ${text}`);
    } else {
      missed.push(app.slug);
      console.log(`  – [${done}/${targets.length}] Day ${app.day} ${app.slug} (見つからず)`);
    }
  } catch (err) {
    missed.push(app.slug);
    console.log(`  ✗ Day ${app.day} ${app.slug} — ${String(err).split("\n")[0]}`);
  } finally {
    await context.close();
  }
}

const queue = [...targets];
await Promise.all(
  Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    while (queue.length) {
      const app = queue.shift();
      if (app) await describe(app);
    }
  })
);

await browser.close();
await fs.writeFile(APPS_PATH, JSON.stringify(apps, null, 2) + "\n");

console.log(`\n埋まった: ${found.length}件 / 取れなかった: ${missed.length}件`);
if (missed.length) console.log(`手で書く必要があるもの: ${missed.join(", ")}`);
