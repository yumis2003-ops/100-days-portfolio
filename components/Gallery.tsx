"use client";

import { useMemo, useState } from "react";
import type { AppCardData } from "@/lib/apps";
import AppCard from "./AppCard";

export default function Gallery({
  apps,
  tags,
}: {
  apps: AppCardData[];
  tags: string[];
}) {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [newestFirst, setNewestFirst] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = apps.filter((app) => {
      if (activeTag && !app.tags.includes(activeTag)) return false;
      if (!q) return true;
      return (
        app.title.toLowerCase().includes(q) ||
        app.description.toLowerCase().includes(q) ||
        app.slug.includes(q) ||
        app.tags.some((t) => t.toLowerCase().includes(q)) ||
        String(app.day) === q
      );
    });
    return newestFirst ? filtered.slice().reverse() : filtered;
  }, [apps, query, activeTag, newestFirst]);

  return (
    <>
      <div className="sticky top-0 z-30 -mx-4 mb-8 border-b border-line/70 bg-ink/85 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="relative flex-1 min-w-[220px]">
              <span className="sr-only">アプリを検索</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="アプリ名・キーワード・日数で検索"
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg placeholder:text-muted focus:border-accent/60 focus:outline-none"
              />
            </label>

            <button
              type="button"
              onClick={() => setNewestFirst((v) => !v)}
              className="rounded-lg border border-line bg-surface px-3 py-2 text-xs text-muted transition hover:border-accent/50 hover:text-fg"
            >
              {newestFirst ? "新しい順 ↓" : "古い順 ↑"}
            </button>

            <span className="font-mono text-xs text-muted">
              {visible.length} / {apps.length}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <TagChip
              label="すべて"
              active={activeTag === null}
              onClick={() => setActiveTag(null)}
            />
            {tags.map((tag) => (
              <TagChip
                key={tag}
                label={tag}
                active={activeTag === tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              />
            ))}
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="py-20 text-center text-sm text-muted">
          該当するアプリがありません。
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((app) => (
            <AppCard key={app.slug} app={app} />
          ))}
        </div>
      )}
    </>
  );
}

function TagChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "rounded-full border px-2.5 py-1 text-xs transition " +
        (active
          ? "border-accent/60 bg-accent/15 text-accent"
          : "border-line bg-surface text-muted hover:border-accent/40 hover:text-fg")
      }
    >
      {label}
    </button>
  );
}
