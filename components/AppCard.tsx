import type { AppCardData } from "@/lib/apps";

/**
 * カード全体がアプリへのリンク。
 * 「Code」だけは別リンクなので、覆いかぶさるリンクの上に重ねている。
 */
export default function AppCard({ app }: { app: AppCardData }) {
  const href = app.url ?? app.repo;
  const isWeb = Boolean(app.url);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.8)]">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 z-10"
        aria-label={`Day ${app.day} ${app.title} を新しいタブで開く`}
      />

      <div className="relative aspect-16/10 overflow-hidden bg-surface-2">
        {app.shot ? (
          <img
            src={app.shot}
            alt={`${app.title} のスクリーンショット`}
            width={900}
            height={563}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-surface-2 to-surface">
            <span className="text-xs tracking-widest text-muted uppercase">
              {isWeb ? "no screenshot" : "cli / no preview"}
            </span>
          </div>
        )}

        <span className="absolute top-2.5 left-2.5 z-20 rounded-md bg-ink/85 px-2 py-1 font-mono text-[11px] font-semibold text-accent backdrop-blur-sm">
          Day {app.day}
        </span>

        {!isWeb && (
          <span className="absolute top-2.5 right-2.5 z-20 rounded-md bg-ink/85 px-2 py-1 text-[11px] text-muted backdrop-blur-sm">
            CLI
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h2 className="text-[15px] leading-snug font-semibold text-fg group-hover:text-accent">
          {app.title}
        </h2>

        {app.description && (
          <p className="line-clamp-2 text-[13px] leading-relaxed text-muted">
            {app.description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <div className="flex flex-wrap gap-1.5">
            {app.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded border border-line bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted"
              >
                {tag}
              </span>
            ))}
          </div>

          <a
            href={app.repo}
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-20 shrink-0 text-[11px] text-muted underline decoration-line underline-offset-2 transition hover:text-fg"
          >
            Code
          </a>
        </div>
      </div>
    </article>
  );
}
