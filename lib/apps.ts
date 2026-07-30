import fs from "node:fs";
import path from "node:path";
import raw from "@/data/apps.json";

/** data/apps.json の1件。ここを増やせばサイトに増える。 */
export type AppEntry = {
  day: number;
  title: string;
  /** 公開URL。Webアプリでないもの（CLIなど）は null */
  url: string | null;
  repo: string;
  description: string;
  tags: string[];
  slug: string;
  createdAt: string;
};

/** カードを描くのに必要な、スクショの有無まで含めた形。 */
export type AppCardData = AppEntry & { shot: string | null };

const SHOTS_DIR = path.join(process.cwd(), "public", "shots");

/**
 * スクショの有無はビルド時に実ファイルで判定する。
 * こうしておくと、まだ撮っていないアプリが壊れた画像にならない。
 */
export function getApps(): AppCardData[] {
  const existing = new Set<string>(
    fs.existsSync(SHOTS_DIR) ? fs.readdirSync(SHOTS_DIR) : []
  );

  return (raw as AppEntry[])
    .slice()
    .sort((a, b) => a.day - b.day)
    .map((app) => ({
      ...app,
      shot: existing.has(`${app.slug}.webp`) ? `/shots/${app.slug}.webp` : null,
    }));
}

export function getAllTags(apps: AppCardData[]): string[] {
  const counts = new Map<string, number>();
  for (const app of apps) {
    for (const tag of app.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ja"))
    .map(([tag]) => tag);
}
