import Gallery from "@/components/Gallery";
import { getAllTags, getApps } from "@/lib/apps";

const GITHUB_USER = "yumis2003-ops";

export default function Home() {
  const apps = getApps();
  const tags = getAllTags(apps);
  const liveCount = apps.filter((a) => a.url).length;
  const shotCount = apps.filter((a) => a.shot).length;

  return (
    <main className="mx-auto max-w-[1400px] px-4 pb-24 sm:px-6">
      <header className="pt-16 pb-10 sm:pt-24">
        <p className="font-mono text-xs tracking-[0.2em] text-accent uppercase">
          100 days challenge
        </p>

        <h1 className="mt-3 text-4xl leading-tight font-bold tracking-tight sm:text-6xl">
          100日で{apps.length}個の
          <br className="sm:hidden" />
          Webアプリを作った
        </h1>

        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted">
          毎日ひとつ、手を動かして作ったものの記録です。カードをクリックすると、
          実際に動くアプリがそのまま開きます。
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
          <Stat label="制作数" value={String(apps.length)} />
          <Stat label="公開中" value={String(liveCount)} />
          <Stat label="スクショ" value={`${shotCount} / ${liveCount}`} />
          <a
            href={`https://github.com/${GITHUB_USER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-line bg-surface px-4 py-2 text-sm text-muted transition hover:border-accent/50 hover:text-fg"
          >
            GitHub @{GITHUB_USER} ↗
          </a>
        </div>

        <div className="mt-8 h-1 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-linear-to-r from-accent to-accent-2"
            style={{ width: `${Math.min(100, apps.length)}%` }}
          />
        </div>
      </header>

      <Gallery apps={apps} tags={tags} />

      <footer className="mt-20 border-t border-line pt-8 text-xs text-muted">
        <p>
          スクリーンショットは各アプリの本番URLから自動取得しています（
          <code className="rounded bg-surface-2 px-1 py-0.5">npm run shots</code>
          ）。
        </p>
      </footer>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-2xl font-semibold text-fg">{value}</div>
      <div className="mt-0.5 text-[11px] tracking-wider text-muted uppercase">
        {label}
      </div>
    </div>
  );
}
