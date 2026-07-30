#!/usr/bin/env node
/**
 * GitHub のリポジトリ一覧から data/apps.json を更新する。
 *
 *   npm run apps:sync
 *
 * 既に apps.json にある項目の title / description / tags は上書きしない。
 * （手で直した内容が消えないようにするため）
 * 新しく増えたリポジトリだけを、公開URLを検証したうえで末尾に追加する。
 */
import fs from "node:fs/promises";
import path from "node:path";

const OWNER = process.env.GH_OWNER ?? "yumis2003-ops";
const ROOT = path.resolve(import.meta.dirname, "..");
const APPS_PATH = path.join(ROOT, "data", "apps.json");
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36";

/** Webアプリではないので公開URLを持たせないリポジトリ */
const NOT_WEB = new Set(["Idea-Manager"]);

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function fetchRepos() {
  const out = [];
  for (let page = 1; page <= 5; page++) {
    const res = await fetch(
      `https://api.github.com/users/${OWNER}/repos?per_page=100&sort=created&direction=asc&page=${page}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          ...(process.env.GITHUB_TOKEN
            ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
            : {}),
        },
      }
    );
    if (!res.ok) throw new Error(`GitHub API ${res.status} ${await res.text()}`);
    const batch = await res.json();
    out.push(...batch);
    if (batch.length < 100) break;
  }
  return out;
}

/** そのURLが 200 を返し、404ページでないかを確かめる。 */
async function probe(url) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    const body = (await res.text()).slice(0, 200_000);
    const title = body.match(/<title[^>]*>(.*?)<\/title>/is)?.[1]?.replace(/\s+/g, " ").trim();
    if (title && /404|not found/i.test(title)) return null;
    return { url, title: title || null };
  } catch {
    return null;
  }
}

/** homepage → <name>.vercel.app → github.io の順に試す。 */
async function resolveUrl(repo) {
  const cands = [];
  const hp = (repo.homepage ?? "").trim();
  if (hp) cands.push(hp.startsWith("http") ? hp.replace(/\/$/, "") : `https://${hp}`);
  cands.push(`https://${slugify(repo.name)}.vercel.app`);
  if (repo.has_pages) cands.push(`https://${OWNER}.github.io/${repo.name}/`);

  for (const url of cands) {
    const hit = await probe(url);
    if (hit) return hit;
  }
  return null;
}

const repos = await fetchRepos();
const existing = JSON.parse(await fs.readFile(APPS_PATH, "utf8"));
const bySlug = new Map(existing.map((a) => [a.slug, a]));

const added = [];
const stillMissing = [];
let day = Math.max(0, ...existing.map((a) => a.day));

for (const repo of repos) {
  const slug = slugify(repo.name);
  if (bySlug.has(slug)) continue;

  const resolved = NOT_WEB.has(repo.name) ? null : await resolveUrl(repo);
  if (!resolved && !NOT_WEB.has(repo.name)) stillMissing.push(repo.name);

  day += 1;
  const entry = {
    day,
    title: resolved?.title || repo.name.replace(/[-_]+/g, " "),
    url: resolved?.url ?? null,
    repo: repo.html_url,
    description: (repo.description ?? "").slice(0, 160),
    tags: [repo.language || "その他"],
    slug,
    createdAt: repo.created_at.slice(0, 10),
  };
  existing.push(entry);
  bySlug.set(slug, entry);
  added.push(entry);
}

existing.sort((a, b) => a.day - b.day);
await fs.writeFile(APPS_PATH, JSON.stringify(existing, null, 2) + "\n");

console.log(`apps.json: 全${existing.length}件 (新規${added.length}件)`);
for (const a of added) console.log(`  + Day ${a.day} ${a.slug} → ${a.url ?? "(URL未解決)"}`);
if (stillMissing.length)
  console.log(`\n公開URLが見つからなかったリポジトリ: ${stillMissing.join(", ")}`);
if (added.length) console.log(`\n次は: npm run shots:missing`);
